function bootstrap() {
    debug("Bootstrapping...");
    google.load("maps", "2");
    google.load("search", "1");
    google.setOnLoadCallback(start);
}

function start() {
    map = new GMap2(document.getElementById("map"));
    map.setCenter(new GLatLng(37.4419, -122.1419), 13);

    handler = new MapSurfaceController(map);

    var viewController = new ViewController(handler);
    var searchController = new SearchController(handler);
    searchController.gotoLastLocation();

    //if (readCookie("firstTime") == null) {
	new InstructionsPanel().showPrompt();
	//}
    createCookie("firstTime", "false", 100);
}


function functify(object, func) {
    return function() {
	func.apply(object, arguments);
    };
}

function debug(str) {
    if (console) {
	console.debug(str);
    }
}

function showPromptGlass() {
    $("promptGlass").style.display = "block";
}

function hidePromptGlass() {
    $("promptGlass").style.display = "none";
}

function $(id) {
    return document.getElementById(id);
}


// Cookie-related functions grabbed from QuirksMode here:
// http://www.quirksmode.org/js/cookies.html
function createCookie(name,value,days) {
    var expires = "";
    if (days) {
	var date = new Date();
	date.setTime(date.getTime()+(days*24*60*60*1000));
	expires = "; expires="+date.toGMTString();
    }
    document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
	var c = ca[i];
	while (c.charAt(0)==' ') c = c.substring(1,c.length);
	if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}function DirectionsController(mapController, searchController, locationManager) {
    this.mapController = mapController;
    this.searchController = searchController;
    this.locationManager = locationManager;

    this.directionsPanel = $("directionsPanel");
  
    var lastStepButton = $("lastStepButton");
    lastStepButton.onclick = functify(this, this.showLastStep);

    var nextStepButton = $("nextStepButton");
    nextStepButton.onclick = functify(this, this.showNextStep);

    var closeDirectionsButton = $("closeDirectionsButton");
    closeDirectionsButton.onclick = functify(this, this.hideDirectionsPanel);

    this.stepDescription = $("stepDescription");
}

DirectionsController.prototype.showDirections = function(fromLocation, toLocation) {
    $("searchContent").innerHTML = "";
    this.mapController.getDirections(fromLocation.address, toLocation.address,
				     this.createHandleDirectionsLoadedFunction(fromLocation, toLocation));
};

DirectionsController.prototype.showDirectionsPanel = function(startLocation, endLocation, route) {
    this.searchController.hideSearchPanel();
    this.directionsPanel.style.display = "block";
    $("searchContent").style.display = "block";

    var controlsPanelWidth = $("directionsControlsPanel").offsetWidth;
    $("stepDescription").style.width = this.directionsPanel.offsetWidth - 10 - controlsPanelWidth + "px";

    this.currentRoute = route;
    this.startLocation = startLocation;
    this.endLocation = endLocation;

    this.currentStep = -1;
    this.showStep(this.currentStep);
};

DirectionsController.prototype.hideDirectionsPanel = function() {
    this.searchController.showSearchPanel();
    this.directionsPanel.style.display = "none";
    $("searchContent").style.display = "none";
    this.mapController.clearDirections();
};

DirectionsController.prototype.showLastStep = function() {
    if (this.currentStep == -1) {
	return;
    } 

    this.currentStep--;
    this.showStep(this.currentStep);
};

DirectionsController.prototype.showStep = function(index) {
    $("lastStepButton").className = (index == -1) ? "buttonDisabled" : "button";
    $("nextStepButton").className = (index == this.currentRoute.getNumSteps()-1) ? "buttonDisabled" : "button";

    if (index == -1) {
	this.stepDescription.innerHTML = 
	"<strong>" + this.startLocation.getLongName() + "</strong> to <strong>" +
	this.endLocation.getLongName() + "</strong> - " + this.currentRoute.getSummaryHtml();
    } else {
	var step = this.currentRoute.getStep(index);
	var content = (index+1) + ". " + step.getDescriptionHtml();
	content += " - " + step.getDistance().html +  " (" + step.getDuration().html + ")";
	
	this.stepDescription.innerHTML = content;

	var latlng = step.getLatLng();
	this.mapController.showStepMarker(latlng);
    }
};

DirectionsController.prototype.showNextStep = function() {
    if (this.currentStep == this.currentRoute.getNumSteps()-1) {
	return;
    }

    this.currentStep++;
    this.showStep(this.currentStep);
};

DirectionsController.prototype.createHandleDirectionsLoadedFunction = function(startLocation, endLocation) {
    var self = this;
    return function(route) {

	if (!route) {
	    window.alert("Could not get driving directions!  Sorry :'(");
	    return;
	}

	var currentLocation = self.searchController.currentLocation;
	if (currentLocation == startLocation) {
	    self.locationManager.addLocation(endLocation);
	} else {
	    self.locationManager.addLocation(startLocation);
	}

	self.showDirectionsPanel(startLocation, endLocation, route);
    };
};function LocalSearchController(mapController, searchController) {
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
function SingleLocationPicker(locationManager) {
    this.locationManager = locationManager;

    this.prompt = $("singleLocationPicker");
    this.input = $("singleLocationInput");
    this.select = $("singleLocationSelect");

    this.input.onchange = functify(this, this.submitTextLocation);
    this.select.onchange = functify(this, this.submitSelectLocation);

    var cancelButton = $("singleLocationCancel");
    cancelButton.onclick = functify(this, this.hidePrompt);
}

SingleLocationPicker.prototype.showPrompt = function(callback) {
    this.callback = callback;

    this.input.value = "";
    this.fillSelect();
    this.prompt.style.display = "block";
    showPromptGlass();
    this.input.focus();
};

SingleLocationPicker.prototype.fillSelect = function() {
    this.select.options.length = 0;
    this.select.options[0] = new Option("Pick used location", "");

    var locations = this.locationManager.getLocations();
    for (var i=0; i<locations.length; i++) {
	var locIndex = locations.length - 1 - i;
	this.select.options[i+1] = new Option(locations[locIndex].getLongName());
    }
};

SingleLocationPicker.prototype.hidePrompt = function() {
    this.input.value = "";
    this.prompt.style.display = "none";
    hidePromptGlass();
};

SingleLocationPicker.prototype.submitTextLocation = function() {
    var value = this.input.value;
    if ("" == value) {
	return;
    }
    this.submitLocation(new Location(value));
};

SingleLocationPicker.prototype.submitSelectLocation = function() {
    if (this.select.selectedIndex <= 0) {
	return;
    }
    var index = this.select.selectedIndex;
    var locations = this.locationManager.getLocations();
    this.submitLocation(locations[locations.length - index]);
};

SingleLocationPicker.prototype.submitLocation = function(location) {
    this.hidePrompt();
    if (this.callback) {
	this.callback(location);
    }
};

SingleLocationPicker.prototype.getLocation = function() {
    return this.input.value;
};


function LocationManager() {
    var values = readCookie("locations");
    if (values) {
	debug("Read from cookie: " + values);
	this.locations = this.fromCookieString(values);
    } else {
	this.locations = [];
    }
}

LocationManager.MAX_LOCATIONS = 20;
LocationManager.LOCATION_DELIMITER = "$$$";

LocationManager.prototype.addLocation = function(location) {
    var index = this.getLocationIndex(location);
    if (index >= 0) {
	this.locations.splice(index, 1);
    } else {
	if (this.locations.length == LocationManager.MAX_LOCATIONS) {
	    this.locations.slice(1);
	}
    }
    this.locations.push(location);

    createCookie("locations", this.toCookieString(this.locations), 365);
};

LocationManager.prototype.getLocations = function() {
    return this.locations;
};

LocationManager.prototype.getLocationIndex = function(location) {
    for (var i=0; i<this.locations.length; i++) {
	if (this.locations[i].address == location.address) {
	    return i;
	}
    }
    return -1;
};

LocationManager.prototype.fromCookieString = function(str) {
    var str = unescape(str);
    var locations = [];

    var tokens = str.split(LocationManager.LOCATION_DELIMITER);
    for (var i=0; i<tokens.length; i++) {
	var token = tokens[i];
	locations.push(Location.fromCookieString(token));
    }
    return locations;
};

LocationManager.prototype.toCookieString = function(locations) {
    var content = [];
    for (var i=0; i<locations.length; i++) {
	content.push(locations[i].toCookieString());
    }

    var cookieString = content.join(LocationManager.LOCATION_DELIMITER);
    debug("Cookie string: " + cookieString);
    return escape(cookieString);
};

function LocalSearchQueryPicker() {
    this.prompt = $("localQueryPicker");
    this.input = $("localQueryInput");
    this.input.onchange = functify(this, this.submitQuery);
    
    var cancel = $("localQueryCancel");
    cancel.onclick = functify(this, this.hidePrompt);
}

LocalSearchQueryPicker.prototype.showPrompt = function(callback) {
    this.callback = callback;

    this.input.value = "";
    this.prompt.style.display = "block";
    showPromptGlass();
    this.input.focus();
};

LocalSearchQueryPicker.prototype.hidePrompt = function() {
    this.input.value = "";
    this.prompt.style.display = "none";
    hidePromptGlass();
};

LocalSearchQueryPicker.prototype.submitQuery = function() {
    var query = this.input.value;
    this.hidePrompt();
    if (this.callback) {
	debug("picker picked " + query);
	this.callback(query);
    }
};

function Location(address, name) {
    this.address = address;
    this.name = name;
}

Location.ADDRESS_NAME_DELIMITER = "^^^";

Location.fromCookieString = function(str) {
    var tokens = str.split(Location.ADDRESS_NAME_DELIMITER);
    if (tokens.length == 1) {
	return new Location(str);
    } else {
	return new Location(tokens[0], tokens[1]);
    }
};

Location.prototype.toCookieString = function() {
    return (this.name) ? this.address + Location.ADDRESS_NAME_DELIMITER + this.name : this.address;
};

Location.prototype.getName = function() {
    return (this.name) ? this.name : this.address;
};

Location.prototype.getLongName = function() {
    return (this.name) ? this.address + " (" + this.name + ")" : this.address;
};function SearchController(mapController) {
    this.mapController = mapController;
    this.locationManager = new LocationManager();
    
    this.directionsController = new DirectionsController(this.mapController, this, this.locationManager);
    this.localSearchController = new LocalSearchController(this.mapController, this);

    this.goPanel = $("goPanel");
    var goToggle = $("goToggle");
    goToggle.onclick = functify(this, this.toggleSearchMenu);

    var locationButton = $("locationButton");
    locationButton.onclick = functify(this, this.showGotoLocationPrompt);

    var driveToHereButton = $("driveToHereButton");
    driveToHereButton.onclick = functify(this, this.showDriveToPrompt);

    var driveFromHereButton = $("driveFromHereButton");
    driveFromHereButton.onclick = functify(this, this.showDriveFromPrompt);

    var localSearchButton = $("localSearchButton");
    localSearchButton.onclick = functify(this, this.showLocalSearchPrompt);

    this.searchMenu = $("searchOptionsPanel");

    this.singleLocationPicker = new SingleLocationPicker(this.locationManager);
    this.localSearchQueryPicker = new LocalSearchQueryPicker();
}

SearchController.prototype.toggleSearchMenu = function() {
    if (this.searchMenu.style.display == "block") {
	this.hideSearchMenu();
    } else {
	this.showSearchMenu();
    } 
};

SearchController.prototype.showSearchMenu = function() {
    this.searchMenu.style.display = "block";
};

SearchController.prototype.hideSearchMenu = function() {
    this.searchMenu.style.display = "none";
};

SearchController.prototype.showGotoLocationPrompt = function() {
    this.hideSearchMenu();

    this.singleLocationPicker.showPrompt(functify(this, this.handleGotoLocationPicked));
};

SearchController.prototype.showDriveToPrompt = function() {
    this.hideSearchMenu();

    this.singleLocationPicker.showPrompt(functify(this, this.handleDriveToLocationPicked));
};

SearchController.prototype.showDriveFromPrompt = function() {
    this.hideSearchMenu();
    this.singleLocationPicker.showPrompt(functify(this, this.handleDriveFromLocationPicked));
};

SearchController.prototype.showLocalSearchPrompt = function() {
    this.hideSearchMenu();

    this.localSearchQueryPicker.showPrompt(functify(this, this.handleLocalQueryPicked));
};

SearchController.prototype.handleGotoLocationPicked = function(location) {
    if (location) {
	this.gotoLocation(location);
    }
};

SearchController.prototype.gotoLocation = function(location) {
    this.mapController.gotoAddress(location.address, this.createHandleLocationGeocodeFunction(location));
};

SearchController.prototype.gotoLastLocation = function() {
    var locations = this.locationManager.getLocations();
    if (locations.length > 0) {
	this.gotoLocation(locations[locations.length-1]);
    } else {
	this.gotoLocation(new Location("Mountain View, CA"));
    }
};

SearchController.prototype.handleDriveToLocationPicked = function(fromLocation) {
    if (location) {
	var toLocation = this.currentLocation;
	this.directionsController.showDirections(fromLocation, toLocation);
    }
};

SearchController.prototype.handleDriveFromLocationPicked = function(toLocation) {
    if (location) {
	var fromLocation = this.currentLocation;
	this.directionsController.showDirections(fromLocation, toLocation);
    }
};

SearchController.prototype.handleLocalQueryPicked = function(query) {
    if (query) {
	this.localSearchController.search(query);
    }
};

SearchController.prototype.showSearchPanel = function(string) {
    this.hideSearchMenu();
    this.goPanel.style.display = "block";
};

SearchController.prototype.hideSearchPanel = function(string) {
    this.hideSearchMenu();
    this.goPanel.style.display = "none";
};

SearchController.prototype.createHandleLocationGeocodeFunction = function(location) {
    var self = this;
    return function(latlng) {
	if (!latlng) {
	    window.alert("Sorry, but we couldn't understand \"" + location.address + "\"!");
	} else {
	    debug("current location: " + location.getLongName());
	    self.currentLocation = location;
	    self.locationManager.addLocation(location);
	    var name = location.getName();
	    $("currentLocationName").innerHTML = name;
	}
    };
};

function MapSurfaceController(map) {
    this.map = map;

    this.surface = $("surface");
    this.mapContainer = $("map");

    this.currentAddressIcon = this.createCurrentAddressIcon();
    this.businessIcon = this.createBusinessIcon();
    this.stepIcon = this.createStepIcon();

    this.scrollEventsToIgnore = 0;
    this.surface.onscroll = functify(this, this.onScroll);
    this.resetScrollPosition();
}

MapSurfaceController.prototype.getTrafficOverlay = function() {
    if (!this.trafficOverlay) {
	this.trafficOverlay = new GTrafficOverlay();
	this.map.addOverlay(this.trafficOverlay);
	this.trafficOverlay.hide();
    } 
    return this.trafficOverlay;
};

MapSurfaceController.prototype.zoomIn = function() {
    this.recenterMap();
    this.map.zoomIn();
};

MapSurfaceController.prototype.zoomOut = function() {
    this.recenterMap();
    this.map.zoomOut();
};

MapSurfaceController.prototype.displayStreetMap = function() {
    this.setMapType(G_NORMAL_MAP);
};

MapSurfaceController.prototype.displaySatelliteMap = function() {
    this.setMapType(G_SATELLITE_MAP);
};

MapSurfaceController.prototype.displayHybridMap = function() {
    this.setMapType(G_HYBRID_MAP);
};

MapSurfaceController.prototype.showTraffic = function() {
    this.getTrafficOverlay().show();
};

MapSurfaceController.prototype.hideTraffic = function() {
    this.getTrafficOverlay().hide();
};

MapSurfaceController.prototype.getCurrentMapType = function() {
    return this.map.getCurrentMapType();
};

MapSurfaceController.prototype.createCurrentAddressIcon = function(latlng) {
    var icon = new GIcon();
    icon.image = "http://www.google.com/mapfiles/gadget/arrowSmall80.png";
    icon.shadow = "http://www.google.com/mapfiles/gadget/arrowshadowSmall80.png";
    icon.iconSize = new GSize(31, 26);
    icon.shadowSize = new GSize(31, 27);
    icon.iconAnchor = new GPoint(8, 27);
    icon.infoWindowAnchor = new GPoint(5, 1);
    return icon;
};

MapSurfaceController.prototype.createBusinessIcon = function(latlng) {
    var gSmallIcon = new GIcon();
    gSmallIcon.image = LocalSearchController.RESULT_ICON_URL;
    gSmallIcon.shadow = "http://labs.google.com/ridefinder/images/mm_20_shadow.png";
    gSmallIcon.iconSize = new GSize(12, 20);
    gSmallIcon.shadowSize = new GSize(22, 20);
    gSmallIcon.iconAnchor = new GPoint(6, 20);
    gSmallIcon.infoWindowAnchor = new GPoint(5, 1);
    return gSmallIcon;
};

MapSurfaceController.prototype.createStepIcon = function(latlng) {
    var icon = new GIcon();
    icon.image = LocalSearchController.SELECTED_ICON_URL;
    icon.shadow = "http://labs.google.com/ridefinder/images/mm_20_shadow.png";
    icon.iconSize = new GSize(12, 20);
    icon.shadowSize = new GSize(22, 20);
    icon.iconAnchor = new GPoint(6, 20);
    icon.infoWindowAnchor = new GPoint(5, 1);
    return icon;
};

MapSurfaceController.prototype.gotoAddress = function(address, callback) {
    if (!this.geocoder) {
	this.geocoder = new GClientGeocoder();
    }

    var self = this;
    var handler = function(latlng) {
	if (latlng) {
	    self.resetScrollPosition();
	    self.map.setCenter(latlng);

	    if (self.currentAddressMarker) {
		self.map.removeOverlay(self.currentAddressMarker);
	    }

	    self.currentAddressMarker = new GMarker(latlng, self.currentAddressIcon);
	    self.map.addOverlay(self.currentAddressMarker);
	}

	if (callback) {
	    callback(latlng);
	}
    };
    this.geocoder.getLatLng(address, handler);
};

MapSurfaceController.prototype.clearDirections = function() {
    if (this.directions) {
	this.directions.clear();	
    }

    this.removeAllButCurrentAddressOverlays();
    this.currentStepMarker = undefined;
    this.setMapCenter(this.currentAddressMarker.getLatLng());
};

MapSurfaceController.prototype.getDirections = function(fromAddress, toAddress, callback) {
    if (!this.directions) {
	this.directions = new GDirections(this.map, $("searchContent"));
	GEvent.addListener(this.directions, "load", functify(this, this.handleDirectionsLoaded));
        GEvent.addListener(this.directions, "error", functify(this, this.handleDirectionsError));
    }

    this.currentDirectionsCallback = callback;
    this.directions.load("from: " + fromAddress + " to: " + toAddress);
};

MapSurfaceController.prototype.handleDirectionsLoaded = function() {
    if (this.currentDirectionsCallback) {
	this.currentDirectionsCallback(this.directions.getRoute(0));
    }
};

MapSurfaceController.prototype.handleDirectionsError = function() {
    if (this.currentDirectionsCallback) {
	this.currentDirectionsCallback(undefined);
    }
};

MapSurfaceController.prototype.setMapType = function(mapType) {
    var currentType = this.map.getCurrentMapType();
    debug("Want type " + mapType + ", currently have " + currentType);
    if (currentType == mapType) {
	return;
    }
   
    this.map.setMapType(mapType);
};

MapSurfaceController.prototype.resetScrollPosition = function() {
    var scrollerHeight = this.surface.offsetHeight;
    var scrollerWidth = this.surface.offsetWidth;
    var mapHeight = this.mapContainer.offsetHeight;
    var mapWidth = this.mapContainer.offsetWidth;

    var desiredScrollTop = (mapHeight / 2) - (scrollerHeight / 2);
    if (desiredScrollTop != this.surface.scrollTop) {
        this.scrollEventsToIgnore++;
        this.surface.scrollTop = desiredScrollTop;
    }

    var desiredScrollLeft = (mapWidth / 2) - (scrollerWidth / 2);
    if (desiredScrollLeft != this.surface.scrollLeft) {
        this.scrollEventsToIgnore++;
        this.surface.scrollLeft = desiredScrollLeft;
    }
    window.scrollTo(0, 1);
};

MapSurfaceController.prototype.onScroll = function(event) {
    if (this.scrollEventsToIgnore > 0) {
	this.scrollEventsToIgnore--;
        return true;
    }

    var scrollTop = this.surface.scrollTop;
    var scrollLeft = this.surface.scrollLeft;
    var surfaceHeight = this.surface.offsetHeight;
    var surfaceWidth = this.surface.offsetWidth;
    var scrollRight = scrollLeft + surfaceWidth;
    var scrollBottom = scrollTop + surfaceHeight;
    var mapWidth = this.mapContainer.offsetWidth;
    var mapHeight = this.mapContainer.offsetHeight;
    

    if (scrollTop > 0 && scrollLeft > 0 && scrollRight < mapWidth && scrollBottom < mapHeight) {
        return true;
    }

    this.recenterMap();
    return true;
};

MapSurfaceController.prototype.recenterMap = function() {
    var scrollLeft = this.surface.scrollLeft;
    var surfaceWidth = this.surface.offsetWidth;
    var scrollTop = this.surface.scrollTop;
    var surfaceHeight = this.surface.offsetHeight;

    var curPixelCenter = new GPoint(scrollLeft + surfaceWidth/2, scrollTop + surfaceHeight/2);
    var newCenterLatLng = this.map.fromContainerPixelToLatLng(curPixelCenter);
    this.map.setCenter(newCenterLatLng);
    this.resetScrollPosition();

    debug("curCenter: " + curPixelCenter + ", new latlng: " + newCenterLatLng);
};

MapSurfaceController.prototype.showStepMarker = function(latlng) {
    if (this.currentStepMarker) {
	this.map.removeOverlay(this.currentStepMarker);
    }
    this.resetScrollPosition();
    this.map.panTo(latlng);

    this.currentStepMarker = new GMarker(latlng, this.stepIcon);
    this.map.addOverlay(this.currentStepMarker);
};

MapSurfaceController.prototype.panMapTo = function(latlng) {
    this.map.panTo(latlng);
    this.resetScrollPosition();
};

MapSurfaceController.prototype.setMapCenter = function(latlng) {
    this.map.setCenter(latlng);
    this.resetScrollPosition();
};

MapSurfaceController.prototype.localSearch = function(query, callback) {
    if (!this.localSearcher) {
      this.localSearcher = new GlocalSearch();
      this.localSearcher.setCenterPoint(this.map);
      this.localSearcher.setResultSetSize(GSearch.LARGE_RESULTSET);
      this.localSearcher.setSearchCompleteCallback(null, functify(this, this.handleLocalSearchResults));
      this.localSearcher.setAddressLookupMode(GlocalSearch.ADDRESS_LOOKUP_DISABLED);
      this.localSearcher.setNoHtmlGeneration();
    }
    this.localSearchCallback = callback;
    this.localSearcher.execute(query);
};

MapSurfaceController.prototype.clearLocalSearch = function() {
    this.removeAllButCurrentAddressOverlays();
    this.setMapCenter(this.currentAddressMarker.getLatLng());
};

MapSurfaceController.prototype.handleLocalSearchResults = function() {
    var results = this.localSearcher.results;

    if (!results) {
	return;
    }

    this.removeAllButCurrentAddressOverlays();

    for (var i=0; i<results.length; i++) {
	var result = results[i];
	var marker = new GMarker(new GLatLng(parseFloat(result.lat),
					     parseFloat(result.lng)),
				 this.businessIcon);
	result.marker = marker;
	this.map.addOverlay(marker);
    }

    this.localSearchCallback(results);
};

MapSurfaceController.prototype.removeAllButCurrentAddressOverlays = function() {
    this.map.clearOverlays();
    this.map.addOverlay(this.currentAddressMarker);
};

function InstructionsPanel() {
    this.prompt = $("instructions");
    
    var okButton = $("closeInstructionsButton");
    okButton.onclick = functify(this, this.hidePrompt);
}

InstructionsPanel.prototype.showPrompt = function() {
    this.prompt.style.display = "block";
    showPromptGlass();
};

InstructionsPanel.prototype.hidePrompt = function() {
    this.prompt.style.display = "none";
    hidePromptGlass();
};function ViewController(mapController) {
    this.mapController = mapController;

    $("zoomInButton").onclick = functify(this, this.zoomIn);
    $("zoomOutButton").onclick = functify(this, this.zoomOut);

    this.viewDropDown = $("viewDropDown");
    this.viewDropDown.onclick = functify(this, this.showExpandedViewPanel);

    this.expandedViewPanel = $("expandedViewPanel");

    var switchMapTypeFunction = functify(this, this.switchMapType);
    this.streetButton = $("streetButton");
    this.streetButton.onclick = switchMapTypeFunction;

    this.satelliteButton = $("satelliteButton");
    this.satelliteButton.onclick = switchMapTypeFunction;

    this.hybridButton = $("hybridButton");
    this.hybridButton.onclick = switchMapTypeFunction;

    this.trafficButton = $("trafficButton");
    this.trafficButton.onclick = functify(this, this.toggleTraffic);
}

ViewController.prototype.zoomIn = function() {
    this.mapController.zoomIn();
};

ViewController.prototype.zoomOut = function() {
    this.mapController.zoomOut();
};

ViewController.prototype.switchMapType = function(event) {
    var target = event.target;
    var currentType = this.mapController.getCurrentMapType();
    var currentOnButton = this.getButtonForMapType(currentType);

    if (currentOnButton === target) {
        this.hideExpandedViewPanel();
	return;
    }

    currentOnButton.className = "button";
    target.className = "buttonOn";

    if (target === this.streetButton) {
	this.mapController.displayStreetMap();
    } else if (target === this.satelliteButton) {
	this.mapController.displaySatelliteMap();
    } else if (target === this.hybridButton) {
	this.mapController.displayHybridMap();
    }

    this.hideExpandedViewPanel();
};

ViewController.prototype.showExpandedViewPanel = function() {
    this.viewDropDown.style.display = "none";
    this.expandedViewPanel.style.display = "block"; 
};

ViewController.prototype.hideExpandedViewPanel = function() {
    this.viewDropDown.style.display = "block";
    this.expandedViewPanel.style.display = "none"; 
};

ViewController.prototype.toggleTraffic = function() {
    if (this.trafficButton.className == "buttonOn") {
	this.trafficButton.className = "button";
	this.mapController.hideTraffic();
    } else {
	this.trafficButton.className = "buttonOn";
	this.mapController.showTraffic();
    }

    this.hideExpandedViewPanel();
};

ViewController.prototype.getButtonForMapType = function(mapType) {
    if (mapType == G_NORMAL_MAP) {
	return this.streetButton;
    } else if (mapType == G_SATELLITE_MAP) {
	return this.satelliteButton;
    } else if (mapType == G_HYBRID_MAP) {
	return this.hybridButton;
    } else {
	return undefined;
    }
};
