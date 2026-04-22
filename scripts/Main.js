function executeWidgetCode() {

    require(['DS/DataDragAndDrop/DataDragAndDrop'], function (DataDragAndDrop) {

        var myWidget = {

            selectedItemId: null,

            // 🔹 HARD-CODE YOUR STREAM KEY HERE
            STREAM_KEY: "tlnqapBHDN4zsGNcVkDfe9XesQ4BBrRl8yAd",

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

                // ✅ Viewer UI directly
                contentDiv.innerHTML = `
                    <div class="data-card">
                        <div class="card-header">
                            <h3>${item.displayName}</h3>
                            <button onclick="location.reload()">Reset</button>
                        </div>

                        <div class="card-body" style="height:500px;">
                            <vertex-viewer 
                                id="vertexViewer"
                                style="width:100%; height:100%;"
                                client-id="08F675C4AACE8C0214362DB5EFD4FACAFA556D463ECA00877CB225157EF58BFA"
                            </vertex-viewer>
                        </div>
                    </div>
                `;

                // 🔹 Load viewer immediately
                myWidget.loadViewer();
            },

            // ✅ Load Vertex Viewer with hardcoded stream key
            loadViewer: async function () {

                const viewer = document.getElementById("vertexViewer");

                if (!viewer) {
                    console.error("Viewer not found");
                    return;
                }

                try {
                    await customElements.whenDefined('vertex-viewer');

                    await viewer.load(
                        `urn:vertex:stream-key:${myWidget.STREAM_KEY}`
                    );

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

            // ✅ Drag & Drop
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
