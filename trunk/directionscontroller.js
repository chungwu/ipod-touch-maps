function DirectionsController(mapController, searchController, locationManager) {
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
};