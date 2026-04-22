function executeWidgetCode() {

    require(['DS/DataDragAndDrop/DataDragAndDrop'], function (DataDragAndDrop) {

        var myWidget = {

            // 🔥 REPLACE THESE
            STREAM_KEY: "tlnqapBHDN4zsGNcVkDfe9XesQ4BBrRl8yAd",
            CLIENT_ID: "08F675C4AACE8C0214362DB5EFD4FACAFA556D463ECA00877CB225157EF58BFA",

            selectedItemId: null,

            displayData: function (obj) {

                var contentDiv = document.getElementById("content-display");
                var dropZoneUI = document.getElementById("drop-zone-ui");

                dropZoneUI.style.display = "none";
                contentDiv.style.display = "block";

                console.log("Dropped:", obj);

                // ✅ Validate object
                if (!obj.data || !obj.data.items || obj.data.items.length === 0 ||
                    obj.data.items[0].objectType !== "VPMReference") {

                    contentDiv.innerHTML = `
                        <div>
                            <h3>Invalid Selection</h3>
                            <button onclick="location.reload()">Back</button>
                        </div>`;
                    return;
                }

                const item = obj.data.items[0];

                // ✅ Inject Viewer
                contentDiv.innerHTML = `
                    <div>
                        <h3>${item.displayName}</h3>
                        <button onclick="location.reload()">Reset</button>

                        <div class="viewer-container">
                            <vertex-viewer 
                                id="vertexViewer"
                                style="width:100%; height:100%;"
                                client-id="${myWidget.CLIENT_ID}">
                            </vertex-viewer>
                        </div>
                    </div>
                `;

                // 🔥 Load viewer safely
                setTimeout(() => {
                    myWidget.loadViewer();
                }, 500);
            },

            loadViewer: async function () {

                const viewer = document.getElementById("vertexViewer");

                if (!viewer) {
                    console.error("Viewer not found");
                    return;
                }

                try {
                    await customElements.whenDefined('vertex-viewer');

                    console.log("Loading stream...");

                    await viewer.load(
                        `urn:vertex:stream-key:${myWidget.STREAM_KEY}`
                    );

                    console.log("Viewer loaded");

                    myWidget.enableSelection(viewer);

                } catch (e) {
                    console.error("Load error:", e);
                }
            },

            enableSelection: function (viewer) {

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
