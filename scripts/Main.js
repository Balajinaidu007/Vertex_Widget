function executeWidgetCode() {

    console.log("🚀 Widget script started");

    require([], function () {

        var myWidget = {

            // 🔥 CONFIG (hardcoded)
            STREAM_KEY: "tlnqapBHDN4zsGNcVkDfe9XesQ4BBrRl8yAd",
            CLIENT_ID: "08F675C4AACE8C0214362DB5EFD4FACAFA556D463ECA00877CB225157EF58BFA",

            // ✅ Load Vertex scripts
            loadVertexScripts: function () {

                console.log("🔧 Loading Vertex scripts...");

                return new Promise((resolve) => {

                    if (window.vertexLoaded) {
                        console.log("✅ Vertex already loaded");
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
                            console.log("✅ Vertex custom elements defined");
                        };
                    `;

                    document.body.appendChild(script);

                    setTimeout(async () => {
                        if (window.defineVertex) {
                            await window.defineVertex();
                            window.vertexLoaded = true;
                            resolve();
                        } else {
                            console.error("❌ Vertex init failed");
                        }
                    }, 500);
                });
            },

            // ✅ Load viewer
            loadViewer: async function () {

                console.log("🚀 loadViewer called");

                const viewer = document.getElementById("vertexViewer");

                if (!viewer) {
                    console.error("❌ vertexViewer not found");
                    return;
                }

                await myWidget.loadVertexScripts();

                await customElements.whenDefined("vertex-viewer");

                console.log("🌐 Loading stream:", myWidget.STREAM_KEY);

                await viewer.load(
                    `urn:vertex:stream-key:${myWidget.STREAM_KEY}`
                );

                console.log("🎉 Viewer loaded successfully");
            },

            // ✅ Init
            onLoad: function () {

                console.log("📌 Widget onLoad triggered");

                const content = document.getElementById("content-display");

                content.innerHTML = `
                    <div style="width:100%; height:100%;">
                        <div style="padding:10px;">
                            <h3>Vertex Viewer (Hardcoded)</h3>
                        </div>

                        <div style="width:100%; height:90vh;">
                            <vertex-viewer
                                id="vertexViewer"
                                style="width:100%; height:100%;"
                                client-id="${myWidget.CLIENT_ID}">
                            </vertex-viewer>
                        </div>
                    </div>
                `;

                myWidget.loadViewer();
            }
        };

        widget.addEvent("onLoad", myWidget.onLoad);
    });
}