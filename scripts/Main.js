function executeWidgetCode() {

    console.log("🚀 Widget script started");

    require([], function () {

        var myWidget = {

            STREAM_KEY: "tlnqapBHDN4zsGNcVkDfe9XesQ4BBrRl8yAd",
            CLIENT_ID: "08F675C4AACE8C0214362DB5EFD4FACAFA556D463ECA00877CB225157EF58BFA",

            selectedItemId: null,

            loadVertexScripts: function () {

                return new Promise((resolve) => {

                    if (window.vertexLoaded) {
                        resolve();
                        return;
                    }

                    const link = document.createElement("link");
                    link.rel = "stylesheet";
                    link.href =
                        "https://cdn.jsdelivr.net/npm/@vertexvis/viewer@0.23.x/dist/viewer/viewer.css";
                    document.head.appendChild(link);

                    const script = document.createElement("script");
                    script.type = "module";
                    script.innerHTML = `
                        import { defineCustomElements } from 'https://cdn.jsdelivr.net/npm/@vertexvis/viewer@0.23.x/dist/esm/loader.js';
                        window.defineVertex = async () => {
                            await defineCustomElements(window);
                        };
                    `;
                    document.body.appendChild(script);

                    setTimeout(async () => {
                        if (window.defineVertex) {
                            await window.defineVertex();
                            window.vertexLoaded = true;
                        }
                        resolve();
                    }, 500);
                });
            },

            loadViewer: async function () {

                const viewer = document.getElementById("vertexViewer");

                if (!viewer) {
                    console.error("❌ Viewer not found");
                    return;
                }

                try {
                    await myWidget.loadVertexScripts();
                    await customElements.whenDefined("vertex-viewer");

                    await viewer.load(
                        `urn:vertex:stream-key:${myWidget.STREAM_KEY}`
                    );

                    myWidget.enableSelection(viewer);

                } catch (e) {
                    console.error("❌ Load error:", e);
                }
            },

            enableSelection: function (viewer) {

                viewer.addEventListener("tap", async (event) => {

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

            onLoad: function () {

                console.log("📌 Widget onLoad triggered");

                var contentDiv = document.getElementById("content-display");

                contentDiv.innerHTML = `
                    <div style="width:100vw;height:100vh;display:flex;flex-direction:column;">
                        <h4>Vertex Viewer</h4>
                        <div style="flex:1;">
                            <vertex-viewer id="vertexViewer"
                                style="width:100%;height:100%;">
                            </vertex-viewer>
                        </div>
                    </div>
                `;

                setTimeout(() => {
                    myWidget.loadViewer();
                }, 300);
            }
        };

        widget.addEvent("onLoad", myWidget.onLoad);
    });
}