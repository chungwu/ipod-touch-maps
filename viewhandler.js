function ViewController(mapController) {
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
