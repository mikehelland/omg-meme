"use strict";

//in June 2020 I revived this beast which was written well before ES6

function MemeCreator(params) {	
	this.url = "/apps/meme/" //todo make this smarter?
	this.playerDiv = params.playerDiv
	this.setupTabs();

	this.musicDrawer = new OMGEmbeddedViewerMusicDrawer()

	this.playSeekControls = document.getElementById("play-seek-controls")
	this.playhead = document.getElementById("playhead")
	this.layersDiv = document.getElementById("layer-list")

	this.player = new OMemePlayer({div: params.playerDiv, controlsDiv: this.playSeekControls, externalControls: true});
	this.player.onupdateposition = (position) => this.updatePlayhead(position)
	this.player.onlayerloaded = (layer, extras) => this.onLayerLoaded(layer, extras)
	this.loadParameters();

	this.setupPanels()
	this.setupHotKeys()

	omg.server.getTypes()
	omg.server.getUser()
}

MemeCreator.prototype.setupTabs = function () {
	var mc = this;
	var tabs = [
	            {mode: "BACKGROUND"},
			    {mode: "CHARACTER"},
			    {mode: "DIALOG"},
			    {mode: "SOUNDTRACK"},
			    {mode: "DOODLE"},
				{mode: "SUBMIT"},
			];
	
	tabs.forEach((tab, i) => {
		tab.div = document.getElementById(tab.mode.toLowerCase() + "-tab");
		tab.pageDiv = document.getElementById(tab.mode.toLowerCase() + "-page");
		tab.div.onclick = () => {
			tabs.forEach((tab2) => {
				tab2.div.className = "main-tab";
				tab2.pageDiv.style.display = "none";
			});
			
			mc.showTab(tab);
			this.mode = tab.mode;
			
			tab.div.className = "selected-main-tab";
			tab.pageDiv.style.display = "block";
		};
	});

	this.tabs = tabs	
};

MemeCreator.prototype.showTab = function (tab) {
	if (tab.mode == "BACKGROUND") {
		this.showBackgroundTab(tab);
	}
	if (tab.mode == "DOODLE") {
		this.showDoodleTab(tab);
	}
	if (tab.mode == "CHARACTER") {
		this.showCharactersTab(tab);
	}
	if (tab.mode == "SOUNDTRACK") {
		this.showSoundsTab(tab);
	}
	if (tab.mode == "DIALOG") {
		this.showDialogTab(tab);
	}
	if (tab.mode == "SUBMIT") {
		this.showSaveTab(tab)
	}
	tab.shown = true;
};

MemeCreator.prototype.showDoodleTab = function (tab) {

	if (!tab.shown) {
		tab.colorPicker = document.getElementById("doodle-color")
		tab.colorPicker.onchange = e => this.preview.color = e.target.value
		tab.sizePicker = document.getElementById("doodle-width")
		tab.sizePicker.onchange = e => this.preview.width = e.target.value
	}

	this.preview = {
		type: "DOODLE", 
		color: tab.colorPicker.value, 
		width: tab.sizePicker.value,
		xyt: [], 
		i: 0
	};

	this.player.preview = this.preview
	
};

MemeCreator.prototype.showBackgroundTab = function (tab) {
	this.preview = undefined
	this.player.preview = undefined
	
	if (tab.shown)
		return;

	var userList = tab.pageDiv.getElementsByClassName("row-list")[0];

	var searchBox = this.makeSearchBox(["IMAGE", "IMAGESET"])
	userList.appendChild(searchBox.div)
	
	omg.server.getHTTP("/data/?type=IMAGE", (results) => {
		var details = results;
		for (var idtl = 0; idtl < details.length; idtl++) {
			var newRow = this.loadBackgroundRow(details[idtl])
			userList.appendChild(newRow);
		}

	});
};


MemeCreator.prototype.loadBackgroundRow = function (detail) {
	
	var newRow = document.createElement("img"); //omg.newDiv();
	newRow.className = "background-thumbnail";
	
	newRow.src = detail.url //detail.thumbnail;
	
	newRow.onclick = () => {
		this.addBackground(detail);
	};	
	
	return newRow;
};

MemeCreator.prototype.loadCharacterRow = function (detail, finishCallback) {
	
	var newRow = document.createElement("img"); 
	newRow.className = "background-thumbnail";
	
	newRow.src = detail.url //detail.thumbnail;
	
	newRow.onclick = () => {
		this.addCharacterFromFile(detail);

		if (finishCallback) {
			finishCallback();
		}
	};	
	
	return newRow;
};

MemeCreator.prototype.addBackground = function (src) {
	
	var errorCallback = function () {
		this.errorLoadingBackgroundDiv.style.display = "inline-block";
	};
	
	this.player.addBackground(src, false, errorCallback);

};

MemeCreator.prototype.showCharactersTab = function (tab) {
	this.preview = undefined
	this.player.preview = undefined
	
	if (tab.shown)
		return;

	var userList = tab.pageDiv.getElementsByClassName("recent-character-list")[0];

	var searchBox = this.makeSearchBox(["SPRITE", "IMAGE", "IMAGESET", "TILESET"])
	userList.appendChild(searchBox.div)
	
	omg.server.getHTTP("/data/?type=IMAGE", (results) => {
		var details = results;
		for (var idtl = 0; idtl < details.length; idtl++) {
			var newRow = this.loadCharacterRow(details[idtl], tab.pageDiv.finishCallback)
			userList.appendChild(newRow);
		}
	});
};

MemeCreator.prototype.addCharacterFromFile = function (thing) {
	
	var errorCallback = () => {
		console.error("did not make character from file")
		//errorLoadingDiv.style.display = "inline-block";
	};
	var loadCallback = (character) => {
		this.meme.layers.push(character)
		var layerDiv = this.makeLayerDiv(character)
		this.makeCharacterButton(character, layerDiv);
		
		this.preview = character
		this.player.preview = character

		this.highlightDiv(layerDiv.div)
	};
	
	this.player.newCharacter(thing, loadCallback, errorCallback);
};

MemeCreator.prototype.makeCharacterButton = function (character, layer){
	
	var newCanvas = document.createElement("canvas");	
	newCanvas.height = 40;
	newCanvas.width = 40;
	
	var draw = () => {
		this.player.drawCharacter(character, 
			0.5, 0.5, newCanvas.getContext("2d"));
	}

	if (character.loading) {
		character.loading.addEventListener("load", () => draw())
	}
	else {
		draw()
	}
	
	layer.header.appendChild(newCanvas)

	layer.detailCanvas = document.createElement("canvas")
	layer.detailCanvas.className = "meme-layer-detail-canvas"

	layer.detail.appendChild(layer.detailCanvas)

	character.refreshLayer = this.makeCharacterLayerRefresh(character, layer)
	character.refreshLayer()

	return newCanvas
};

MemeCreator.prototype.showSoundsTab = function (tab) {
	this.mode = "SOUNDTRACK"
	this.preview = undefined
	this.player.preview = undefined
	
	if (tab.browsePage) {
		tab.browsePage.style.display = "block"
	}

	if (this.remixerParent) {
		this.remixerParent.style.display = "none"
	}
	

	if (tab.shown)
		return;

	tab.recordButton = document.getElementById("soundtrack-browse")
	tab.createButton = document.getElementById("soundtrack-create")
	tab.browsePage = document.getElementById("soundtrack-browse")
	var gallery = tab.pageDiv.getElementsByClassName("search-box")[0];


	tab.createButton.onclick = e => {
		tab.browsePage.style.display = "none"
		this.showRemixer()
	}

	var searchBox = this.makeSearchBox(["SONG","SOUNDSET"], (v, e) => {

		let data = v.data
		let div = v.embedDiv

		if (data.type === "SOUNDSET") {
			let obj = this.selectSoundFromSoundSet(v, e.target)
			if (!obj) {
				return
			}
			data = obj.data
			div = obj.div
		}

		let layer = this.addSoundtrack(data)
		
		this.preview = layer
		this.player.preview = layer	
		
		this.highlightDiv(div)
	})

	gallery.appendChild(searchBox.div)
	
	searchBox.search()	
};

MemeCreator.prototype.showDialogTab = function (tab) {

	if (!this.dialogInput) {
		this.dialogInput = document.getElementById("dialog-text")
		this.dialogInput.onkeyup = () => {
			this.preview.text = this.dialogInput.value;
		};
	}

	this.preview = this.newDialog()
	this.player.preview = this.preview

	this.highlightDiv(this.dialogInput)

	this.preview.text = this.dialogInput.value || "enter text"

};

MemeCreator.prototype.showSaveTab = function (tab) {
	this.preview = undefined
	this.player.preview = undefined
	
	document.getElementById("post-button").onclick = () => {

		if (this.meme.id) {
			if (!omg.user) {
				delete this.meme.id
			}
			else if (omg.user.id !== this.meme.user_id) {
				delete this.meme.id
			}
		}

		this.meme.name = document.getElementById("main-name-input").value || ""
		this.meme.tags = document.getElementById("main-tags-input").value || ""
	
		omg.server.post(this.meme, result => {
			if (result && result.id) {
				window.location = "/view/" + result.id
			}
		});
	}
	
}

MemeCreator.prototype.showDialog = function (params) {

	var mc = this;

	var fullscreenWindow = document.getElementById("fullscreen-window-background");
	fullscreenWindow.style.display = "block";

	var dialog = params.dialog;
	
	dialog.style.display = "block";
	dialog.style.left = window.innerWidth / 2 - dialog.clientWidth / 2 + "px";
	dialog.style.top = window.innerHeight / 2 - dialog.clientHeight / 2 + "px";
	

	var closeDialog = function () {
		fullscreenWindow.style.display = "none";
		dialog.style.display = "none";
	};		
	
	dialog.finishCallback = closeDialog;
	
	var okButton = dialog.getElementsByClassName("dialog-ok")[0];
	if (okButton) {
		okButton.onclick = function () {
			if (params.okCallback()) {
				params.okCallback();				
			}
			closeDialog();
		};
	}

	var cancelButton = dialog.getElementsByClassName("dialog-cancel")[0];
	if (cancelButton) {
		cancelButton.onclick = function () {
			if (params.cancelCallback) {
				params.cancelCallback();				
			}
			closeDialog();
		};
	}

	fullscreenWindow.onclick = function () {
		closeDialog();
		fullscreenWindow.onclick = undefined;
	};
};

MemeCreator.prototype.makeDialogLayerDiv = function (dialog) {
	
	var layer = this.makeLayerDiv(dialog)
	var img = document.createElement("img")
	img.style.verticalAlign = "middle"
	img.src = this.url + "img/dialog.png"
	layer.header.appendChild(img)

	layer.detailCanvas = document.createElement("canvas")
	layer.detailCanvas.className = "meme-layer-detail-canvas"
	layer.detail.appendChild(layer.detailCanvas)

	var newDialogInput = document.createElement("input");
	newDialogInput.className = "dialog-edit-box";
	newDialogInput.value = dialog.text;
	layer.detail.appendChild(newDialogInput)
	
	newDialogInput.onkeyup = function () {
		dialog.text = newDialogInput.value;
	}

	dialog.refreshLayer = () => this.drawActions(dialog.xyt, layer.detailCanvas)
	dialog.refreshLayer()

	return layer
};

MemeCreator.prototype.makeSoundLayerDiv = function (layerData) {
	
	var layer = this.makeLayerDiv(layerData)
	var img = document.createElement("img")
	img.src = this.url + "img/melody.png"
	layer.header.appendChild(img)

	layer.actionUIs = []
	
	for (var action of layerData.actions) {
		layer.actionUIs.push(this.makeSoundLayerActionDiv(layer, layerData, action))
	}

	//todo referseh layer shouhld not be on the data object!
	layerData.refreshLayer = () => this.drawSoundtrack(layer)
	layerData.refreshLayer()

	let extras = this.player.layerExtras.get(layerData)
	extras.editorUI = layer

	return layer
};

MemeCreator.prototype.loadParameters = function () {
	var paramString = document.location.search;
	var nvp;
	var params = {}

	if (paramString.length > 1) {
		paramString = paramString.slice(1).split("&");
		for (var ip = 0; ip < paramString.length; ip++) {
			nvp = paramString[ip].split("=");
			params[nvp[0]] = nvp[1] 
			
		}
	}

	if (params.id) {
		this.loadId(params.id);
	}
	if (params.use) {
		this.useThing(params.use)
	}

	if (!params.id && !params.use) {
		this.player.load({
			type: "MEME",
			width: 480,
			height: 320,
			layers: []
		})
		this.onLoad()
	}
};

MemeCreator.prototype.loadId = function (id) {
	omg.server.getId(id, (response) => {
		this.player.load(response);
		
		this.onLoad()

		document.getElementById("main-name-input").value = this.meme.name || ""
		document.getElementById("main-tags-input").value = this.meme.tags || ""
	
	});
};

MemeCreator.prototype.onLoad = function () {
	this.meme = this.player.meme
	this.tabs[0].div.onclick()
	this.setupCanvasEvents()
	this.setupLayers()
}

MemeCreator.prototype.setupLayers = function () {
	if (!this.meme || !this.meme.layers) {
		return
	}

	this.meme.layers.forEach(layer => {
		var layerDiv

		switch (layer.type) {
			case "CHARACTER":
				layerDiv = this.makeLayerDiv(layer)
				this.makeCharacterButton(layer, layerDiv)
				break
			case "DIALOG":
				this.makeDialogLayerDiv(layer);
				break
			case "DOODLE":
				this.makeDoodleLayer(layer);
				break
			case "SOUNDTRACK":
				this.makeSoundLayerDiv(layer);
				break
		}
	})

}

function MemeCanvasEventHandler(memeCreator) {
	this.memeCreator = memeCreator;

	var player = memeCreator.player
	this.player = player
	var tool = this;
	this.started = false;
	this.drawnSegments = 0;
	this.looperCounter = 0;

	this.touchstart = function (ev) {
		ev.preventDefault();
		tool.setOffsets();
		x = ev.targetTouches[0].pageX - this.canvasOffsetLeft;
		y = ev.targetTouches[0].pageY - this.canvasOffsetTop;
		tool.start(x, y);
	}
	this.touchmove = function (ev) {
		ev.preventDefault(); 
		x = ev.targetTouches[0].pageX - this.canvasOffsetLeft;
		y = ev.targetTouches[0].pageY - this.canvasOffsetTop;
		tool.move(x, y);
	}
	this.touchend = function (ev) {
		ev.preventDefault(); 
		tool.end(ev.targetTouches[0].pageX - this.canvasOffsetLeft,
				ev.targetTouches[0].pageY - this.canvasOffsetTop);
	}

	this.setOffsets = () => {
		//todo use omg.ui.getOffsets?
		this.canvasOffsetLeft = player.canvas.offsetLeft +  
				player.canvas.parentElement.offsetLeft; 
				//this.canvas.parentElement.parentElement.offsetLeft;
		this.canvasOffsetTop = player.canvas.offsetTop +  
				player.canvas.parentElement.offsetTop; 
				//this.canvas.parentElement.parentElement.offsetTop;
	}

	this.mousedown = (ev) => {
		tool.setOffsets();
		tool.start(
			ev.pageX - this.canvasOffsetLeft, 
			ev.pageY - this.canvasOffsetTop
		);
	}
	this.start = (x, y) => {
		x = (x - player.horizontalPadding / 2) / (player.canvas.clientWidth - player.horizontalPadding)
		y = (y - player.verticalPadding / 2) / (player.canvas.clientHeight - player.verticalPadding)
		
		tool.started = true;
		if (this.memeCreator.mode === "CHARACTER"){
			this.characterStartTouch(x, y)
		}
		else if (this.memeCreator.mode === "DIALOG"){
			this.dialogStartTouch(x, y)
		}
		else if (this.memeCreator.mode === "DOODLE") {
			this.doodleStartTouch(x, y, tool);
		}
		else if (this.memeCreator.mode == "SOUNDTRACK"){
			this.soundtrackStartTouch(x, y, tool);
		}
		else if (this.memeCreator.mode == "VIDEO"){
			this.videoStartTouch(x, y, tool);
		}
	};

	this.mousemove = ev => {
		tool.setOffsets();
		var x = ev.pageX - this.canvasOffsetLeft;
		var y = ev.pageY - this.canvasOffsetTop;
		tool.move(x, y);
	}
	this.mouseout = (ev) => {
		if (this.memeCreator.mode === "CHARACTER"){
			var x = ev.pageX - this.canvasOffsetLeft;
			var y = ev.pageY - this.canvasOffsetTop;
			tool.move(x, y);
			player.preview.x = -1;
			player.preview.y = -1;
			player.preview.drawSelection = false;
		}
		else if (this.memeCreator.mode === "DIALOG") {
			player.preview.x = -1;
			player.preview.y = -1;	
		}
		
	};

	this.move = (x, y) => {
		x = (x - player.horizontalPadding / 2) / (player.canvas.clientWidth - player.horizontalPadding)
		y = (y - player.verticalPadding / 2) / (player.canvas.clientHeight - player.verticalPadding)
		
		if (this.memeCreator.preview) {
			this.memeCreator.preview.x = x;
			this.memeCreator.preview.y = y;
		}

		if (tool.started) {
			if (this.memeCreator.mode === "CHARACTER"){
				var char = this.memeCreator.preview
				var actions = char.actions;
				var time = Date.now() - tool.loopCounter;
				var cuts = (char.i+1 < actions.length && 
					actions[char.i+1][2] < time) ? 1 : 0;
				actions.splice(char.i+1, cuts, [x - tool.offX, y - tool.offY, time]);			
				char.i++;
			}
			else if (this.memeCreator.mode === "DIALOG"){
				this.memeCreator.preview.x = x
				this.memeCreator.preview.y = y
				this.memeCreator.preview.xyt.push([x, y, Date.now() - this.loopCounter])
			}
			else if (this.memeCreator.mode === "DOODLE"){
				tool.doodleTouchMove(x, y, tool);
			}
			else if (this.memeCreator.mode === "SOUNDTRACK"){
				tool.soundtrackTouchMove(x, y, tool);
			}
			else if (this.memeCreator.mode == "VIDEO"){
				tool.videoTouchMove(x, y, tool);
			}

			if (this.memeCreator.preview && this.memeCreator.preview.refreshLayer) {
				this.memeCreator.preview.refreshLayer()
			}
		}
	};

	this.mouseup = (ev) => {
		ev.preventDefault(); 
		tool.end(ev.pageX - this.canvasOffsetLeft,
				ev.pageY - this.canvasOffsetTop)
	}

	this.end = function (x, y) {
		x = (x - player.horizontalPadding / 2) / (player.canvas.clientWidth - player.horizontalPadding)
		y = (y - player.verticalPadding / 2) / (player.canvas.clientHeight - player.verticalPadding)
		
		if (tool.started) {
			tool.started = false;
			if (this.memeCreator.mode == "CHARACTER"){
				tool.drawnSegments++;

				var char = this.memeCreator.preview;
				char.i = 0;
				char.recordingStarted = 0;
				player.recordPastPlay = false;

				setTimeout(() => {
					if (player.paused){
						player.playButton();
					}
				}, 20);

				tool.drawnPaths++;

				char.refreshLayer()
			}
			else if (this.memeCreator.mode === "DIALOG"){
				this.memeCreator.preview.xyt.push([x, y, Date.now() - tool.loopCounter])
				this.memeCreator.preview.xyt.push(["stop", "stop", Date.now() - tool.loopCounter])
				this.memeCreator.preview.refreshLayer()

				player.recordPastPlay = false;
				//setTimeout(function(){
					if (this.paused && this.replayAfterRecord){
						playButton();
					}
				//}, 20);
			}
			else if (this.memeCreator.mode === "DOODLE"){
				tool.doodleTouchEnd(x, y);
			}
			else if (this.memeCreator.mode === "SOUNDTRACK"){
				tool.soundtrackTouchEnd(tool);
			}
			else if (this.memeCreator.mode === "VIDEO"){
				tool.videoTouchEnd(tool);
			}
		}
	};
}

MemeCanvasEventHandler.prototype.characterStartTouch = function (x, y) {

	var char = this.memeCreator.preview
	if (!char){
		this.started = false;
		return;
	}
	if (char.actions && char.actions.length > 0){
		this.offX = x - char.actions[char.i][0];
		this.offY = y - char.actions[char.i][1];
	}
	else {
		this.offX = 0;
		this.offY = 0;
	}
	char.drawSelection = false;
	char.x = -1;
	char.y = -1;

	var time = this.player.position;
	this.player.recordPastPlay = true;
	if (this.player.paused){
		this.player.resume();
	}
	char.recordingStarted = time;
	var actions = char.actions;
	if (!actions){
		actions =[];
		char.actions = actions;
	}

	this.loopCounter = Date.now() - time;

	var cuts = (char.i < actions.length && 
		actions[char.i][2] < time) ? 1 : 0;
	actions.splice(char.i, cuts, [x - this.offX, y - this.offY, time]);

}

MemeCanvasEventHandler.prototype.soundtrackStartTouch = function (x, y, tool) {
	
	if (this.startTime) {
		this.soundtrackFinish()
		return 
	}

	this.started = true
	this.startTime = Date.now()

	var time = this.player.position;
	this.player.recordPastPlay = true;
	if (this.player.paused){
		this.player.resume();
	}
	this.loopCounter = Date.now() - time;
	//var text = memeCreator.dialogInput.value;
	
	let layerUI
	if (this.memeCreator.meme.layers.indexOf(this.memeCreator.preview) === -1) {
		this.memeCreator.preview.i = 0
		this.memeCreator.meme.layers.push(this.memeCreator.preview)
		layerUI = this.memeCreator.makeSoundLayerDiv(this.memeCreator.preview)
		this.memeCreator.highlightDiv(layerUI.div)
	}
	else {
		layerUI = this.player.layerExtras.get(this.memeCreator.preview).editorUI
	}

	this.action = {action: "play", time, totalSubbeats: 0}
	this.memeCreator.preview.actions.push(this.action)
	
	let actionUI = this.memeCreator.makeSoundLayerActionDiv(layerUI, this.memeCreator.preview, this.action)
	layerUI.actionUIs.push(actionUI)

	if (this.memeCreator.preview.thing.type === "SONG") {
		this.memeCreator.setupSoundtrackRecording(actionUI)
	}
}

MemeCanvasEventHandler.prototype.soundtrackTouchMove = function (x, y, tool){}

MemeCanvasEventHandler.prototype.soundtrackTouchEnd = function () {
	
	if (Date.now() - this.startTime < 200) {
		return // short click, let the music play
	}

	this.soundtrackFinish()

}

MemeCanvasEventHandler.prototype.soundtrackFinish = function () {
	let now = Date.now()

	//this makes sure our sound doesn't go off the end of the scene
	//todo do this for all media types
	this.action.length = now - this.startTime
	if (this.player.meme.length < now - this.player.started) {
		this.player.meme.length = now - this.player.started	
	}

	this.player.recordPastPlay = false;

	this.memeCreator.preview.refreshLayer()

	this.startTime = 0
	this.started = false
}

MemeCanvasEventHandler.prototype.dialogStartTouch = function (x, y) {
	this.started = true
	this.memeCreator.preview = this.player.preview
	
	this.memeCreator.preview.x = x;
	this.memeCreator.preview.y = y;
	
	var time = this.player.position;
	this.player.recordPastPlay = true;
	if (this.player.paused){
		this.player.resume();
	}
	this.loopCounter = Date.now() - time;
	
	this.memeCreator.preview.xyt.push([x, y, time])

	if (this.player.meme.layers.indexOf(this.memeCreator.preview) === -1) {
		this.player.meme.layers.push(this.memeCreator.preview)
		let layer = this.memeCreator.makeDialogLayerDiv(this.memeCreator.preview);
		this.memeCreator.highlightDiv(layer.div)
	}
}

MemeCanvasEventHandler.prototype.doodleStartTouch = function (x, y, tool) {

	var mc = this.memeCreator
	
	var time = mc.player.position;
	
	mc.player.recordPastPlay = true;
	if (mc.player.paused){
		mc.player.resume();
	}
	this.loopCounter = Date.now() - time;
	
	mc.preview.xyt.push([x, y, time]);	

	this.t = Date.now();

	if (mc.meme.layers.indexOf(mc.preview) === -1) {
		mc.meme.layers.push(mc.preview)
		mc.makeDoodleLayer(mc.preview)
	}
};
MemeCanvasEventHandler.prototype.doodleTouchMove = function (x, y, tool){
	this.memeCreator.preview.xyt.push([x, y, Date.now() - this.loopCounter]);
};
MemeCanvasEventHandler.prototype.doodleTouchEnd = function (x, y) {

	this.memeCreator.preview.xyt.push([-1, -1, Date.now() - this.loopCounter]);

	this.memeCreator.preview.refreshLayer()
	this.memeCreator.player.recordPastPlay = false;
};


MemeCanvasEventHandler.prototype.videoStartTouch = function (x, y, tool){

	var time = this.player.position;
	var vid = this.player.video;
	player.recordPastPlay = true;
	if (this.player.paused){
		resume();
	}
	tool.loopCounter = Date.now() - time;
	if (vid.current > -1){
		var vData = vid.list[vid.current].data;
		tool.i = vData.length;
		vData[vData.length] = [[x, y, time]];
		var el = vid.elements[vid.current];
		el.style.left = (x - el.clientWidth/2) + "px";		
		el.style.top = (y - el.clientHeight/2) + "px";
		el.currentTime = 0;
		el.style.visibility = "visible";
		el.j = vData.length - 1;
		el.play();
	}
	tool.t = Date.now();
};
MemeCanvasEventHandler.prototype.videoTouchMove = function (x, y, tool) {
	var vid = this.player.video;
	if (vid.current > -1){
		var vData = vid.list[vid.current].data;
		vData[tool.i][vData[tool.i].length] =
			[x, y, Date.now() - tool.loopCounter];
		var el = vid.elements[vid.current];		
		el.style.left = (x - el.clientWidth/2) + "px";		
		el.style.top = (y - el.clientHeight/2) + "px";
	}
};
MemeCanvasEventHandler.prototype.videoTouchEnd = function (tool) {
	var vid = this.player.video;
	if (vid.current > -1){
		var clickTime = Date.now() - tool.t;
		var vData = vid.list[vid.current].data;
		if (clickTime < 125){
			this.player.length = Math.max(this.player.length, 
					this.player.position + (vid.elements[vid.current].duration * 1000));
			vData[tool.i][vData[tool.i].length] =
				[-1, -1, 
				(Date.now() - tool.loopCounter) + 
				(vid.elements[vid.current].duration - vid.elements[vid.current].currentTime) * 1000];
		}
		else {
			vData[tool.i][vData[tool.i].length] =
				[-1, -1, Date.now() - tool.loopCounter];
			vid.elements[vid.current].pause();
			vid.elements[vid.current].style.visibility = "hidden";
		}
	}
	player.recordPastPlay = false;
	setTimeout(function(){
		if (this.player.paused){
			playButton();
		}
		else {
			//TODO may have to add this to play list
		}
	}, 20);
};


MemeCreator.prototype.setupCanvasEvents = function () {
	var tool = new MemeCanvasEventHandler(this);
	var canvas = this.player.canvas
	canvas.addEventListener("mouseout", tool.mouseout, false);
	canvas.addEventListener("mousedown", tool.mousedown, false);
	canvas.addEventListener("mousemove", tool.mousemove, false);
	canvas.addEventListener("mouseup",   tool.mouseup, false);
	canvas.addEventListener("touchstart", tool.touchstart, false);
	canvas.addEventListener("touchmove", tool.touchmove, false);
	canvas.addEventListener("touchend",   tool.touchend, false);
	
	this.canvasEventHandler = tool
}

MemeCreator.prototype.makeSearchBox = function (types, onclickcontent) {
	var html = `
		<div class="feed-options">
            <select class="search-user">
                <option value="">All Users</option>
                <!--todo <option value="following">Following</option>-->
                <option value="me">Me</option>
            </select>
            <select class="search-type">
				<!--<option selected="" value="">All Types</option>-->
			</select>
            <select class="search-sort">
                <option value="">Most Recent</option>
                <option value="most-plays">Most Plays</option>
                <!--<option value="most-remixes">Most Remixes</option>-->
            </select>
            <input class="search-terms" placeholder="Search">
		</div>
		<hr>
		<div class="search-box-results">
		`
		
	var searchBox = {}
	searchBox.div = document.createElement("div")
	searchBox.div.innerHTML = html
	var searchUser = searchBox.div.getElementsByClassName("search-user")[0]
	var searchType = searchBox.div.getElementsByClassName("search-type")[0]
	var resultList = searchBox.div.getElementsByClassName("search-box-results")[0]

	types.forEach(type => {
		var typeOption = document.createElement("option")
		typeOption.innerHTML = type
		searchType.appendChild(typeOption)
	})

	searchType.onchange = () => searchBox.search()
	searchBox.search = () => {
		let params = {type: searchType.value, resultList, 
			viewerParams: {maxHeight:60, viewMode: "MICRO", onclickcontent}}

		omg.search(params, true)
	}

	return searchBox
}


MemeCreator.prototype.makeLayerDiv = function (layer) {
	
	var div = document.createElement('div')
	div.className = "meme-layer-controls"
	
	this.layersDiv.appendChild(div)

	var header = document.createElement("div")
	header.className = "meme-layer-header"

	var detail = document.createElement("div")
	detail.className = "meme-layer-detail"

	div.appendChild(header)
	div.appendChild(detail)

	header.onclick = () => {
		
		this.preview = layer
		this.player.preview = layer
			
		this.mode = layer.type

		this.highlightDiv(div)
	}

	header.oncontextmenu = e => {
		this.showLayerContextMenu(e, layer, div)
	}

	return {div, header, detail}
}

MemeCreator.prototype.makeCharacterLayerRefresh = function (character, layer) {
	return () => {
		this.drawActions(character.actions, layer.detailCanvas)
	}	
}

MemeCreator.prototype.drawActions = function (actions, canvas) {
	var context = canvas.getContext("2d")
	canvas.width = canvas.clientWidth
	canvas.height = canvas.clientHeight

	var middle = canvas.height / 2
	var duration = this.player.meme.length

	context.lineWidth = 2
	var last, d
	for (var j = 0; j < 2; j++) {
		context.strokeStyle = j ? "red" : "blue"
		for (var i = 0; i < actions.length; i++) {
			if (i === 0) {
				context.beginPath()
				context.moveTo(actions[i][2] / duration * canvas.width, middle)
			}
			else {
				if (actions[i][j] !== -1 && last !== -1) {
					d = (actions[i][j] - last) * canvas.height * 5
					context.lineTo(actions[i][2] / duration * canvas.width, middle - d)
				}
			}
			last = actions[i][j]
		}
		context.stroke()
	}
}

MemeCreator.prototype.drawSoundtrack = function (layer, canvas) {
	var actions = layer.actionUIs
	
	for (var i = 0; i < actions.length; i++) {
		this.positionSoundLayerAction(layer, actions[i].data, actions[i].canvas)
	}

}

MemeCreator.prototype.updatePlayhead = function (position) {
	
	if (this.meme.length !== this.lastMemeLength) {
		this.refreshLayers()
		this.lastMemeLength = this.meme.length
	}

	this.playhead.style.left = 72 + 
		(this.player.controlsCanvas.clientWidth - this.player.playButtonWidth) * 
		Math.max(0, Math.min(1, position / this.meme.length)) + 
		"px"
}

MemeCreator.prototype.makeDoodleLayer = function (doodle) {
	var layer = this.makeLayerDiv(doodle)
	var headerCanvas = document.createElement("canvas")
	headerCanvas.width = 40
	headerCanvas.height = 40
	headerCanvas.style.width = "40px"
	headerCanvas.style.height = "40px"
	layer.header.appendChild(headerCanvas)

	var ctx = headerCanvas.getContext("2d")
	ctx.fillStyle = "black"
	ctx.fillRect(0, 0, headerCanvas.width, headerCanvas.height)
	
	ctx.strokeStyle = doodle.color
	ctx.lineWidth = doodle.width
	ctx.beginPath()
	ctx.moveTo(0, headerCanvas.height / 2)
	ctx.lineTo(headerCanvas.width, headerCanvas.height / 2)
	ctx.stroke()
	
	var detailCanvas = document.createElement("canvas")
	detailCanvas.className = "meme-layer-detail-canvas"
	layer.detail.appendChild(detailCanvas)

	doodle.refreshLayer = () => this.drawActions(doodle.xyt, detailCanvas)
	doodle.refreshLayer()
}

MemeCreator.prototype.setupPanels = function () {
	var topPanels = document.getElementById("top-panels")
	var topBottomSeparator = document.getElementById("top-bottom-separator")

	this.playerDiv.style.height = this.playerDiv.clientHeight + "px"
	topPanels.style.height = this.playerDiv.style.height
	
	var originalHeight
	var originalY
	topBottomSeparator.onmousedown = e => {
		e.preventDefault()
		originalY = e.clientY
		originalHeight = this.playerDiv.clientHeight
		
		var fullscreenWindow = document.getElementById("fullscreen-window-background");
		fullscreenWindow.style.display = "block";
		fullscreenWindow.style.cursor = "ns-resize"

		fullscreenWindow.onmousemove = e => {
			e.preventDefault()
			if (originalY) {
				this.playerDiv.style.height = originalHeight - (originalY - e.clientY) + "px"
				topPanels.style.height = this.playerDiv.style.height

				this.player.sizeCanvas()

				if (this.remixerEl) {
					this.remixerEl.style.height = originalHeight - (originalY - e.clientY) - 48 + "px"
				}
			}
		}

		fullscreenWindow.onmouseup = e => {
			e.preventDefault()
			originalY = false
			fullscreenWindow.style.display = "none";
			fullscreenWindow.style.cursor = "default"
		}
	}
}

MemeCreator.prototype.newDialog = function () {
	return {type: "DIALOG", xyt: [], i: 0,
		text: this.dialogInput.value || this.dialogInput.placeHolder
	}
}





MemeCreator.prototype.setupHotKeys = function () {

	document.body.onkeypress = e => {
		if (e.charCode === 32 && e.target.tagName === "BODY") { 
			if (this.player.paused) {
				if (this.player.position >= this.meme.length) {
					this.player.play()
				}
				else {
					this.player.resume()	
				}
			}
			else {
				this.player.pause()
			}
		}
	}
	
}

MemeCreator.prototype.fillRoundedRect = function (x, y, w, h, r, context) {
	context.beginPath();
	context.moveTo(x + r, y);
	context.arcTo(x+w, y, x+w, y+h, r);
	context.arcTo(x+w, y+h, x, y+h, r);
	context.arcTo(x, y+h, x, y, r);
	context.arcTo(x, y, x+w, y, r);
	context.closePath();
	context.fill();
	context.stroke();

}

MemeCreator.prototype.showLayerContextMenu = function (e, layer, div) {
	e.preventDefault()

	var menu = document.createElement("div")
	menu.className = "layer-context-menu"
	menu.style.left = e.pageX + "px"
	menu.style.bottom = window.innerHeight - e.pageY + "px"
	
	var moveUpButton = document.createElement("div")
	moveUpButton.innerHTML = "Move Up"
	menu.appendChild(moveUpButton)

	var moveDownButton = document.createElement("div")
	moveDownButton.innerHTML = "Move Down"
	menu.appendChild(moveDownButton)
	
	var disableButton = document.createElement("div")
	disableButton.innerHTML = "Disable"
	menu.appendChild(disableButton)

	var removeButton = document.createElement("div")
	removeButton.innerHTML = "Delete"
	menu.appendChild(removeButton)

	var fullscreenWindow = document.getElementById("fullscreen-window-background");
	fullscreenWindow.style.display = "block";
	
	fullscreenWindow.style.zIndex = 9
	menu.style.zIndex = 10
	
	fullscreenWindow.onclick = e => {
		e.preventDefault()
		fullscreenWindow.style.display = "none";
		document.body.removeChild(menu)
	}
	fullscreenWindow.oncontextmenu = e => fullscreenWindow.onclick(e)

	document.body.appendChild(menu)
} 

MemeCreator.prototype.highlightDiv = function (div) {
	if (this.lastSelectedDiv) {
		this.lastSelectedDiv.classList.remove("highlighted")
	}
	div.classList.add("highlighted")
	this.lastSelectedDiv = div
}

MemeCreator.prototype.useThing = function (thingId) {

	this.player.load({
		type: "MEME",
		width: 480,
		height: 320,
		layers: []
	})
	
	omg.server.getId(thingId, thing => {
		if (thing.type === "IMAGE") {
			this.addBackground(thing)
		}
		else if (thing.type === "SONG") {
			this.player.meme.length = 5000
			var layer = this.addSoundtrack(thing)
			this.player.meme.layers.push(layer)
			layer.actions.push({action: "play", time: 0, length: 5000})
		}

		this.onLoad()
	})
}

MemeCreator.prototype.addSoundtrack = function (thing, player) {
	var layer = {
		type: "SOUNDTRACK",
		actions:[],
		thing: thing
	}
				
	if (thing.type === "AUDIO") {
		this.player.loadAudio(layer)
	}
	else {
		this.player.loadSoundtrack(layer, player)
	}
	return layer
}

MemeCreator.prototype.refreshLayers = function (layer) {

	/*if (layer && this.meme.duration === this.lastDuration) {
		layer.refreshLayer()
		return
	}*/
	
	this.meme.layers.forEach(layer => layer.refreshLayer())
}

MemeCreator.prototype.selectSoundFromSoundSet = function (viewer, el) {

	// todo this is all coupled to the class names in the html and css, which is bad
	
	if (!el || el.classList.contains("omg-viewer-embedd")) {
		//this is the whole sound set, doen't help
		return
	}

	if (el.classList.contains("omg-soundset-audio-sample")) {
		let data = viewer.divDataMap.get(el)
		let item = JSON.parse(JSON.stringify(data.item))
		item.type = "AUDIO"
		item.url = data.src 
		return {
			data: item,
			div: el
		}
	}
	else {
		return this.selectSoundFromSoundSet(viewer, el.parentElement)
	}



}

MemeCreator.prototype.makeSoundLayerActionDiv = function (layerUI, layerData, actionData) {

	let action = {data: actionData}
	action.canvas = document.createElement("canvas")
	action.canvas.className = "meme-layer-soundtrack-action"

	this.positionSoundLayerAction(layerUI, actionData, action.canvas)

	layerUI.detail.appendChild(action.canvas)

	let parentX = omg.ui.totalOffsets(layerUI.detail).left

	omg.ui.makeDraggable(action.canvas, action.data, {
		onstart: (x, y, context) => {
			context.offsetX = x - omg.ui.totalOffsets(action.canvas).left
		},
		onmove: (x, y, context) => {
			actionData.time = Math.min(this.meme.length - actionData.length, Math.max(0, 
				(x - parentX - context.offsetX) / layerUI.detail.clientWidth * this.meme.length))
		
			this.positionSoundLayerAction(layerUI, actionData, action.canvas)		 
		}
	})
	
	this.drawSoundtrackCanvas(layerData, action)
	return action
}

MemeCreator.prototype.positionSoundLayerAction = function (layerUI, action, actionUI) {

	let duration = this.player.position > this.player.meme.length ? this.player.position : this.player.meme.length
	
	actionUI.style.left = action.time / duration * layerUI.detail.clientWidth + "px"	
	actionUI.style.width = ((action.length || (this.player.position - action.time)) / duration) * layerUI.detail.clientWidth + "px"

}


MemeCreator.prototype.drawAudioCanvas = function (layer, canvas) {
	//context.fillStyle = "black"
	//context.fillText(soundtrack.thing.name, actions[i].time / duration * canvas.width + 4, 14)
 
	let context = canvas.getContext("2d")
	let buffer = this.player.layerExtras.get(layer).audio

	if (!buffer) return;

	var data = buffer.getChannelData( 0 );
	var step = Math.ceil( data.length / canvas.width );
	var amp = canvas.height / 2;
	for(var ii=0; ii < canvas.width; ii++){
		var min = 1.0;
		var max = -1.0;
		for (var j=0; j<step; j++) {
			var datum = data[(ii*step)+j]; 
			if (datum < min)
				min = datum;
			if (datum > max)
				max = datum;
		}
		context.fillRect(ii,(1+min)*amp,1,Math.max(1,(max-min)*amp));
	}
}

MemeCreator.prototype.drawSoundtrackCanvas = function (layer, action) {
	if (layer.thing.type === "AUDIO") {
		this.drawAudioCanvas(layer, action.canvas)
		return
	}

	this.musicDrawer.drawCanvas(layer.thing, action.canvas, action.data.totalSubbeats, action.data.sections)
}

MemeCreator.prototype.onLayerLoaded = function (layer, extras) {
	if (layer.type === "SOUNDTRACK") {

		if (extras.editorUI) {
			for (var actionUI of extras.editorUI.actionUIs) {
				this.drawSoundtrackCanvas(layer, actionUI)
			}
		}

	}
}

MemeCreator.prototype.showRemixer = function () {
	if (!this.remixerEl ) {
		this.remixerEl = document.createElement("iframe")

		this.remixerEl.onload = () => {
			this.remixer = this.remixerEl.contentWindow.tg
			let layer = this.addSoundtrack(this.remixer.song.data, this.remixer.player)
			this.preview = layer
			this.player.preview = layer	
		}

		this.remixerEl.src = "/apps/music/remixer/?singlePanel"
		this.remixerParent = document.getElementById("soundtrack-remixer")
		this.remixerParent.appendChild(this.remixerEl)
		
	}
	
	this.isRemixerShowing = true	
	
	//this.highlightDiv(div)

	this.remixerParent.style.display = "block"
	this.remixerParent.style.height = this.playerDiv.clientHeight - this.remixerParent.offsetTop + "px"
	
}

MemeCreator.prototype.setupSoundtrackRecording = function (clip) {

	let extras = this.player.layerExtras.get(this.preview)
	
	let remixerBeatPlayedListener = (subbeat) => {

		if (subbeat === -1) {
			let i = extras.musicPlayer.onBeatPlayedListeners.indexOf(remixerBeatPlayedListener)
			if (i > -1) {
				extras.musicPlayer.onBeatPlayedListeners.splice(i, 1)
				extras.song.data.sections = clip.data.sections
				//this.preview.thing = extras.song.getData()
			}
			return
		}

		if (subbeat === 0) {
			if (!clip.data.sections) {
				clip.data.sections = []
			}
			clip.data.sections.push(JSON.parse(JSON.stringify(this.remixer.currentSection.data)))
		}
		
		clip.data.totalSubbeats++
	
		this.musicDrawer.drawCanvas(this.preview.thing, clip.canvas, clip.data.totalSubbeats, clip.data.sections)
	}

	//this.musicDrawer.drawCanvas(this.preview.thing, clip.canvas, clip.data.totalSubbeats)
	extras.musicPlayer.onBeatPlayedListeners.push(remixerBeatPlayedListener)
}
