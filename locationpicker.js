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
};