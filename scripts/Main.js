function executeWidgetCode() {	
    require(['DS/DataDragAndDrop/DataDragAndDrop'], function(DataDragAndDrop) {
        var myWidget = {
            displayData: function(obj) {
                var contentDiv = document.getElementById("content-display");
                var dropZoneUI = document.getElementById("drop-zone-ui");
                
                dropZoneUI.style.display = "none";
                contentDiv.style.display = "block";
				console.log("obj------------->", obj);
				console.log("obj.data-------->", obj.data);
				console.log("obj.data.items-->", obj.data.items);
                
                if(obj.data.items[0].objectType !== "VPMReference"){
                    contentDiv.innerHTML = `
                        <div class="data-card error-state">
                            <h4>Invalid Selection</h4>
                            <p>Please drop a VPMReference Product.</p>
                            <button class="btn-text" onclick="location.reload()">Back</button>
                        </div>`;
                } else {
                    // Modern Card UI instead of Table
                    var cardHTML = `
                        <div class="data-card">
                            <div class="card-header">
                                <h3>Object Details</h3>
                                <button class="btn-text" onclick="location.reload()">Reset</button>
                            </div>
                            <div class="card-body">
                                <div class="prop-row"><span>Type</span><strong>${obj.data.items[0].objectType}</strong></div>
                                <div class="prop-row"><span>Name</span><strong>${obj.data.items[0].displayName}</strong></div>
                                <div class="prop-row"><span>ID</span><code class="id-badge">${obj.data.items[0].objectId}</code></div>
                            </div>
                            <div class="card-footer">
                                <button id="callApiBtn" class="btn-primary">Send To Vertex</button>
                            </div>
                            <div id="apiResult"></div>
                        </div>`;
                    contentDiv.innerHTML = cardHTML;
                }

                const apiBtn = document.getElementById("callApiBtn");
                if (apiBtn) {
                    apiBtn.onclick = function () {
                        if (confirm("Send " + obj.data.items[0].displayName + " to Vertex?")) {
                            var url = "https://www.plmtrainer.com:444/Vertex-0.0.1-SNAPSHOT/vertexvis/v1/exportdata?id=" + obj.data.items[0].objectId;
                            fetch(url, { method: "GET" })
                            .then(res => res.json())
                           .then(data => {
                                const formattedSummary = data["Summary Lines"].replace(/\n/g, "<br>");
                                document.getElementById("apiResult").innerHTML = "<div class='success-box'>" + formattedSummary + "</div>";
                            })
                            .catch(err => {
                                document.getElementById("apiResult").innerHTML = "<p class='error-text'>Error: " + err.message + "</p>";
                            });
                        }
                    };
                }
            },

            onLoad: function() {
                myWidget.dragZone();	
            },

            dragZone: function() {
                var dropElement = widget.body;
                DataDragAndDrop.droppable(dropElement, {
                    drop: function(data){
                        var obj = JSON.parse(data);
                        myWidget.displayData(obj);
                        widget.body.classList.remove("drag-over");
                    },
                    enter: function(){ widget.body.classList.add("drag-over"); },
                    leave: function(){ widget.body.classList.remove("drag-over"); }
                });	
            }
        }; 			
        widget.addEvent('onLoad', myWidget.onLoad);
    });
}
