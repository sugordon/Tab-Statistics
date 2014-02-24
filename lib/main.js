var tabs = require("sdk/tabs");
var widgets = require("sdk/widget");
var timer = require("sdk/timers");
var notifications = require("sdk/notifications");
var ss = require("sdk/simple-storage");
var data = require("sdk/self").data;

//Variable Definitions
var tabCount = initialize();
//If the stored array is undefined, create a new one
if (!ss.storage.tabArray){
	ss.storage.tabArray = [];
	ss.storage.tabTime = [];
	//Initial Tab Conditions
	ss.storage.tabArray[0] = tabCount;
	ss.storage.tabTime[0] = new Date().getTime();
}
var avgTabs = calculateAverage();
var maxTime = require("sdk/simple-prefs").prefs["saveTabs"];	//Moving average, 120 = 1 hr
var saveTime = new Date().getTime();

//Interval for finding the average
timer.setInterval(function updateTime() {
	ss.storage.tabArray.push(tabCount);
	if (maxTime != -1){
		while (ss.storage.tabArray.length > maxTime){
			ss.storage.tabArray.shift();
		}
	}
	avgTabs = calculateAverage();
	saveTime = new Date().getTime();
	updateContent();
	}, 30000);		//30 seconds
	
//Calculates the average
function calculateAverage(){
	var avgCalculate;
	var aggregateTabs = 0;
	for (var i = 0;i<ss.storage.tabArray.length;i++){
		aggregateTabs += ss.storage.tabArray[i];
	}
	avgCalculate = aggregateTabs/ss.storage.tabArray.length;
	//Rounds the Average tabs
	avgCalculate = + avgCalculate.toFixed(2);
	return avgCalculate;
}
	
function initialize(){
	var localTabCount = 0;
	for (tab in tabs){
		localTabCount++;
	}
	return localTabCount;
}

//Updates the widget
function updateContent() {
	// totalTabs.content = "Total: " + tabCount + ", Avg: " + avgTabs;
	totalTabs.port.emit("update", "Total: " + tabCount + ", Avg: " + avgTabs);
	totalTabs.width = 75+(tabCount.toString().length+avgTabs.toString().length)*5;
}

// Listen for tab openings.
tabs.on("open", function onOpen(tab) {
	tabCount++;
	updateContent();
});

tabs.on("close", function onOpen(tab) {
	tabCount--;
	updateContent();
});


var graphPanel = require("sdk/panel").Panel({
  width: 250,
  height: 310,
  contentURL: data.url("Countpanel.html"),
});

//When the panel is revealed
graphPanel.on("show", function() {
	var sendIt = new Object();
	var finalValue = ss.storage.tabArray[ss.storage.tabArray.length-1];
	var initialValue = ss.storage.tabArray[0];
	var rate = (finalValue - initialValue)*720/ss.storage.tabArray.length;		//Tabs per minute
	sendIt.rate = + rate.toFixed(2);
	sendIt.map = getSendObject();
	sendIt.currentTime = saveTime;
	graphPanel.port.emit("dataPoints", sendIt);
});

function getSendObject(){
	var sendMap = new Object();
	sendMap.counts = [];
	sendMap.index = [];
	sendMap.counts[0] = ss.storage.tabArray[ss.storage.tabArray.length-1];
	sendMap.index[0] = ss.storage.tabArray.length-1;	//Final index of the tabs
	var previousCount = sendMap.counts[0];
	for (var i = ss.storage.tabArray.length-1;i>=0;i--){	//Loops through all array elements in reverse
		if (ss.storage.tabArray[i] > previousCount+5 || ss.storage.tabArray[i] < previousCount-5){
			var sendIndex = sendMap.index.length;	//Current index in the index and count array
			if (sendIndex > 6){
				break;
			}
			//Saves the index of the change
			sendMap.index[sendIndex] = i;
			previousCount = ss.storage.tabArray[i];
			sendMap.counts[sendIndex] = ss.storage.tabArray[i];
		}
	}
	return sendMap;
}

var totalTabs = widgets.Widget({
	id: "tab-stats",
	label: "Tab Statistics",
	// content: "Total: " + tabCount + ", Avg: " + avgTabs,
	contentURL: data.url("Countcontent.html"),
	width: 75+(tabCount.toString().length+avgTabs.toString().length)*5,
	panel: graphPanel
});

//Initial conditions of the text
updateContent();

// Listens for the preference changes
function onPrefChange(prefName) {
    maxTime = require("sdk/simple-prefs").prefs["saveTabs"];
}
require("sdk/simple-prefs").on("saveTabs", onPrefChange);
require("sdk/simple-prefs").on("reset", function(){
	ss.storage.tabArray = [];
	ss.storage.tabArray[0] = tabCount;
	avgTabs = tabCount;
	updateContent();
});