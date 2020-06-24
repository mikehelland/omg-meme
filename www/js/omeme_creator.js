//in June 2020 I revived this beast which was written well before ES6

function MemeCreator(params) {	
	this.setupTabs();
	
	this.player = new OMemePlayer({div: params.playerDiv});

	this.loadParameters();

	
}

MemeCreator.prototype.setupTabs = function () {
	var mc = this;
	var tabs = [
	            {mode: "BACKGROUND"},
			    {mode: "CHARACTERS"},
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
	if (tab.mode == "CHARACTERS") {
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

	var mc = this;
	
	var addButton = tab.pageDiv.getElementsByClassName("add-button")[0];
	addButton.onclick = function () {
		
		var addBackgroundDialog = document.getElementById("add-background-page");
		var params = {};
		params.dialog = addBackgroundDialog;
		mc.showAddBackgroundDialog(addBackgroundDialog);
		mc.showDialog(params);
	};

	var searchButton = tab.pageDiv.getElementsByClassName("search-omg")[0];
	searchButton.onclick = function () {

		var dialog = document.getElementById("search-omg-dialog");
		var params = {};
		params.dialog = dialog;
		var omgSearch = new OMGSearch(dialog, "IMAGE", function (result) {
			mc.addBackdrop(result.picture);
			
			if (dialog.finishCallback) {
				dialog.finishCallback();
			}
		});
		
		mc.showDialog(params);
	};

	
	var userList = tab.pageDiv.getElementsByClassName("row-list")[0];
	
	omg.server.getHTTP("/data/?type=IMAGE", function (results) {
		var details = results;
		for (var idtl = 0; idtl < details.length; idtl++) {
			var newRow = mc.loadBackgroundRow(details[idtl])
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
	var mc = this;
	
	var newRow = document.createElement("img"); //omg.newDiv();
	newRow.className = "background-thumbnail";
	
	newRow.src = detail.url //detail.thumbnail;
	
	var cp = this;
	newRow.onclick = function () {
		mc.addCharacterFromFile(detail.url);

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
	
	omg.util.setupUploadButton(uploadBackground)

	
};


MemeCreator.prototype.showAddCharacterDialog = function (pageDiv) {
	if (pageDiv.shown)
		return;
	pageDiv.shown = true;
	
	var mc = this;
	
	var imgInput = pageDiv.getElementsByClassName("picture-url")[0];
	var nextButton = pageDiv.getElementsByClassName("picture-url-next")[0];
	nextButton.onclick = function () {
		mc.addCharacterFromFile(imgInput.value);
		
		if (pageDiv.finishCallback) {
			pageDiv.finishCallback();
		}
	};
	
	this.errorLoadingCharacterDiv = pageDiv.getElementsByClassName("error-loading")[0];

	imgInput.onkeypress = function (key) {
		if (key.key == "Enter") {
			nextButton.onclick();
		}
		else {
			mc.errorLoadingCharacterDiv.style.display = "none";
		}
	};

	var uploadLog = pageDiv.getElementsByClassName("upload-log")[0];
	var updateUploadLog = function (newLine) {
		uploadLog.innerHTML = newLine;
	};
	
	var uploadButton = pageDiv.getElementsByClassName("upload-next")[0]; 
	var dataForm = pageDiv.getElementsByClassName("upload-form")[0];

	var uploadParams = {button: uploadButton, 
							form: dataForm, 
							log: uploadLog, 
							logCallback: updateUploadLog,
							okCallback: function (response) {
								mc.addCharacterFromFile("/upload?blob-key=" + response.blobKey);
								if (pageDiv.finishCallback) {
									pageDiv.finishCallback();
								}
							}};
	
	omg.util.setupUploadButton(uploadParams)

	
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
	
	var mc = this;	
	
	var addButton = tab.pageDiv.getElementsByClassName("add-button")[0];
	addButton.onclick = function () {
		
		var addDialog = document.getElementById("add-character-page");
		var params = {};
		params.dialog = addDialog;
		mc.showAddCharacterDialog(addDialog);
		mc.showDialog(params);
	};

	var searchButton = tab.pageDiv.getElementsByClassName("search-omg")[0];
	searchButton.onclick = function () {
		
		var dialog = document.getElementById("search-omg-dialog");
		var params = {};
		params.dialog = dialog;
		
		var omgSearch = new OMGSearch(dialog, "SPRITE", function (result) {
			mc.addCharacterFromFile(result.picture); //TODO result.data.url maybe?
			
			if (dialog.finishCallback) {
				dialog.finishCallback();
			}
		});
		
		mc.showDialog(params);
	};


	this.characterList = document.getElementById("character-list");
	this.emptyCharacterList = tab.pageDiv.getElementsByClassName("empty-character-list")[0];
	this.characterList.errorLoadingDiv = tab.pageDiv.getElementsByClassName("error-loading")[0];

	var character;
	for (var ic = 0; ic < this.movie.character.list.length; ic++) {
		character = this.movie.character.list[ic];
		mc.makeCharacterButton(character);
	}
	
	var userList = tab.pageDiv.getElementsByClassName("recent-character-list")[0];

	omg.server.getHTTP("/data/?type=IMAGE", function (results) {
		var details = results;
		for (var idtl = 0; idtl < details.length; idtl++) {
			var newRow = mc.loadCharacterRow(details[idtl], tab.pageDiv.finishCallback)
			userList.appendChild(newRow);
		}
	});
};

MemeCreator.prototype.addCharacterFromFile = function (filename) {
	var mc = this;
	
	var errorCallback = function () {
		mc.characterList.errorLoadingDiv.style.display = "inline-block";
	};
	var loadCallback = function (character) {
		mc.makeCharacterButton(character);			
	};
	
	console.log(filename)
	this.player.addCharacterFromFile(filename, loadCallback, errorCallback);
};

MemeCreator.prototype.makeCharacterButton = function (character){
	
	var mc = this;
	
	var newCanvas = document.createElement("canvas");

	newCanvas.onclick = function () {
		recallCharacter(character);
		mc.selectListButton(mc.characterList.children, newCanvas, "character-button");
		
	};	
	
	newCanvas.height = 80;
	newCanvas.width = 60;
	
	this.emptyCharacterList.style.display = "none";
	
	this.characterList.appendChild(newCanvas);
	mc.selectListButton(mc.characterList.children, newCanvas, "character-button");
	
	this.player.drawCharacter(character, 
		newCanvas.width / 2, newCanvas.height - 20, newCanvas.getContext("2d"));			

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
		
		var dialogList = this.movie.scene.dialog.list;
		for (var idlg = 0; idlg < dialogList.length; idlg++) {
			this.addDialog(dialogList[idlg]);
		}
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
	
	var newDialogInput = document.createElement("input");
	newDialogInput.className = "dialog-edit-box";
	newDialogInput.value = dialog.text;
	this.dialogList.appendChild(newDialogInput);
	
	newDialogInput.onkeyup = function () {
		dialog.text = newDialogInput.value;
	};
};

MemeCreator.prototype.loadParameters = function () {
	var params = document.location.search;
	var nvp;

	if (params.length > 1) {
		params = params.slice(1).split("&");
		for (var ip = 0; ip < params.length; ip++) {
			nvp = params[ip].split("=");
			
			if (nvp[0] == "id") {
				this.loadId(nvp[1]);
			}
		}
	}

};

MemeCreator.prototype.loadId = function (id) {
	omg.server.getId(id, (response) => {
		this.player.load(response);
		this.movie = this.player.movie

		this.tabs[0].div.onclick()
		this.setupCanvasEvents()
	});
};

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
		if (movie.scene.mode == "CHARACTERS"){
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
			var actions = movie.character.list[movie.character.current].actions;
			if (!actions){
				actions =[];
				movie.character.list[movie.character.current].actions = actions;
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
			if (movie.scene.mode == "CHARACTERS" && player.currentCharacter()){
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
		if (movie.scene.mode == "CHARACTERS"){
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
			if (movie.scene.mode == "CHARACTERS"){
				var char = player.currentCharacter()
				var actions = movie.character.list[movie.character.current].actions;
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
			if (movie.scene.mode == "CHARACTERS"){
				tool.drawnSegments++;

				var char = movie.character.list[movie.character.current];
				char.i = 0;
				char.recordingStarted = 0;
				movie.recordPastPlay = false;

				setTimeout(function(){
					if (movie.scene.paused){
						player.playButton();
					}
				}, 20);

				tool.drawnPaths++;
			}
			else if (movie.scene.mode == "DIALOG"){
				tool.dialog.data[tool.dialog.data.length] = [-1, -1, Date.now() - tool.loopCounter];
				movie.recordPastPlay = false;
				setTimeout(function(){
					if (movie.scene.paused && movie.replayAfterRecord){
						playButton();
					}
				}, 20);
			}
			else if (movie.scene.mode == "DOODLE"){
				tool.doodleTouchEnd(tool);
			}
			else if (movie.scene.mode == "SOUNDTRACK"){
				tool.soundtrackTouchEnd(tool);
			}
			else if (movie.scene.mode == "VIDEO"){
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
};
MemeCanvasEventHandler.prototype.doodleTouchMove = function (x, y, tool){
	this.doodle.data.push([x, y, Date.now() - this.loopCounter]);
};
MemeCanvasEventHandler.prototype.doodleTouchEnd = function (tool){

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