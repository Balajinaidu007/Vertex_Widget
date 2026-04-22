function executeWidgetCode() {

    require(['DS/DataDragAndDrop/DataDragAndDrop'], function (DataDragAndDrop) {

        var myWidget = {

            selectedItemId: null,

            displayData: function (obj) {

                var contentDiv = document.getElementById("content-display");
                var dropZoneUI = document.getElementById("drop-zone-ui");

                dropZoneUI.style.display = "none";
                contentDiv.style.display = "block";

                console.log("Dropped Object:", obj);

                // ✅ Validation
                if (!obj.data || !obj.data.items || obj.data.items.length === 0 ||
                    obj.data.items[0].objectType !== "VPMReference") {

                    contentDiv.innerHTML = `
                        <div class="data-card error-state">
                            <h4>Invalid Selection</h4>
                            <p>Please drop a VPMReference Product.</p>
                            <button onclick="location.reload()">Back</button>
                        </div>`;
                    return;
                }

                const item = obj.data.items[0];

                // ✅ UI with Viewer placeholder
                contentDiv.innerHTML = `
                    <div class="data-card">
                        <div class="card-header">
                            <h3>${item.displayName}</h3>
                            <button onclick="location.reload()">Reset</button>
                        </div>

                        <div class="card-body" style="height:400px;">
                            <div id="viewerContainer" style="width:100%; height:100%; display:none;">
                                <vertex-viewer 
                                    id="vertexViewer"
                                    style="width:100%; height:100%;"
                                    client-id="YOUR_CLIENT_ID">
                                </vertex-viewer>
                            </div>

                            <div id="loader" style="text-align:center; padding-top:120px;">
                                <p>Ready to send data to Vertex</p>
                            </div>
                        </div>

                        <div class="card-footer">
                            <button id="callApiBtn">Send To Vertex</button>
                        </div>

                        <div id="apiResult"></div>
                    </div>
                `;

                // ✅ Button click
                document.getElementById("callApiBtn").onclick = () => {
                    myWidget.callVertexAPI(item);
                };
            },

            // ✅ API Call
            callVertexAPI: function (item) {

                if (!confirm("Send " + item.displayName + " to Vertex?")) return;

                const loader = document.getElementById("loader");
                const resultDiv = document.getElementById("apiResult");

                loader.innerHTML = "<p>Sending data to Vertex...</p>";

                const url = "https://www.plmtrainer.com:444/Vertex-0.0.1-SNAPSHOT/vertexvis/v1/exportdata?id=" + item.objectId;

                fetch(url, { method: "GET" })
                    .then(res => res.json())
                    .then(data => {

                        console.log("API Response:", data);

                        // ✅ Expecting stream key from API
                        const streamKey = data.streamKey || data["stream-key"];

                        if (!streamKey) {
                            throw new Error("Stream key not found in API response");
                        }

                        loader.style.display = "none";
                        document.getElementById("viewerContainer").style.display = "block";

                        myWidget.loadViewer(streamKey);

                        if (data["Summary Lines"]) {
                            const formatted = data["Summary Lines"].replace(/\n/g, "<br>");
                            resultDiv.innerHTML = `<div class='success-box'>${formatted}</div>`;
                        }

                    })
                    .catch(err => {
                        console.error(err);
                        loader.innerHTML = "<p style='color:red;'>Error: " + err.message + "</p>";
                    });
            },

            // ✅ Load Vertex Viewer
            loadViewer: async function (streamKey) {

                const viewer = document.getElementById("vertexViewer");

                if (!viewer) {
                    console.error("Viewer not found");
                    return;
                }

                try {
                    await customElements.whenDefined('vertex-viewer');

                    await viewer.load(`urn:vertex:stream-key:${streamKey}`);

                    console.log("Viewer loaded");

                    myWidget.attachSelection(viewer);

                } catch (err) {
                    console.error("Viewer Load Error:", err);
                }
            },

            // ✅ Selection logic
            attachSelection: function (viewer) {

                viewer.addEventListener('tap', async (event) => {

                    const scene = await viewer.scene();
                    const raycaster = scene.raycaster();

                    const result = await raycaster.hitItems(event.detail.position);
                    const [hit] = result.hits;

                    if (hit) {

                        const itemId = hit.itemId?.hex;

                        await scene.items(op => [
                            ...(myWidget.selectedItemId
                                ? [op.where(q => q.withItemId(myWidget.selectedItemId)).deselect()]
                                : []),
                            op.where(q => q.withItemId(itemId)).select()
                        ]).execute();

                        myWidget.selectedItemId = itemId;

                    } else if (myWidget.selectedItemId) {

                        await scene.items(op => [
                            op.where(q => q.withItemId(myWidget.selectedItemId)).deselect()
                        ]).execute();

                        myWidget.selectedItemId = null;
                    }
                });
            },

            // ✅ Drag & Drop setup
            dragZone: function () {

                var dropElement = widget.body;

                DataDragAndDrop.droppable(dropElement, {

                    drop: function (data) {
                        var obj = JSON.parse(data);
                        myWidget.displayData(obj);
                        widget.body.classList.remove("drag-over");
                    },

                    enter: function () {
                        widget.body.classList.add("drag-over");
                    },

                    leave: function () {
                        widget.body.classList.remove("drag-over");
                    }
                });
            },

            onLoad: function () {
                myWidget.dragZone();
            }
        };

        widget.addEvent('onLoad', myWidget.onLoad);
    });
}
