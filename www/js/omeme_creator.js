//in June 2020 I revived this beast which was written well before ES6

function MemeCreator(params) {	
	this.url = "/apps/meme/" //todo make this smarter?
	this.setupTabs();

	this.playSeekControls = document.getElementById("play-seek-controls")
	this.player = new OMemePlayer({div: params.playerDiv, controlsDiv: this.playSeekControls});

	this.loadParameters();

	this.layersDiv = document.getElementById("layer-list")
	this.playhead = document.getElementById("playhead")
	this.player.onupdateposition = (position) => this.updatePlayhead(position)

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
			this.movie.scene.mode = tab.mode;
			
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
			omg.server.post(this.player.getJSON(), result => {
				console.log(result)
			});
		}
	}
	tab.shown = true;
};

MemeCreator.prototype.showDoodleTab = function (tab) {
	if (tab.shown)
		return;

	var movie = this.movie
	movie.scene.doodles.currentWidth = 6;
	
	for (var ic = 0; ic < movie.colors.length; ic++) {
		tab.pageDiv.appendChild(this.makeDoodleColorBox(ic));
	}
	
	pp = document.createElement("span");
	pp.innerHTML = "<br/>Line Width:";
	tab.pageDiv.appendChild(pp);
	
	var select, option;
	select = document.createElement("select");
	for (ic = 1; ic < 21; ic++) {
		option = document.createElement("option");
		option.value = ic;
		option.innerHTML = ic;
		
		if (ic == movie.scene.doodles.currentWidth) {
			option.selected = true;
		}
		select.add(option);
	}
	select.onchange = function () {
		movie.scene.doodles.currentWidth = parseInt(select.value); 
	};
	tab.pageDiv.appendChild(select);

};

MemeCreator.prototype.makeDoodleColorBox = function (i) {
	var movie = this.movie
	var colorBox = document.createElement("div");
	colorBox.className = "doodle-color-box";
	colorBox.style.backgroundColor = movie.colors[i];
	colorBox.onclick = function () {
		var offs = 5;
		if (movie.scene.doodles.currentColorBox){ 
			var oldColor = movie.scene.doodles.currentColorBox;
			oldColor.className = "doodle-color-box";
			oldColor.style.zIndex = 0;
		}
		var newColor = colorBox;

		newColor.className = "selected-doodle-color-box";
		newColor.style.zIndex = 1;
		movie.scene.doodles.currentColor = i;
		movie.scene.doodles.currentColorBox = newColor;
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
	var mc = this;
	
	var newRow = document.createElement("img"); //omg.newDiv();
	newRow.className = "background-thumbnail";
	
	newRow.src = detail.url //detail.thumbnail;
	
	var cp = this;
	newRow.onclick = function () {
		mc.addBackdrop(detail.url);
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


MemeCreator.prototype.showAddBackgroundDialog = function (pageDiv) {
	if (pageDiv.shown)
		return;
	pageDiv.shown = true;
	
	var mc = this;
	
	var imgInput = pageDiv.getElementsByClassName("picture-url")[0];
	var nextButton = pageDiv.getElementsByClassName("picture-url-next")[0];
	nextButton.onclick = function () {
		mc.addBackdrop(imgInput.value);
		
		if (pageDiv.finishCallback) {
			pageDiv.finishCallback();
		}
	};
	
	this.errorLoadingBackgroundDiv = pageDiv.getElementsByClassName("error-loading")[0];

	imgInput.onkeypress = function (key) {
		if (key.key == "Enter") {
			nextButton.onclick();
		}
		else {
			mc.errorLoadingBackgroundDiv.style.display = "none";
		}
	};

	var uploadLog = pageDiv.getElementsByClassName("upload-log")[0];
	var updateUploadLog = function (newLine) {
		uploadLog.innerHTML = newLine;
	};
	
	var uploadButton = pageDiv.getElementsByClassName("background-upload-next")[0]; 
	var dataForm = document.getElementById("background-upload-form");

	var uploadBackground = {button: uploadButton, 
							form: dataForm, 
							log: uploadLog, 
							logCallback: updateUploadLog,
							okCallback: function (response) {
								mc.addBackdrop("/upload?blob-key=" + response.blobKey);
								if (pageDiv.finishCallback) {
									pageDiv.finishCallback();
								}
							}};
	
	//omg.util.setupUploadButton(uploadBackground)

	
};



MemeCreator.prototype.addBackdrop = function (src) {
	
	var mc = this;
	var errorCallback = function () {
		mc.errorLoadingBackgroundDiv.style.display = "inline-block";
	};
	
	var submitInput = document.getElementById("submit-picture-input");
	submitInput.value = src;
 
	this.player.addBackdrop(src, false, errorCallback);

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
		var layer = this.addLayer({type: "CHARACTER", thing, character})
		this.makeCharacterButton(character, layer);			
	};
	
	this.player.addCharacterFromFile(thing, loadCallback, errorCallback);
};

MemeCreator.prototype.makeCharacterButton = function (character, layer){
	
	var newCanvas = document.createElement("canvas");	
	newCanvas.height = 40;
	newCanvas.width = 40;
	
	var draw = () => {
		this.player.drawCharacter(character, 
			newCanvas.width / 2, newCanvas.height - 20, newCanvas.getContext("2d"));
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
	
	var addButton = tab.pageDiv.getElementsByClassName("add-button")[0];
	addButton.onclick = function () {
		
		var addSoundDialog = document.getElementById("add-sound-page");
		var params = {};
		params.dialog = addSoundDialog;
		mc.showAddSoundDialog(addSoundDialog, tab);
		mc.showDialog(params);
	};
	
	var createButton = tab.pageDiv.getElementsByClassName("create-music-button")[0];
	createButton.onclick = function () {
		mc.showOMGBam({command: "new",
			type : "SECTION"});
	};	
	
	var searchButton = tab.pageDiv.getElementsByClassName("search-omg")[0];
	searchButton.onclick = function () {
		
		var dialog = document.getElementById("search-omg-dialog");
		var params = {};
		params.dialog = dialog;
		
		var omgSearch = new OMGSearch(dialog, 
				["AUDIO","SONG","SECTION","MELODY","DRUMBEAT","BASSLINE"], function (result) {
			
			var sound;
			if (result.type == "AUDIO") {
				sound = addSoundFile(JSON.parse(result.json).url);
			}
			else {
				var omgsong = oMemePlayer.player.makeOMGSong(JSON.parse(result.json));
				sound = addOpenMusicSong(omgsong);
			} 
			mc.makeSoundButton(sound);					
			
			if (dialog.finishCallback) {
				dialog.finishCallback();
			}
		});
		
		mc.showDialog(params);
	};

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

	if (!this.dialogList) {
		
		this.dialogInput = document.getElementById("dialog-text")
		this.dialogList = tab.pageDiv.getElementsByClassName("dialog-list")[0];
		
	}

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

MemeCreator.prototype.addDialog = function (dialog) {
	
	var layer = this.addLayer({type: "DIALOG", dialog})
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

	dialog.refreshLayer = () => this.drawActions(dialog.data, layer.detailCanvas)
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
};

MemeCreator.prototype.loadId = function (id) {
	omg.server.getId(id, (response) => {
		this.player.load(response);
		this.movie = this.player.movie

		this.tabs[0].div.onclick()
		this.setupCanvasEvents()
		this.setupLayers()
	});
};

MemeCreator.prototype.setupLayers = function () {
	//todo refactor so there is a layer array with all types, instead of different types
	var character;
	for (var ic = 0; ic < this.movie.character.list.length; ic++) {
		character = this.movie.character.list[ic];
		var layer = this.addLayer({type: "CHARACTER", character})
		this.makeCharacterButton(character, layer);
	}
	var dialogList = this.movie.scene.dialog.list;
	for (var idlg = 0; idlg < dialogList.length; idlg++) {
		this.addDialog(dialogList[idlg]);
	}
}

function MemeCanvasEventHandler(memeCreator) {
	this.memeCreator = memeCreator;

	var player = memeCreator.player
	var tool = this;
	this.started = false;
	this.drawnSegments = 0;
	this.looperCounter = 0;

	var movie = memeCreator.movie

	this.touchstart = function (ev) {
		ev.preventDefault();
		tool.setOffsets();
		x = ev.targetTouches[0].pageX - movie.scene.canvasOffsetLeft;
		y = ev.targetTouches[0].pageY - movie.scene.canvasOffsetTop;
		tool.start(x, y);
	}
	this.touchmove = function (ev) {
		ev.preventDefault(); 
		x = ev.targetTouches[0].pageX - movie.scene.canvasOffsetLeft;
		y = ev.targetTouches[0].pageY - movie.scene.canvasOffsetTop;
		tool.move(x, y);
	}
	this.touchend = function (ev) {
		ev.preventDefault(); 
		tool.end();
	}

	this.setOffsets = function(){
		movie.scene.canvasOffsetLeft = movie.scene.canvas.offsetLeft +  
				movie.scene.canvas.parentElement.offsetLeft; 
				//movie.scene.canvas.parentElement.parentElement.offsetLeft;
		movie.scene.canvasOffsetTop = movie.scene.canvas.offsetTop +  
				movie.scene.canvas.parentElement.offsetTop; 
				//movie.scene.canvas.parentElement.parentElement.offsetTop;
	}

	this.mousedown = function (ev) {
		tool.setOffsets();
		x = ev.pageX - movie.scene.canvasOffsetLeft;
		y = ev.pageY - movie.scene.canvasOffsetTop;
		tool.start(x, y);
	}
	this.start = function(x, y){
		tool.started = true;
		var char = player.currentCharacter()
		if (movie.scene.mode == "CHARACTER"){
			if (!char){
				tool.started = false;
				return;
			}
			if (char.actions && char.actions.length > 0){
				tool.offX = x - char.actions[char.i][0];
				tool.offY = y - char.actions[char.i][1];
			}
			else {
				tool.offX = 0;
				tool.offY = 0;
			}
			movie.character.drawSelection = false;
			movie.character.x = -1;
			movie.character.y = -1;

			var time = movie.scene.position;
			movie.recordPastPlay = true;
			if (movie.scene.paused){
				player.resume();
			}
			char.recordingStarted = time;
			var actions = movie.character.current.actions;
			if (!actions){
				actions =[];
				character.current.actions = actions;
			}

			tool.loopCounter = Date.now() - time;

			var cuts = (char.i < actions.length && 
				actions[char.i][2] < time) ? 1 : 0;
			actions.splice(char.i, cuts, [x - tool.offX, y - tool.offY, time]);

		}
		else if (movie.scene.mode == "DIALOG"){

			movie.scene.dialog.x = -1;
			movie.scene.dialog.y = -1;

			var time = movie.scene.position;
			movie.recordPastPlay = true;
			if (movie.scene.paused){
				memeCreator.player.resume();
			}
			tool.loopCounter = Date.now() - time;
			var text = memeCreator.dialogInput.value;
			tool.dialog = {"text": text, data: [[x, y, time]], i: 0};
			movie.scene.dialog.list[movie.scene.dialog.list.length] = tool.dialog;
			movie.scene.dialog.list.sort(function(a,b){return a.data[0][2] - b.data[0][2]});
			
			tool.memeCreator.addDialog(tool.dialog);
		}
		else if (movie.scene.mode == "DOODLE"){
			tool.doodleStartTouch(x, y, tool);
		}
		else if (movie.scene.mode == "SOUNDTRACK"){
			tool.soundtrackStartTouch(x, y, tool);
		}
		else if (movie.scene.mode == "VIDEO"){
			tool.videoStartTouch(x, y, tool);
		}
	};

	this.mousemove = ev => {
		tool.setOffsets();
		x = ev.pageX - movie.scene.canvasOffsetLeft;
		y = ev.pageY - movie.scene.canvasOffsetTop;
		tool.move(x, y);
		if (!tool.started) {
			if (movie.scene.mode == "CHARACTER" && player.currentCharacter()){
				if (!player.currentCharacter().actions || player.currentCharacter().actions.length == 0){
					movie.character.x = x;
					movie.character.y = y;
				}
				else {
					movie.character.drawSelection = true;
				}
			}
			if (movie.scene.mode == "DIALOG") {
				movie.scene.dialog.x = x;
				movie.scene.dialog.y = y;
				movie.scene.dialog.text = memeCreator.dialogInput.value || "Put Text Here";
			}
		} 
	}
	this.mouseout = function (ev) {
		if (movie.scene.mode == "CHARACTER"){
			x = ev.pageX - movie.scene.canvasOffsetLeft;
			y = ev.pageY - movie.scene.canvasOffsetTop;
			tool.move(x, y);
			movie.character.x = -1;
			movie.character.y = -1;
			movie.character.drawSelection = false;
		}
		movie.scene.dialog.x = -1;
		movie.scene.dialog.y = -1;

	};

	this.move = function(x, y){
		if (tool.started) {
			if (movie.scene.mode == "CHARACTER"){
				var char = player.currentCharacter()
				var actions = movie.character.current.actions;
				var time = Date.now() - tool.loopCounter;
				var cuts = (char.i+1 < actions.length && 
					actions[char.i+1][2] < time) ? 1 : 0;
				actions.splice(char.i+1, cuts, [x - tool.offX, y - tool.offY, time]);			
				char.i++;
			}
			else if (movie.scene.mode == "DIALOG"){
				tool.dialog.data[tool.dialog.data.length] = [x, y, Date.now() - tool.loopCounter];
			}
			else if (movie.scene.mode == "DOODLE"){
				tool.doodleTouchMove(x, y, tool);
			}
			else if (movie.scene.mode == "SOUNDTRACK"){
				tool.soundtrackTouchMove(x, y, tool);
			}
			else if (movie.scene.mode == "VIDEO"){
				tool.videoTouchMove(x, y, tool);
			}
		}
	};

	this.mouseup = function (ev) {
		ev.preventDefault(); 
		tool.end();
	}

	this.end = function (){
		if (tool.started) {
			tool.started = false;
			if (movie.scene.mode == "CHARACTER"){
				tool.drawnSegments++;

				var char = movie.character.current;
				char.i = 0;
				char.recordingStarted = 0;
				movie.recordPastPlay = false;

				setTimeout(function(){
					if (movie.scene.paused){
						player.playButton();
					}
				}, 20);

				tool.drawnPaths++;

				char.refreshLayer()
			}
			else if (movie.scene.mode === "DIALOG"){
				tool.dialog.data[tool.dialog.data.length] = [-1, -1, Date.now() - tool.loopCounter];
				movie.recordPastPlay = false;
				setTimeout(function(){
					if (movie.scene.paused && movie.replayAfterRecord){
						playButton();
					}
				}, 20);
			}
			else if (movie.scene.mode === "DOODLE"){
				tool.doodleTouchEnd(tool);
			}
			else if (movie.scene.mode === "SOUNDTRACK"){
				tool.soundtrackTouchEnd(tool);
			}
			else if (movie.scene.mode === "VIDEO"){
				tool.videoTouchEnd(tool);
			}
		}
	};
}

MemeCanvasEventHandler.prototype.soundtrackStartTouch = function (x, y, tool) {
	var time = movie.scene.position;
	var strack = movie.scene.soundtrack;
	movie.recordPastPlay = true;
	if (movie.scene.paused){
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
		var wasFresh = movie.scene.soundtrack.fresh; 
		if (movie.scene.soundtrack.fresh){
			tool.channel = {instrument: movie.scene.soundtrack.currentColor, data: [], i: 0};
			movie.scene.soundtrack.channels[movie.scene.soundtrack.channels.length] = tool.channel;
			movie.scene.soundtrack.fresh = false;
			if (movie.audio){
				var chan = makeChannel(movie.scene.soundtrack.currentColor);
				movie.audio.channels[movie.audio.channels.length] = chan;
				tool.audioChan = chan;
			}
		}
		else {
			if (movie.audio){
				tool.audioChan.gain.gain.value = tool.audioChan.defaultGain;
				tool.audioChan.recording = true;
			}
		}
		if (movie.audio){
			var freq = makeFreq(y) ;
			var panX = makePan(x);
			tool.audioChan.osc.frequency.value = freq;
			tool.audioChan.panner.setPosition(panX, 0, 0);
			tool.audioChan.data[tool.audioChan.data.length] = {"freq": freq, "pan":panX, "time":time};		
		}
		tool.channel.data[tool.channel.data.length] = [x, y, time];
		if (wasFresh){
			movie.scene.soundtrack.channels.sort(function(a,b){return a.data[0][2] - b.data[0][2]});
			if (movie.audio){
				movie.audio.channels.sort(function(a,b){return a.data[0].time - b.data[0].time});
			}
		}
	}
	tool.t = Date.now();
};
MemeCanvasEventHandler.prototype.soundtrackTouchMove = function (x, y, tool){
	if (movie.scene.soundtrack.currentSound > -1){
	}
	else {
		if (movie.audio){
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
	var strack = movie.scene.soundtrack;
	if (strack.currentSound > -1){
		var clickTime = Date.now() - tool.t;
		var sdata = strack.sounds[strack.currentSound].data;
		if (clickTime < 125){
			var mediaLength = strack.soundAudios[strack.currentSound].duration * 1000;
			movie.scene.length = Math.max(movie.scene.length, 
					movie.scene.position + mediaLength);
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
		if (movie.audio){
			tool.audioChan.gain.gain.value = 0;
			tool.audioChan.data[tool.audioChan.data.length] = {"freq": -1, "pan": -1};
			tool.audioChan.recording = false;
		}
		tool.channel.data[tool.channel.data.length] = [-1, -1, Date.now() - tool.loopCounter];
	}
	movie.recordPastPlay = false;
	setTimeout(function(){
		if (movie.scene.paused){
			playButton();
		}
		else {
			//TODO may have to add this to playList
		}
	}, 20);
};

MemeCanvasEventHandler.prototype.doodleStartTouch = function (x, y, tool) {
	var movie = this.memeCreator.movie
	var tool = this
	var time = movie.scene.position;
	var doodles = movie.scene.doodles;
	movie.recordPastPlay = true;
	if (movie.scene.paused){
		this.memeCreator.player.resume();
	}
	tool.loopCounter = Date.now() - time;

	tool.doodle = {color: doodles.currentColor, 
			width: doodles.currentWidth,
			data: [], i: 0};
	doodles.list.push(tool.doodle);

	tool.doodle.data.push(x, y, time);	

	tool.t = Date.now();

	this.memeCreator.makeDoodleLayer(tool.doodle)
};
MemeCanvasEventHandler.prototype.doodleTouchMove = function (x, y, tool){
	this.doodle.data.push([x, y, Date.now() - this.loopCounter]);
};
MemeCanvasEventHandler.prototype.doodleTouchEnd = function (tool){

	this.doodle.refreshLayer()
	var movie = this.memeCreator.movie
	movie.recordPastPlay = false;
	setTimeout(() => {
		if (movie.scene.paused){
			
			//playButton();
		}
		else {
			//TODO may have to add this to playList
			// not sure what that comment means
		}
	}, 20);
};


MemeCanvasEventHandler.prototype.videoStartTouch = function (x, y, tool){

	var time = movie.scene.position;
	var vid = movie.scene.video;
	movie.recordPastPlay = true;
	if (movie.scene.paused){
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
	var vid = movie.scene.video;
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
	var vid = movie.scene.video;
	if (vid.current > -1){
		var clickTime = Date.now() - tool.t;
		var vData = vid.list[vid.current].data;
		if (clickTime < 125){
			movie.scene.length = Math.max(movie.scene.length, 
					movie.scene.position + (vid.elements[vid.current].duration * 1000));
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
	movie.recordPastPlay = false;
	setTimeout(function(){
		if (movie.scene.paused){
			playButton();
		}
		else {
			//TODO may have to add this to play list
		}
	}, 20);
};


MemeCreator.prototype.setupCanvasEvents = function () {
	var tool = new MemeCanvasEventHandler(this);
	var canvas = this.player.sceneCanvas
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


MemeCreator.prototype.addLayer = function (layer) {
	
	var div = document.createElement('div')
	div.className = "meme-layer-controls"
	
	this.layersDiv.appendChild(div)

	var header = document.createElement("div")
	header.className = "meme-layer-header"

	var detail = document.createElement("div")
	detail.className = "meme-layer-detail"

	div.appendChild(header)
	div.appendChild(detail)

	// I am the shore patrol!
	this.lastDetail = detail

	header.onclick = () => {
		if (this.lastSelectedLayer) {
			this.lastSelectedLayer.classList.remove("meme-layer-controls-selected")
		}

		if (layer.type === "CHARACTER") {
			console.log(layer)
			this.movie.character.current = layer.character;
			
		}
		this.movie.scene.mode = layer.type

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
	var duration = this.movie.scene.length

	//document.createElement("canvas").getContext("2d").
	
	context.lineWidth = 2
	var last, d
	for (var j = 0; j < 2; j++) {
		context.strokeStyle = j ? "red" : "blue"
		for (var i = 0; i < actions.length; i++) {
			if (i === 0) {
				context.beginPath()
				console.log(actions[i][2] / duration)
				context.moveTo(actions[i][2] / duration * canvas.width, middle)
			}
			else {
				if (actions[i][j] > -1) {
					d = actions[i][j] - last
					context.lineTo(actions[i][2] / duration * canvas.width, middle - d)
				}
			}
			last = actions[i][j]
		}
		context.stroke()
	}
}

MemeCreator.prototype.updatePlayhead = function (position) {
	if (!this.lastDetail) {
		// we use the detail of the last layer added
		// there should be a way that works when there are no layers
		return
	}
	this.playhead.style.left = 
		72 + this.lastDetail.clientWidth * Math.max(0, Math.min(1, position / this.movie.scene.length)) + "px"
}

MemeCreator.prototype.makeDoodleLayer = function (doodle) {
	var layer = this.addLayer({type: "DOODLE", doodle})
	var headerCanvas = document.createElement("canvas")
	headerCanvas.width = 40
	headerCanvas.height = 40
	headerCanvas.style.width = "40px"
	headerCanvas.style.height = "40px"
	layer.header.appendChild(headerCanvas)

	var ctx = headerCanvas.getContext("2d")
	ctx.fillStyle = "black"
	ctx.fillRect(0, 0, headerCanvas.width, headerCanvas.height)
	
	ctx.strokeStyle = this.movie.colors[doodle.color]
	ctx.lineWidth = doodle.width
	ctx.beginPath()
	ctx.moveTo(0, headerCanvas.height / 2)
	ctx.lineTo(headerCanvas.width, headerCanvas.height / 2)
	ctx.stroke()
	
	var detailCanvas = document.createElement("canvas")
	detailCanvas.className = "meme-layer-detail-canvas"
	layer.detail.appendChild(detailCanvas)

	console.log(doodle)
	doodle.refreshLayer = () => this.drawActions(doodle.data, detailCanvas)
}

MemeCreator.prototype.setupPanels = function () {
	var topPanels = document.getElementById("top-panels")
	var topBottomSeparator = document.getElementById("top-bottom-separator")

	var isTouchingTopBottom = false
	topBottomSeparator.onmousedown = e => {
		e.preventDefault()
		isTouchingTopBottom = e.clientY
		
		var fullscreenWindow = document.getElementById("fullscreen-window-background");
		fullscreenWindow.style.display = "block";
		fullscreenWindow.style.cursor = "ns-resize"

		fullscreenWindow.onmousemove = e => {
			e.preventDefault()
			if (isTouchingTopBottom) {
				topBottomChange(e.clientY)
			}
		}

		fullscreenWindow.onmouseup = e => {
			e.preventDefault()
			isTouchingTopBottom = false
			fullscreenWindow.style.display = "none";
			fullscreenWindow.style.cursor = "default"
		}
	}

	var topBottomChange = y => {
		console.log(y)
		topPanels.style.height = isTouchingTopBottom - (isTouchingTopBottom - y) + "px"
	}
}