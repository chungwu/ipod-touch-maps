function functify(object, func) {
    return function() {
	func.apply(object, arguments);
    };
}

function load() {
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

function debug(str) {
    ;;;if (console) {
    ;;;  console.debug(str);
    ;;;}
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
}