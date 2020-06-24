//
// this could/should be run before all other scripts
//

if (typeof omg != "object")
	omg = {};

if (!omg.url)
	omg.url = "";

if (!omg.musicUrl)
	omg.musicUrl = "/music";

if (typeof omg.util != "object")
	omg.util = {};

if (!window.requestAnimFrame) {
	window.requestAnimFrame = (function(callback) {
	    return window.requestAnimationFrame || window.webkitRequestAnimationFrame
	            || window.mozRequestAnimationFrame || window.oRequestAnimationFrame
	            || window.msRequestAnimationFrame || function(callback) {
	                window.setTimeout(callback, 1000 / 60);
	            };
	})();
}

omg.getEl = function (id, param2) {
	var el = document.getElementById(id);
	if (el && typeof(param2) == "function")
		el.onclick = param2;
	
	return el;
}
omg.newEl = function (type) {
	return document.createElement(type);
}
omg.newDiv = function () {
	return document.createElement("div");
}

// use omg.debugout for permanent outs
// they get skipped when searching for temporary outs
omg.debug = function (something) {
	console.log(something);
};

// badcallback parameter is the xhr object
omg.util.getHttp = function (url, goodCallback, badCallback) {
	var excp;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4){
        	if (xhr.status == 200) {
        		try {
                    var ooo = JSON.parse(xhr.responseText);        			
        		}
        		catch (excp) {
        			if (badCallback) {
                    	badCallback(xhr);
        			}
        			else {
        				omg.debug("error util.getHttp");
        				omg.debug(excp);
        			}
        			return;
        		}
                if (goodCallback)
                	goodCallback(ooo);
        	}
            else if (badCallback) {
            	badCallback(xhr);
            }
        }
    };
    xhr.send();        
};

omg.getOMG = function (id, callback) {
	
	var url = omg.url + "/omg?id=" + id;

	omg.util.getHttp(url, function (response) {
		
		var ooo = response.list[0];
		ooo.data = JSON.parse(ooo.json);

		if (!ooo.data.id)
			ooo.data.id = parseInt(id);
		
		if (callback) 
			callback(ooo);
		
	});
};

omg.getList = function (params) {
    var ooo;

    var page = params.page || 1;

    var type = params.type;
    var order = params.order;
    var results = params.maxResults;
    var callback = params.callback;
    var errorCallback = params.errorCallback;
    
    // tags?

    var url = "/omg?type=" + type + "&order=" + order +
				"&page=" + page + "&results=" + results;

    omg.util.getHttp(url, callback, errorCallback)
};


omg.util.getTimeCaption = function (timeMS) {

    var seconds = Math.round((Date.now() - timeMS) / 1000);
    if (seconds < 60) {
        return seconds + " sec ago";
    }

    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return minutes + " min ago";    
    }

    var hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return hours + " hr ago";    
    }

    var days = Math.floor(hours / 24);
    if (days < 7) {
        return days + " days ago";    
    }

    var date  = new Date(timeMS);
    
    var monthday = omg.util.getMonthCaption(date.getMonth()) + " " + date.getDate();
    if (days < 365) {
    	return monthday;
    }
    return monthday + " " + date.getYear();

};

omg.util.getMonthCaption = function (month) {
    if (!omg.util.months) {
        omg.util.months = ["Jan", "Feb", "Mar", "Apr", "May",
                      "Jun", "Jul", "Aug", "Sep", "Oct", 
                      "Nov", "Dec"];
    }
    return omg.util.months[month];
};

omg.util.fadeLength = 750

omg.util.fade = function (params) {
	
	var length = params.length || omg.util.fadeLength;
	var now = 0;
	if (params.startT == undefined) {
		params.startT = Date.now();
		if (params.fadeIn) {
			params.div.style.opacity = params.start || 0;
			params.div.style.visibility = "visible";
			params.div.style.display = params.display || "block";
		}
	}
	else {
		now = Math.min(length, Date.now() - params.startT);
	}

	var opacity = now / length;
	if (params.start && opacity < params.start)
		opacity = params.start
		
	if (!params.fadeIn)
		opacity = 1 - opacity;
	params.div.style.opacity = opacity;			

	if (now == length) {
		if (params.remove) {
			params.div.style.display = "none";
		}
		
		if (typeof params.callback == "function")
			params.callback();
		return;
	}
	
	window.requestAnimFrame(function () {
		omg.util.fade(params);
	});
	
};
	
omg.util.slide = function (params) {

	var length = params.length || 500;
	var now = 0;
	if (params.startX == undefined) {
		params.startX = params.div.offsetLeft;
		
		if (params.finalX == undefined && params.dX != undefined) {
			params.finalX = params.startX + params.dX;
		}
	}
	if (params.startY == undefined) {
		params.startY = params.div.offsetTop;
	}
	if (params.startT == undefined) {
		params.startT = Date.now();
	}
	else {
		now = Math.min(length, Date.now() - params.startT);
	}
	
	
	if (params.finalX != undefined) {
		params.div.style.left = params.startX - now / length * 
						(params.startX - params.finalX) + "px";	
	}
	if (params.finalY != undefined) {
		params.div.style.top = params.startY - now / length * 
						(params.startY - params.finalY) + "px";	
	}
	
	if (now == length) {
		if (typeof params.callback == "function")
			params.callback();
		return;
	}

	window.requestAnimFrame(function () {
		omg.util.slide(params);
	});
	
};

omg.util.splitInts = function (string) {
	var ints = string.split(",");
	for (var i = 0; i < ints.length; i++) {
		ints[i] = parseInt(ints[i]);
	}
	return ints;
};

omg.util.totalOffsets = function(element, parent) {
    var top = 0, left = 0;
    do {
        top += element.offsetTop  || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
        
        if (parent && parent === element) {
        	break;
        }
        	
    } while(element);

    return {
        top: top,
        left: left
    };
};

omg.dev = window.location.href.indexOf("localhost:8888") > -1 || window.location.href.indexOf("192.168.1") > -1;

omg.util.getCookie = function (c_name) {
    var i,x,y, cookies=document.cookie.split(";");
    for (i=0; i < cookies.length; i++) {
        x = cookies[i].substr(0, cookies[i].indexOf("="));
        y = cookies[i].substr(cookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == c_name) {
            return unescape(y);
        }
    }
};

omg.util.setCookie = function (c_name,value,exdays) {
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
    document.cookie=c_name + "=" + c_value;
};

omg.util.getScrollTop = function () {
	return document.body.scrollTop + document.documentElement.scrollTop;
};


omg.postOMG = function (params, data, callback) {

	var type;
	if (typeof (params) == "string") {
		type = params;
		params = {};
	}
	else {
		type = params.type;
	}
	
	var optParam = "";
	if (typeof (data.id) == "number" && data.id > 0) {
		optParam = "id=" + data.id + "&";
	}
	
	if (type == "SONG" && data.name) {
		optParam = optParam + "name=" + encodeURIComponent(data.name) + "&";
	}
	
	if (params.picture) {
		optParam = optParam + "picture=" + encodeURIComponent(params.picture) + "&";
	}
	
	var xhr = new XMLHttpRequest();
	xhr.open("POST", omg.url + "/omg", true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {

			var results = JSON.parse(xhr.responseText);
			if (results.result == "good") {
				console.log("post omg good id= " + results.id);
				data.id = results.id;
				if (callback)
					callback(results);
			}
			else {
				console.log(results);
			}

		}
	}
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send(optParam + "type=" + type + "&tags=&data="
			+ encodeURIComponent(JSON.stringify(data)));
};


omg.util.getUser = function (callback, errorCallback) {
	
	omg.util.getHttp("/artist?id=me", callback, errorCallback);
};


omg.util.setupUploadButton = function (params) {
	var uploadButton = params.button;
	var updateUploadLog = params.logCallback || console.log;
	
	uploadButton.onclick = function () {
		updateUploadLog("Getting upload path");

		if (params.form.type.value.length == 0) {
			params.form.type.value = omg.util.getMediaTypeFromFileName(params.form.myFile.value);
		}
		
		omg.util.getHttp("/uploadurl", function (response) {
			if (response.result == "good") {
				params.uploadUrl = response.uploadUrl;
				omg.util.doUpload(params);
			}
		});
	};	
};

omg.util.doUpload = function (params) {
	var formData = new FormData(params.form);
	
	var updateUploadLog = params.logCallback || console.log;
	updateUploadLog("loading...");
	
	var xhr = new XMLHttpRequest();
	xhr.open("POST", params.uploadUrl, true)
	xhr.onreadystatechange = function(){
		try {
			if (xhr.readyState == 4){
				updateUploadLog("ready, status: " + xhr.status);
				if (xhr.status == 200) {
					var result = JSON.parse(xhr.responseText);
					var blobkey = result.blobKey;
					if (blobkey.length > 0) {
						if (blobkey.slice(0, 5) == "Error" || blobkey == "null") {
							updateUploadLog("Error: " + blobkey);
						} 
						else {
							updateUploadLog("Loaded: " + blobkey);
							if (params.okCallback) {
								params.okCallback(result);
							}
							
						}
					}
					else {
						updateUploadLog("empty response!");
					}
				}
				else {
					if (typeof(xhr.responseText) == "string") {
						updateUploadLog("Error: " + xhr.responseText);
					}
					else {
						updateUploadLog("Error: " + xhr.status);
					}
				}
			}
		}
		catch (e) {
			updateUploadLog("Main catch error " + e);
			console.log(e);
		}
	};
	
	xhr.send(formData);

};

omg.util.getMediaTypeFromFileName = function (file) {
	
	if (file.indexOf("http") == 0 && (file.indexOf("youtube.com") < 14 || url.indexOf("youtu.be") < 10)) {
		return "YOUTUBE"
	}
	
	var lastIndex = file.lastIndexOf(".");
	if (lastIndex == -1) {
		return "";
	}
	var ext = file.slice(lastIndex + 1).toLowerCase();
	if (ext == "png" || ext == "jpeg" || ext == "jpg" || ext == "gif" || ext == "bmp") {
		return "IMAGE";
	}
	if (ext == "mp3" || ext == "ogg" || ext == "aiff" || ext == "wav") {
		return "AUDIO";
	}

	return "";
};

omg.util.getYouTubeIdFromUrl = function (file) {
	var id = "";
	var vParamIndex = file.indexOf("v=");
	
	if (vParamIndex > -1) {
		id = file.slice(vParamIndex + 2);
		vParamIndex = id.indexOf("&");
		if (vParamIndex > 0) {
			id = id.slice(0, vParamIndex);
		} 
	}
	return id;
};

omg.util.sendVote = function (id, value, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/vote", true);
	xhr.onreadystatechange = function() {
	    if (xhr.readyState == 4) {
	        console.log(xhr.responseText);
	        if (callback) {
	        	callback(xhr.responseText);
	        }
	    }
	};
	xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xhr.send("id=" + id + "&value=" + value);
};



function OMGSearch(panel, type, clickCallback) {
	if (panel)
		this.setupPanel(panel, type, clickCallback);
}

OMGSearch.prototype.setupPanel = function (panel, type, clickCallback) {

	var omgcp = this;
	panel.clickCallback = clickCallback;

	panel.detailListDiv = panel.getElementsByClassName("detail-list")[0];
	panel.typeSelect = panel.getElementsByClassName("type-select")[0];
	panel.typeSelect.onchange = function () {
		omgcp.getDetail(panel);
	};
	if (type) {
		if (Array.isArray(type)) {
			panel.typeFilterArray = type; 
			panel.typeSelect.value = type[0];		
			
			for (var ioption = 0; ioption < panel.typeSelect.options.length; ioption++) {
				var isThere = false;
				type.forEach(function (validType) {
					if (panel.typeSelect.options[ioption].value == validType) {
						isThere = true;
					}
				})
				if (!isThere) {
					panel.typeSelect.options[ioption].hidden = "true";
				}
			}
			panel.typeSelect.style.display = "block";
		}
		else {
			panel.typeSelect.style.display = "none";
			panel.typeSelect.value = type;			
		}
	}
	
	panel.playingCanvas = panel.getElementsByClassName("panel-part-canvas")[0];
	
	panel.meUserScope = panel.getElementsByClassName("me-user-scope")[0];
	panel.globalUserScope = panel.getElementsByClassName("global-user-scope")[0];
	panel.serverUserScope = panel.getElementsByClassName("server-user-scope")[0];	
	panel.meUserScope.onclick = function () { 
		omgcp.setUserScope(panel, "me", panel.meUserScope);
	};
	panel.globalUserScope.onclick = function () {
		omgcp.setUserScope(panel, "global", panel.globalUserScope);
	};
	panel.serverUserScope.onclick = function () {
		omgcp.setUserScope(panel, "server", panel.serverUserScope);
	};
	
	//panel.serverUserScope.onclick();
	panel.meUserScope.onclick();
};

OMGSearch.prototype.setUserScope = function (panel, scope, div) {
	if (panel.lastUserScopeDiv) {
		panel.lastUserScopeDiv.style.backgroundColor = "";
	}
	
	div.style.backgroundColor = "#FFA500";
	panel.lastUserScopeDiv = div;
	panel.userScope = scope;
	
	panel.detailListDiv.innerHTML = "Loading...";
	
	this.getDetail(panel);
};

OMGSearch.prototype.getDetail = function (panel) {
	
	var omgUrl = "/omg?results=24&artist=" + panel.userScope + "&type=" + panel.typeSelect.value;
	var omgcp = this;
	omg.util.getHttp(omgUrl, function (omgResults) {
		omgcp.loadDetails(omgResults.list, panel);
	});

};
	
OMGSearch.prototype.loadDetails = function (details, panel) {
	panel.detailList = details;
	
	panel.detailListDiv.innerHTML = "";
	for (var idtl = 0; idtl < details.length; idtl++) {
		var newRow = this.loadDetailRow(details[idtl], panel)
		panel.detailListDiv.appendChild(newRow);
		details[idtl].i = idtl;
	}
};

OMGSearch.prototype.loadDetailRow = function (detail, panel) {
	
	var newRow = omg.newDiv();
	newRow.className = "detail-row";
	newRow.appendChild(this.getDetailPreviewDiv(detail));

	var tags = detail.tags || "(no tags)";
	var title = detail.title || "(" + detail.type.toLowerCase() + ")";

	var rowInfo = omg.newDiv();
	rowInfo.innerHTML = "<div class='detail-row-title'>" + title + "</div>" +
						"<div class='detail-row-artist'>by " + detail.artistName + "</div>" +
						"<div class='detail-row-votes'>" + detail.votes + " votes</div> | " + 
						"<div class='detail-row-time'>" + omg.util.getTimeCaption(detail.first_datetime) + "</div>";

	newRow.appendChild(rowInfo);

	newRow.onclick = function () {
		if (panel.clickCallback) {
			panel.clickCallback(detail);
		}
	};

	return newRow; 
};

OMGSearch.prototype.getDetailPreviewDiv = function (detail) {
	var returnDiv;
	
	if (detail.type == "DRUMBEAT") {
		returnDiv = document.createElement("canvas");
		omg.ui.drawDrumCanvas({canvas: returnDiv, drumbeat: JSON.parse(detail.json), 
							width:220, height:180});
	}
	else if (detail.type == "MELODY" || detail.type == "BASSLINE") {
		returnDiv = document.createElement("canvas");
		omg.ui.drawMelodyCanvas(JSON.parse(detail.json), returnDiv, 220, 180);
	}
	else if (detail.type == "AUDIO" || detail.type == "SONG" || detail.type == "SECTION") {
		returnDiv = document.createElement("img");
		returnDiv.src = "/img/sound.png";
	}
	else {		
		returnDiv = document.createElement("img");
		returnDiv.src = detail.thumbnail || detail.picture;
	}
	returnDiv.className = "detail-row-thumbnail";
	
	return returnDiv;
};
