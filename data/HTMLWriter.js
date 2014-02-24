addon.port.on("dataPoints", function (arg) {
	var table =document.getElementById("table");
	writeText(document.getElementById("rate"), arg.rate);
	for (var i = 0;i<arg.map.index.length;i++){
		if (table.rows.length < arg.map.index.length+1){		//Creates table space	
			var row = table.insertRow(-1);
			row.insertCell(0);
			row.insertCell(1);
		}
		writeText(table.rows[i+1].cells[0], getTime((arg.map.index[0]-arg.map.index[i])*30, arg.currentTime));
		writeText(table.rows[i+1].cells[1],arg.map.counts[i]);
	}
});

//Writes the string
addon.port.on("update", function (arg) {
	var contentElement = document.getElementById("content");
	writeText(contentElement,arg);
});

function writeText(element, string){
	element.textContent=string;
}

function getTime(seconds, currentTime){
	var newMS = new Date(currentTime-(seconds*1000));
	return newMS.toLocaleTimeString();
}