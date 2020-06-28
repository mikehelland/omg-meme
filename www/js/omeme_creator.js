"use strict";

//in June 2020 I revived this beast which was written well before ES6

function MemeCreator(params) {	
	this.url = "/apps/meme/" //todo make this smarter?
	this.playerDiv = params.playerDiv
	this.setupTabs();

	//todo make this a color picker or something
	this.colors = ["#FFFFFF", "#808080", "#FF0000", "#FFFF00", 
				  "#00FF00", "#00FFFF", "#0000FF", "#800080"]

	this.playSeekControls = document.getElementById("play-seek-controls")
	this.playhead = document.getElementById("playhead")
	this.layersDiv = document.getElementById("layer-list")

	this.player = new OMemePlayer({div: params.playerDiv, controlsDiv: this.playSeekControls});
	this.player.onupdateposition = (position) => this.updatePlayhead(position)

	this.loadParameters();

	this.setupPanels()
}

MemeCreator.prototype.setupTabs = function () {
	var mc = this;
	var tabs = [
	            {mode: "BACKGROUND"},
			    {mode: "CHARACTER"},
			    {mode: "DIALOG"},
			    {mode: "SOUNDTRACK"},
			    {mode: "DOODLE"},
			    {mode: "SUBMIT"}
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
		document.getElementById("post-button").onclick = () => {
			omg.server.post(this.meme, result => {
				if (result && result.id) {
					window.location = "/view/" + result.id
				}
			});
		}
	}
	tab.shown = true;
};

MemeCreator.prototype.showDoodleTab = function (tab) {
	if (tab.shown)
		return;

	this.doodles = {}
	this.doodles.currentWidth = 6;
	
	for (var ic = 0; ic < this.colors.length; ic++) {
		tab.pageDiv.appendChild(this.makeDoodleColorBox(ic));
	}
	
	var pp = document.createElement("span");
	pp.innerHTML = "<br/>Line Width:";
	tab.pageDiv.appendChild(pp);
	
	var select, option;
	select = document.createElement("select");
	for (ic = 1; ic < 21; ic++) {
		option = document.createElement("option");
		option.value = ic;
		option.innerHTML = ic;
		
		if (ic == this.doodles.currentWidth) {
			option.selected = true;
		}
		select.add(option);
	}
	select.onchange = () => {
		this.doodles.currentWidth = parseInt(select.value); 
	};
	tab.pageDiv.appendChild(select);

};

MemeCreator.prototype.makeDoodleColorBox = function (i) {
	var colorBox = document.createElement("div");
	colorBox.className = "doodle-color-box";
	colorBox.style.backgroundColor = this.colors[i];
	colorBox.onclick = () => {
		var offs = 5;
		if (this.doodles.currentColorBox){ 
			var oldColor = this.doodles.currentColorBox;
			oldColor.className = "doodle-color-box";
			oldColor.style.zIndex = 0;
		}
		var newColor = colorBox;

		newColor.className = "selected-doodle-color-box";
		newColor.style.zIndex = 1;
		this.doodles.currentColor = this.colors[i];
		this.doodles.currentColorBox = newColor;
	};
	return colorBox;	

};

MemeCreator.prototype.showBackgroundTab = function (tab) {
	if (tab.shown)
		return;

	var userList = tab.pageDiv.getElementsByClassName("row-list")[0];

	var searchBox = this.makeSearchBox(["IMAGE", "IMAGESET"])
	userList.appendChild(searchBox)
	
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
	
	var newRow = document.createElement("img"); //omg.newDiv();
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
	if (tab.shown)
		return;

	var userList = tab.pageDiv.getElementsByClassName("recent-character-list")[0];

	var searchBox = this.makeSearchBox(["SPRITE", "IMAGE", "IMAGESET", "TILESET"])
	userList.appendChild(searchBox)
	
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
		//this.characterList.errorLoadingDiv.style.display = "inline-block";
	};
	var loadCallback = (character) => {
		this.meme.layers.push(character)
		var layerDiv = this.makeLayerDiv(character)
		this.makeCharacterButton(character, layerDiv);
		
		this.preview = character
		this.player.preview = character
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

	//this.selectListButton(this.characterList.children, newCanvas, "character-button");
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
	if (tab.shown)
		return;

	var mc = this;

	this.soundList = tab.pageDiv.getElementsByClassName("row-list")[0];
	
};

MemeCreator.prototype.showAddSoundDialog = function (pageDiv, tab) {
	if (pageDiv.shown)
		return;
	pageDiv.shown = true;

	var mc = this;

	var imgInput = pageDiv.getElementsByClassName("url")[0];
	var nextButton = pageDiv.getElementsByClassName("url-next")[0];
	nextButton.onclick = function () {
		var sound = addSoundFile(imgInput.value);
		mc.makeSoundButton(sound);	
		if (pageDiv.finishCallback) {
			pageDiv.finishCallback();
		}

	};

	imgInput.onkeypress = function (key) {
		if (key.key == "Enter") {
			nextButton.onclick();
		}
		else {
			//mc.errorLoadingBackgroundDiv.style.display = "none";
		}
	};

	var uploadLog = pageDiv.getElementsByClassName("upload-log")[0];
	var updateUploadLog = function (newLine) {
		uploadLog.innerHTML = newLine;
	};
	
	var uploadButton = pageDiv.getElementsByClassName("upload-next")[0]; 
	var dataForm = document.getElementById("upload-form");

	var uploadParams = {button: uploadButton, 
							form: dataForm, 
							log: uploadLog, 
							logCallback: updateUploadLog,
							okCallback: function (response) {
								var sound = addSoundFile("/upload?blob-key=" + response.blobKey);
								mc.makeSoundButton(sound);	

								if (pageDiv.finishCallback) {
									pageDiv.finishCallback();
								}
							}};
	
	omg.util.setupUploadButton(uploadParams);

	
};

MemeCreator.prototype.createDrumbeat = function () {
	this.showOMGBam({command: "new", type : "DRUMBEAT"});
	this.bam.beatmaker.setSize();
};

MemeCreator.prototype.createMelody = function () {
	this.showOMGBam({command: "new", type : "MELODY"});
	this.bam.mm.setSize();
};

MemeCreator.prototype.showOMGBam = function (params) {

	var mc = this;

	mc.bam = new OMusicEditor();
	
	var fullscreenWindow = document.getElementById("fullscreen-window-background");
	fullscreenWindow.style.display = "block";

	var omgbam = document.getElementById("omgbam");
	var omgbamDialog = document.getElementById("omgbam-dialog");
	
	omgbamDialog.style.display = "block";
	
	var closeOMGBamDialog = function () {
		fullscreenWindow.style.display = "none";
		omgbamDialog.style.display = "none";
		mc.bam.player.stop();
		mc.bam.player.editting = false;
		
		mc.bam.clear();
	};
	
	var okButton = document.getElementById("omgbam-dialog-ok")
	okButton.onclick = function () {
		var data;
		var song;
		var section;
		if (mc.bam.song.sections.length > 0) {
			song = mc.bam.song;
		}
		else if (mc.bam.section.parts.length > 0) {
			song = new OMGSong();
			song.sections.push(mc.bam.section);
		}
		else {
			song = new OMGSong();
			section = new OMGSection();
			song.sections.push(section);
			section.parts.push(mc.bam.part)
		}
		
		song = addOpenMusicSong(song);
		mc.makeSoundButton(song);
		
		closeOMGBamDialog();		
	};

	var cancelButton = document.getElementById("omgbam-dialog-cancel")
	cancelButton.onclick = function () {
		closeOMGBamDialog();		
	};

	mc.bam.setup(false);
	mc.bam.player.editting = true;

	mc.bam.load(params);
	mc.bam.offsetTop = 60;
};




MemeCreator.prototype.selectListButton = function (list, button, className){
	
	for (var ib = 0; ib < list.length; ib++) {
		if (list[ib] == button) {
			list[ib].className = "selected-" + className;
		}
		else {
			list[ib].className = className;
		}
	}
};


MemeCreator.prototype.makeSoundButton = function (sound){
	var mc = this;
	var newItem = document.createElement("div");
		
	newItem.onclick = function () {
		recallSound(sound);
		mc.selectListButton(mc.soundList.children, newItem, "sound-button");
	};
	
	this.soundList.appendChild(newItem);		
	this.selectListButton(this.soundList.children, newItem, "sound-button");
	
};


MemeCreator.prototype.showDialogTab = function (tab) {

	if (!this.dialogInput) {
		this.dialogInput = document.getElementById("dialog-text")
	}

	this.preview = this.newDialog()

	//todo unselect current layer

	this.player.preview = this.preview

};

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
	};

	dialog.refreshLayer = () => this.drawActions(dialog.xyt, layer.detailCanvas)
	dialog.refreshLayer()
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
	else {
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
		x = x / player.canvas.clientWidth
		y = y / player.canvas.clientHeight
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
		x = x / player.canvas.clientWidth
		y = y / player.canvas.clientHeight
		
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
			else if (this.memeCreator.mode == "SOUNDTRACK"){
				tool.soundtrackTouchMove(x, y, tool);
			}
			else if (this.memeCreator.mode == "VIDEO"){
				tool.videoTouchMove(x, y, tool);
			}
		}
	};

	this.mouseup = (ev) => {
		ev.preventDefault(); 
		tool.end(ev.pageX - this.canvasOffsetLeft,
				ev.pageY - this.canvasOffsetTop)
	}

	this.end = function (x, y) {
		x = x / player.canvas.clientWidth
		y = y / player.canvas.clientHeight
		
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

				this.player.preview = this.memeCreator.newDialog()
				this.memeCreator.preview = this.player.preview

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
	var time = this.position;
	var strack = this.soundtrack;
	player.recordPastPlay = true;
	if (this.paused){
		resume();
	}
	tool.loopCounter = Date.now() - time;
	if (strack.currentSound > -1){
		
		strack.sounds[strack.currentSound].data.push([time, -1]);
		if (strack.sounds[strack.currentSound].type == "omgsong") {
			oMemePlayer.player.play(strack.sounds[strack.currentSound].omgsong);
		}
		else {
			strack.soundAudios[strack.currentSound].currentTime = 0;
			strack.soundAudios[strack.currentSound].play();			
		}
	}
	else {
		var wasFresh = this.soundtrack.fresh; 
		if (this.soundtrack.fresh){
			tool.channel = {instrument: this.soundtrack.currentColor, data: [], i: 0};
			this.soundtrack.channels[this.soundtrack.channels.length] = tool.channel;
			this.soundtrack.fresh = false;
			if (this.audio){
				var chan = makeChannel(this.soundtrack.currentColor);
				this.audio.channels[this.audio.channels.length] = chan;
				tool.audioChan = chan;
			}
		}
		else {
			if (this.audio){
				tool.audioChan.gain.gain.value = tool.audioChan.defaultGain;
				tool.audioChan.recording = true;
			}
		}
		if (this.audio){
			var freq = makeFreq(y) ;
			var panX = makePan(x);
			tool.audioChan.osc.frequency.value = freq;
			tool.audioChan.panner.setPosition(panX, 0, 0);
			tool.audioChan.data[tool.audioChan.data.length] = {"freq": freq, "pan":panX, "time":time};		
		}
		tool.channel.data[tool.channel.data.length] = [x, y, time];
		if (wasFresh){
			this.soundtrack.channels.sort(function(a,b){return a.data[0][2] - b.data[0][2]});
			if (this.audio){
				this.audio.channels.sort(function(a,b){return a.data[0].time - b.data[0].time});
			}
		}
	}
	tool.t = Date.now();
};
MemeCanvasEventHandler.prototype.soundtrackTouchMove = function (x, y, tool){
	if (this.soundtrack.currentSound > -1){
	}
	else {
		if (this.audio){
			var freq = makeFreq(y) ;
			var panX = makePan(x);
			tool.audioChan.osc.frequency.setValueAtTime(freq, 0);
			tool.audioChan.panner.setPosition(panX, 0, 0);
			tool.audioChan.data[tool.audioChan.data.length] = {"freq": freq, "pan":panX};
		}
		tool.channel.data[tool.channel.data.length] = [x, y, Date.now() - tool.loopCounter];
	}
};
MemeCanvasEventHandler.prototype.soundtrackTouchEnd = function (tool){
	var strack = this.soundtrack;
	if (strack.currentSound > -1){
		var clickTime = Date.now() - tool.t;
		var sdata = strack.sounds[strack.currentSound].data;
		if (clickTime < 125){
			var mediaLength = strack.soundAudios[strack.currentSound].duration * 1000;
			this.length = Math.max(this.length, 
					this.position + mediaLength);
			sdata[sdata.length - 1][1] = sdata[sdata.length - 1][0] + mediaLength;
		}
		else {
			sdata[sdata.length - 1][1] = Date.now() - tool.loopCounter;
			if (strack.sounds[strack.currentSound].type == "omgsong")
				oMemePlayer.player.stop();
			else
				strack.soundAudios[strack.currentSound].pause();
		}
	}
	else {
		if (this.audio){
			tool.audioChan.gain.gain.value = 0;
			tool.audioChan.data[tool.audioChan.data.length] = {"freq": -1, "pan": -1};
			tool.audioChan.recording = false;
		}
		tool.channel.data[tool.channel.data.length] = [-1, -1, Date.now() - tool.loopCounter];
	}
	player.recordPastPlay = false;
	setTimeout(function(){
		if (this.paused){
			playButton();
		}
		else {
			//TODO may have to add this to playList
		}
	}, 20);
};

MemeCanvasEventHandler.prototype.dialogStartTouch = function (x, y) {
	this.started = true
	this.memeCreator.preview = this.player.preview
	this.player.preview = undefined

	this.memeCreator.preview.x = x;
	this.memeCreator.preview.y = y;
	
	var time = this.player.position;
	this.player.recordPastPlay = true;
	if (this.player.paused){
		this.player.resume();
	}
	this.loopCounter = Date.now() - time;
	//var text = memeCreator.dialogInput.value;
	
	this.memeCreator.preview.xyt.push([x, y, time])
	this.player.meme.layers.push(this.memeCreator.preview)
	this.memeCreator.makeDialogLayerDiv(this.memeCreator.preview);
}

MemeCanvasEventHandler.prototype.doodleStartTouch = function (x, y, tool) {

	var mc = this.memeCreator
	
	var time = mc.player.position;
	
	mc.player.recordPastPlay = true;
	if (mc.player.paused){
		mc.player.resume();
	}
	this.loopCounter = Date.now() - time;

	this.doodle = {type: "DOODLE", 
			color: mc.doodles.currentColor, 
			width: mc.doodles.currentWidth,
			xyt: [], 
			i: 0}; // do we need i?
	
	this.doodle.xyt.push([x, y, time]);	

	this.t = Date.now();

	//todo check to see if we can append or overwrite instead of add
	mc.meme.layers.push(this.doodle)
	mc.makeDoodleLayer(this.doodle)
};
MemeCanvasEventHandler.prototype.doodleTouchMove = function (x, y, tool){
	this.doodle.xyt.push([x, y, Date.now() - this.loopCounter]);
	this.doodle.refreshLayer()
};
MemeCanvasEventHandler.prototype.doodleTouchEnd = function (x, y) {

	this.doodle.xyt.push([x, y, Date.now() - this.loopCounter]);

	this.doodle.refreshLayer()
	this.memeCreator.player.recordPastPlay = false;
	setTimeout(() => {
		if (this.memeCreator.paused){
			
			//playButton();
		}
		else {
			//TODO may have to add this to playList
			// not sure what that comment means
		}
	}, 20);
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
	
}

MemeCreator.prototype.makeSearchBox = function (types) {
	var html = `
		<div class="feed-options">
            <select class="search-user">
                <option value="">All Users</option>
                <!--todo <option value="following">Following</option>-->
                <option value="me">Me</option>
            </select>
            <select class="search-type">
				<option selected="" value="">All Types</option>
			</select>
            <select class="search-sort">
                <option value="">Most Recent</option>
                <option value="most-plays">Most Plays</option>
                <!--<option value="most-remixes">Most Remixes</option>-->
            </select>
            <input class="search-terms" placeholder="Search">
		</div>
		<hr>`
		
	var searchBox = document.createElement("div")
	searchBox.innerHTML = html
	var searchUser = searchBox.getElementsByClassName("search-user")[0]
	var searchType = searchBox.getElementsByClassName("search-type")[0]

	types.forEach(type => {
		var typeOption = document.createElement("option")
		typeOption.innerHTML = type
		searchType.appendChild(typeOption)
	})

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
		if (this.lastSelectedLayer) {
			this.lastSelectedLayer.classList.remove("meme-layer-controls-selected")
		}

		if (layer.type === "CHARACTER") {
			console.log(layer)
			this.preview = layer
			this.player.preview = layer
			
		}
		this.mode = layer.type

		div.classList.add("meme-layer-controls-selected")
		this.lastSelectedLayer = div
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

	//document.createElement("canvas").getContext("2d").
	
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
				if (actions[i][j] !== "stop") {
					d = (actions[i][j] - last) * canvas.height * 2
					context.lineTo(actions[i][2] / duration * canvas.width, middle - d)
				}
			}
			last = actions[i][j]
		}
		context.stroke()
	}
}

MemeCreator.prototype.updatePlayhead = function (position) {
	
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
}

MemeCreator.prototype.setupPanels = function () {
	var topPanels = document.getElementById("top-panels")
	var topBottomSeparator = document.getElementById("top-bottom-separator")

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