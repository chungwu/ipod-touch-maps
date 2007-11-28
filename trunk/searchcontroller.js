function SearchController(mapController) {
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

