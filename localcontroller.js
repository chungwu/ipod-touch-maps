function LocalSearchController(mapController, searchController) {
    this.mapController = mapController;
    this.searchController = searchController;

    this.localSearchPanel = $("localSearchPanel");

    var prevButton = $("lastBusinessButton");
    prevButton.onclick = functify(this, this.showPrevResult);

    var nextButton = $("nextBusinessButton");
    nextButton.onclick = functify(this, this.showNextResult);

    var closeButton = $("closeLocalSearchButton");
    closeButton.onclick = functify(this, this.hideLocalSearchPanel);

    this.businessDescription = $("businessDescription");
}

LocalSearchController.SELECTED_ICON_URL = "http://labs.google.com/ridefinder/images/mm_20_yellow.png";
LocalSearchController.RESULT_ICON_URL = "http://labs.google.com/ridefinder/images/mm_20_red.png";

LocalSearchController.prototype.search = function(query) {
    debug("LOCAL SEARCH on " + query);
    this.mapController.localSearch(query, functify(this, this.showLocalSearchPanel));
};

LocalSearchController.prototype.showLocalSearchPanel = function(results) {
    if (!results || results.length == 0) {
	window.alert("Sorry, but we couldn't find any businesses here for you :'(");
	this.hideLocalSearchPanel();
	return;
    }

    this.searchController.hideSearchPanel();
    this.localSearchPanel.style.display = "block";
    var controlsPanelWidth = $("localSearchControlsPanel").offsetWidth;
    $("businessDescription").style.width = this.localSearchPanel.offsetWidth - 10 - controlsPanelWidth + "px";


    $("searchContent").style.display = "block";
    $("searchContent").innerHTML = "";

    this.currentResults = results;

    this.fillSearchContent();

    this.currentResult = 0;
    this.showResult(this.currentResult);
};

LocalSearchController.prototype.hideLocalSearchPanel = function() {
    this.searchController.showSearchPanel();
    this.localSearchPanel.style.display = "none";
    $("searchContent").style.display = "none";
    this.mapController.clearLocalSearch();
};

LocalSearchController.prototype.showPrevResult = function() {
    if (this.currentResult == 0) {
	return;
    } 
    this.currentResults[this.currentResult].marker.setImage(LocalSearchController.RESULT_ICON_URL);
    this.currentResult--;
    this.showResult(this.currentResult);
};

LocalSearchController.prototype.showResult = function(index) {
    var result = this.currentResults[index];

    $("lastBusinessButton").className = (index == 0) ? "buttonDisabled" : "button";
    $("nextBusinessButton").className = (index == this.currentResults.length-1) ? "buttonDisabled" : "button";

    var content = [];
    content.push((index + 1) + ". ");
    content.push("<strong>" + result.title + "</strong>");

    if (result.streetAddress) {
	content.push(" at " + result.streetAddress);
    }

    if (result.phoneNumbers && result.phoneNumbers.length > 0) {
	content.push("; " + result.phoneNumbers[0].number);
    }
	
    this.businessDescription.innerHTML = content.join("");

    $("businessPopupTitle").innerHTML = "<strong>" + result.title + "</strong>";
    $("businessPopupAddress").innerHTML = result.streetAddress + "<br>" + result.city + ", " + result.region;
    $("businessPopupNumbers").innerHTML = this.buildNumbersString(result.phoneNumbers);

    var self = this;
    $("setBusinessAsCurrentButton").onclick = function() {
	self.hideLocalSearchPanel();
	var address = result.streetAddress + " " + result.city + " " + result.region;
	self.searchController.gotoLocation(new Location(address, result.titleNoFormatting));
    };

    $("moreBusinessButton").onclick = function() {
	window.open(result.url);
    };

    //    var popup = $("businessPopup").cloneNode(true);
    //    popup.style.display = "block";
    //    result.marker.openInfoWindow(popup);

    result.marker.setImage(LocalSearchController.SELECTED_ICON_URL);
    this.mapController.panMapTo(result.marker.getLatLng());
};

LocalSearchController.prototype.buildNumbersString = function(numbers) {
    var str = [];
    for (var i=0; i<numbers.length; i++) {
	var number = numbers[i];
	if (number.type) {
	    str.push(number.type + ": ");
	}
	str.push(number.number + "<br>");
    }
    return str.join("");
};

LocalSearchController.prototype.fillSearchContent = function() {
    var content = [];

    for (var i=0; i<this.currentResults.length; i++) {
	var result = this.currentResults[i];
	content.push("<strong>" + result.title + "</strong><br>");
	content.push(result.streetAddress + "<br>" + result.city + ", " + result.region);
	content.push("<br>");
	content.push(this.buildNumbersString(result.phoneNumbers));
	content.push("<a href='" + result.url + "' target=_blank>Link</a>");
	content.push("<hr>");
    }

    $("searchContent").innerHTML = content.join("");
};

LocalSearchController.prototype.showNextResult = function() {
    if (this.currentResult == this.currentResults.length-1) {
	return;
    }
    this.currentResults[this.currentResult].marker.setImage(LocalSearchController.RESULT_ICON_URL);
    this.currentResult++;
    this.showResult(this.currentResult);
};
