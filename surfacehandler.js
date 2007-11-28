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
    window.scrollTo(0, 1);

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
};