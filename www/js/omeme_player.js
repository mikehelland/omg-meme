"usestrict";

function OMemePlayer(config) {

	if (!config || !config.div) {
		console.warn("MemePlayer: no config.div?")
		return
	}

	this.paused = true

	var div = config.div;
	this.characters = new Map()
	
	//todo 2020port this.player = new OMusicPlayer();
	
	var sceneCanvas = document.createElement("canvas")
	var controlsCanvas = document.createElement("canvas");
	this.canvas = sceneCanvas
	this.controlsCanvas = controlsCanvas;
	
	div.appendChild(sceneCanvas);

	if (config.controlsDiv) {
		config.controlsDiv.appendChild(controlsCanvas);
	}
	else {
		div.appendChild(controlsCanvas);
	}

	this.playButtonWidth = config.playButtonWidth || 40

	var width, height;
	width = 480;
	height = 320;
	
	//sceneCanvas.style.width = "100%" 
	sceneCanvas.style.width = width + "px";
	sceneCanvas.style.height = height + "px";
	sceneCanvas.width = sceneCanvas.clientWidth;
	sceneCanvas.height = height;
	
	controlsCanvas.style.width = "100%" 
	//controlsCanvas.style.width = width + "px";
	controlsCanvas.width = controlsCanvas.clientWidth;
	
	//sceneCanvas.style.position = "relative";
	//controlsCanvas.style.position = "relative";
	//controlsCanvas.style.left = "100px";
	//sceneCanvas.style.left = "100px";
	
	sceneCanvas.style.borderWidth = "1px";
	controlsCanvas.style.borderWidth = "1px";
	sceneCanvas.style.borderColor = "black";
	controlsCanvas.style.borderColor = "black";
	controlsCanvas.style.borderStyle = "solid";
	sceneCanvas.style.borderStyle = "solid";
	
	sceneCanvas.style.display = "block";
	controlsCanvas.style.display = "block";
	
	controlsCanvas.style.marginTop = "3px";
	controlsCanvas.style.height = "40px";	
	controlsCanvas.height = 40;
	controlsCanvas.style.backgroundColor = "#707070";

	this.controlsContext = controlsCanvas.getContext("2d");		
	this.context = sceneCanvas.getContext("2d");
	
	// the html5 movie maker app
	//TODO probably a significant center of refactoring
	// look for an id to download or get blank?
	//movie = this.getFreshScene(config);

	//todo port2020 movie.currentUser = userStuff();
	
	//	movie.scene.context.lineWidth = 6;
	this.context.shadowColor = "black";
	this.context.lineJoin = "round";

	if (controlsCanvas){
		this.setupControls();
	}
}

OMemePlayer.prototype.load = function(meme) {

	this.meme = meme

	if (!meme.layers) {
		meme.layers = []	
	}
	meme.layers.forEach(layer => {
		switch (layer.type) {
			case "CHARACTER":
				this.loadCharacter(layer.character);
				break;
		}
	})


	this.loadBackground()

	if (typeof meme.length !== "number") {
		meme.length = 1000
	}
	
	this.animate();	
	return


	movie.scene.soundtrack.sounds = [];
	if (mov.soundtrack.sounds){
		for (var ic = 0; ic < mov.soundtrack.sounds.length; ic++){
			if (mov.soundtrack.sounds[ic].type == "omgsong") {
				loadOpenMusicSong(mov.soundtrack.sounds[ic]);
			}
			else {
				addSoundFile(mov.soundtrack.sounds[ic]);	
			}
		}
	}
	movie.scene.soundtrack.channels = mov.soundtrack.channels;
	if (movie.audio){
		loadAudio();
	}

	movie.scene.dialog.list = mov.dialog.list;
	for (var ic = 0; ic < mov.characters.length; ic++){
		this.addCharacter(mov.characters[ic]);
	}
	if (!document.getElementById("scene-script")){
		var ta = document.createElement("textarea");
		ta.id = "scene-script";
		ta.style.display = "none";
		document.body.appendChild(ta);
	}
	document.getElementById("scene-script").value = mov.scene;
	if (mov.backdrop){
		this.addBackdrop(mov.backdrop);
	}
	if (mov.video){
		for (var ic = 0; ic < mov.video.list.length; ic++){
			addVideoFile(mov.video.list[ic]);
		}
	}
	
	if (mov.doodles) {
		movie.scene.doodles.list = mov.doodles.list;
	}

}


OMemePlayer.prototype.setupControls = function () {
	
	var setOffsets = () => {
		var offsets = omg.ui.totalOffsets(this.controlsCanvas);
		this.controlsOffsetLeft = offsets.left;
		this.canvasOffseTop = offsets.top;
	}

	var controlsCanvas = this.controlsCanvas
	controlsCanvas.addEventListener("mousedown", (ev) => {
		setOffsets();
		x = ev.pageX - this.controlsOffsetLeft;
		y = ev.pageY - this.controlsOffsetTop;
		this.onControlsDown(x, y);
	}, false);
	controlsCanvas.addEventListener("mousemove", (ev) => {
		x = ev.pageX - this.controlsOffsetLeft;
		y = ev.pageY - this.controlsOffsetTop;
		this.onControlsMove(x, y);
	}, false);
	controlsCanvas.addEventListener("mouseup",  (ev) => {
		ev.preventDefault(); 
		this.onControlsEnd();
	}, false);
	controlsCanvas.addEventListener("touchstart", (ev) => {
		ev.preventDefault();
		setOffsets();
		x = ev.targetTouches[0].pageX - this.controlsOffsetLeft;
		y = ev.targetTouches[0].pageY - this.controlsOffsetTop;
		this.onControlsDown(x, y);
	}, false);
	controlsCanvas.addEventListener("touchmove", (ev) => {
		ev.preventDefault(); 
		x = ev.targetTouches[0].pageX - this.controlsOffsetLeft;
		y = ev.targetTouches[0].pageY - this.controlsOffsetTop;
		this.onControlsMove(x, y);
	}, false);
	controlsCanvas.addEventListener("touchend",  (ev) => {
		ev.preventDefault(); 
		this.onControlsEnd();
	}, false);
}

OMemePlayer.prototype.onControlsDown = function(x, y){
		
	if (x < this.playButtonWidth){
		this.controlsStarted = 1;
	}
	else {
		this.controlsStarted = 2;
		this.wasPaused = this.paused;
		this.paused = true;

		var newPosition = x - this.playButtonWidth;
		newPosition = newPosition / (this.controlsCanvas.clientWidth - (this.playButtonWidth * 2));
		newPosition = Math.round(newPosition * this.meme.length);
		this.started = Date.now() - newPosition;
		this.position = newPosition;
		this.updateIs = true;
		
		if (this.onupdateposition) this.onupdateposition(newPosition)
	}
};

OMemePlayer.prototype.onControlsMove = function(x, y){
	if (this.controlsStarted === 2){
		var newPosition = x - this.playButtonWidth;
		newPosition = newPosition / (this.controlsCanvas.clientWidth - (this.playButtonWidth * 2));
		newPosition = Math.round(newPosition * this.meme.length);
		this.started = Date.now() - newPosition;
		this.position = newPosition;
		this.updateIs = true;
		this.resetSoundtrack = true;

		if (this.onupdateposition) this.onupdateposition(newPosition)
	}
};

OMemePlayer.prototype.onControlsEnd = function (){
	if (this.controlsStarted === 1 && x < this.playButtonWidth) {
		this.playButton();
	}
	else if (this.controlsStarted === 2){
		this.resetSoundtrack = true;
		if (x < this.playButtonWidth){
			if (!this.wasPaused){
				this.paused = false;
			}
		}
		else {
			var newPosition = x - this.playButtonWidth;
			newPosition = newPosition / (this.controlsCanvas.clientWidth - (this.playButtonWidth * 2));
			newPosition = Math.round(newPosition * this.meme.length);
			this.started = Date.now() - newPosition;
			this.position = newPosition;
			this.updateIs = true;
			this.paused = this.wasPaused;

			if (this.onupdateposition) this.onupdateposition(newPosition)
		}
	}
	this.controlsStarted = 0;

};


OMemePlayer.prototype.play = function() {
	
	var meme = this.meme

	// reset the characters?
	/*
	for (var ia = 0; ia < this.characters.length; ia++){
		if (this.characters[ia].actions.length > 0){
			this.characters[ia].i = 0;
			this.characters[ia].spriteI = 0;
			this.characters[ia].currentSprite = 0;
			turnOnSprite(0);
			if (this.characters[ia].zoom){
				this.characters[ia].zoom = 1;
			}
		}
	}*/
	
	
	//reset the soundtrack
	/*
	for (var ia = 0; ia < movie.scene.soundtrack.channels.length; ia++){
		movie.scene.soundtrack.channels[ia].i = 0;
	}
	movie.scene.soundtrack.playList = [];
	movie.scene.soundtrack.playingSounds = [];
	for (var is = 0; is < movie.scene.soundtrack.sounds.length; is++){
		if (movie.scene.soundtrack.soundAudios[is].currentTime > 0){
			movie.scene.soundtrack.soundAudios[is].currentTime = 0;
		}
		for (var iis = 0; iis < movie.scene.soundtrack.sounds[is].data.length; iis++){
			var osound = {"sound": is, 
					"start": movie.scene.soundtrack.sounds[is].data[iis][0], 
					"stop": movie.scene.soundtrack.sounds[is].data[iis][1]};
			if (osound.stop == -1){
				osound.stop = osound.start + 
				      (movie.scene.soundtrack.soundAudios[is].duration * 1000);  
			}
			movie.scene.soundtrack.playList[movie.scene.soundtrack.playList.length] = osound; 
		}
	}
	movie.scene.soundtrack.playList.sort(function(a,b){return a.start - b.start});
	movie.scene.soundtrack.soundI = 0;
	*/

	//reset videos
	/*
	movie.scene.video.playList = [];
	movie.scene.video.playing = [];
	for (var is = 0; is < movie.scene.video.list.length; is++){
		movie.scene.video.elements[is].style.visibility = "hidden";		
		if (movie.scene.video.elements[is].currentTime > 0){
			movie.scene.video.elements[is].currentTime = 0;
		}
		for (var iis = 0; iis < movie.scene.video.list[is].data.length; iis++){
			movie.scene.video.playList[movie.scene.video.playList.length] = {"id": is,
				"i": iis, 
				"start": movie.scene.video.list[is].data[iis][0][2]
				};
		}
	}
	movie.scene.video.playList.sort(function(a,b){return a.start - b.start});
	movie.scene.video.i = 0;
	*/

	this.started =  Date.now() //+ movie.preroll;
	this.paused = false;
	
	this.hasPlayed = true;
}
OMemePlayer.prototype.resume = function() {
	this.started = Date.now() - this.position;
	this.paused = false;
	this.resetSoundtrack = true;
}
OMemePlayer.prototype.pause = function() {
	this.paused = true;
}

OMemePlayer.prototype.animate = function() {	
	
	this.drawBackground();
	
	var nowInLoop;
	if (this.paused){
		nowInLoop = this.position;
	}
	else {
		nowInLoop = Date.now() - this.started;
		this.position = nowInLoop;

		if (this.onupdateposition) this.onupdateposition(nowInLoop)
	}

	if (this.character && this.character.x > -1){
		this.drawCharacterWithSelection(this.currentCharacter(), 
			movie.character.x, movie.character.y, movie.scene.context);
	}

	if (this.dialog && this.dialog.x > -1){
		this.drawDialog(movie.scene.dialog.text, movie.scene.dialog.x, movie.scene.dialog.y);		
	}

	if (this.loading){
		this.drawLoading();
	}
	else if (nowInLoop < 0){
		this.drawCountIn(Math.abs(nowInLoop/1000));
	}
	else {	
		for (this._animate_i = 0; this._animate_i < this.meme.layers.length; this._animate_i++) {
			switch(this.meme.layers[i].type) {
				case "CHARACTER":
					this.animateCharacter(this.meme.layers[i], nowInLoop)
					break;
				case "DIALOG":
					this.animateDialog(this.meme.layers[i], nowInLoop)
					break;
				}
		}
		
		//??
		/*if (this.updateIs){
			for (var ic = 0; ic < this.characters.length; ic++){
				var char = this.characters[ic];
				char.i = 0;
				char.spriteI = 0;
				char.currentSprite = 0;
				if (char.sprites && ic == movie.character.current){
					turnOnSprite(0);
				}
			}
			this.dialog.showingList = [];
			this.dialog.i = 0;
			for (var ia = 0; ia < this.soundtrack.channels.length; ia++){
				this.soundtrack.channels[ia].i = 0;
			}
			this.soundtrack.soundI = 0;
			movie.updateIs = false;
		}*/
		
		//todo this.updateDoodles(nowInLoop);
		
		if (nowInLoop > this.meme.length){
			if (this.recordPastPlay){
				this.meme.length = this.position;
			}
			else {
				this.paused = true; 
				if (this.mode == "VIEW"){
					if (document.getElementById("after-show")){
						document.getElementById("after-show").style.visibility = "visible";
					}
				}
			}
		}
	
		//todo 2020 updateVideos(nowInLoop);
	}
	this.drawControls();

	if (false && oMemePlayer.player) {
		//todo 2020
		updateAudioChannels(nowInLoop);
	}
	
	requestAnimationFrame(() => {
		this.animate();
	});
}


OMemePlayer.prototype.animateCharacter = (char, nowInLoop) => {
	
	if (char.actions.length > 0){
		var pxdata = char.actions;
		while (char.sprites && char.spriteI < char.spriteChanges.length && 
			char.spriteChanges[char.spriteI][1] <= nowInLoop){
			var newSprite = char.spriteChanges[char.spriteI][0];
			if (newSprite == -2){
				char.zoom = char.spriteChanges[char.spriteI][2];
			}
			else {
				char.currentSprite = newSprite;
				if (ic == movie.character.current){
					turnOnSprite(char.currentSprite);
				}
			}
			char.spriteI++;
		}
		if (!char.recordingStarted){
			while (char.i+1 < pxdata.length && pxdata[char.i+1][2] < nowInLoop){
				char.i++;
			}
		}
		if (movie.character.drawSelection && movie.character.current == ic
			&& this.mode == "CHARACTER"){
			this.drawSelection(char, 
				pxdata[char.i][0], pxdata[char.i][1], this.context);
		}
		this.drawCharacter(char, 
			pxdata[char.i][0], pxdata[char.i][1], this.context);
	}

}

OMemePlayer.prototype.animateDialog = (dialog, nowInLoop) => {

	if (!dialog.isShowing) {
		dialog.data[0][2] < nowInLoop
		dialog.i = 0
		dialog.isShowing = true

		if (dialog.speak && !this.paused){
			//todo hmmmm
			speak(dialogs.list[dialogs.i].text, { amplitude: 100, wordgap: 0, pitch: 50, speed: 175 })
		}
	}

	if (dialog.isShowing) {
		this.updateDialog(dialog);
	}
}

OMemePlayer.prototype.updateDialog = function(dlg) {
	if (dlg.i < dlg.data.length && dlg.data[dlg.i][0] > -1){
		
		var x = dlg.data[dlg.i][0]; 
		var y = dlg.data[dlg.i][1];
		
		this.drawDialog(dlg.text, x, y);
	}
}
OMemePlayer.prototype.drawDialog = function(text, x, y) {
	var movie = this.movie
	var context = this.context;
	context.fillStyle = "white";
	context.lineWidth = 1;
	context.strokeStyle = "black";
	context.font = "18pt Arial";
	var tw = context.measureText(text).width;
	var ty = y;
	x = Math.max(-10 + x - tw/2, 0);
	y = y - 35;

	var r = 5;
	var h = 50;
	var w = tw + 20;
	var xdiff = this.canvas.width - (x + w);
	if (xdiff < 0){
		x = x + xdiff;
	}

	context.beginPath();
	context.moveTo(x + r, y);
	context.arcTo(x+w, y, x+w, y+h, r);
	context.arcTo(x+w, y+h, x, y+h, r);
	context.arcTo(x, y+h, x, y, r);
	context.arcTo(x, y, x+w, y, r);
	context.shadowBlur = 10;
	context.shadowOffsetX = 10;
	context.shadowOffsetY = 10;
	context.closePath();
	context.fill();
	context.shadowOffsetX = 0;
	context.shadowOffsetY = 0;
	context.shadowBlur = 0;
	context.stroke();

	context.fillStyle = "black";
	context.fillText(text, x + 10, ty);
}
	
OMemePlayer.prototype.drawControls = function() {
	
	this.controlsContext.shadowBlur = 2;
	this.controlsContext.shadowColor = "black";

	this.controlsContext.clearRect(0, 0, this.controlsCanvas.width, this.controlsCanvas.height);	
	this.controlsContext.fillStyle = "white";
	this.controlsContext.fillRect(0, 0, this.playButtonWidth, this.controlsCanvas.height);
	this.controlsContext.fillStyle = "black";
	this.controlsContext.strokeStyle = "black";
	if (this.paused){
		this.controlsContext.beginPath();
		this.controlsContext.moveTo(this.playButtonWidth * 0.25, this.controlsCanvas.height * 0.25);
		this.controlsContext.lineTo(this.playButtonWidth * 0.25, this.controlsCanvas.height * 0.75);
		this.controlsContext.lineTo(this.playButtonWidth * 0.75, this.controlsCanvas.height * 0.5);
		this.controlsContext.closePath();
		this.controlsContext.fill();
	}	
	else {
		this.controlsContext.fillRect(this.playButtonWidth * 0.175, this.controlsCanvas.height * 0.25, 
							this.playButtonWidth * 0.25, this.controlsCanvas.height * 0.5);
		this.controlsContext.fillRect(this.playButtonWidth * 0.575, this.controlsCanvas.height * 0.25, 
							this.playButtonWidth * 0.25, this.controlsCanvas.height * 0.5);	
	}

	var newPosition = this.controlsCanvas.clientWidth - (this.playButtonWidth * 2);
	newPosition = newPosition * (this.position / this.meme.length);
	newPosition += this.playButtonWidth;
	newPosition = Math.min(newPosition, this.controlsCanvas.width - this.playButtonWidth);
	if (newPosition > this.playButtonWidth){
		this.controlsContext.shadowBlur = 10;
		this.controlsContext.fillStyle = "yellow";
		this.controlsContext.fillRect(newPosition, 0, this.playButtonWidth, this.controlsCanvas.height);
		this.controlsContext.strokeRect(newPosition, 0, this.playButtonWidth, this.controlsCanvas.height);
	}
}

OMemePlayer.prototype.loadCharacter = function (data, callback, errorCallback) {

	var char = {type: "CHARACTER", data}

	char.img = new Image();
	var img = char.img

	img.onerror = function(){
		char.loading = false
		if (errorCallback)
			errorCallback();
	};
	img.onload = function(){
		char.loading = false
		
		char.sprites = [img];
		char.centerX = img.width / 2; 
		char.centerY = img.height / 2;
		char.currentSprite = 0

		//loadSprite(charI, 0);
		turnOnSprite(0);
		
		if (callback)
			callback(char);
		
	};

	this.characters.push(char)
	char.loading = img
	img.src = char.data.thing.url;
}


OMemePlayer.prototype.addCharacter = function (char, callback, errorCallback) {
	
	char.i = 0
	var movie = this.movie
	this.characters.push(char)
	
	
	
}

OMemePlayer.prototype.addCharacterFromFile = function (thing, callback, errorCallback){
	var movie = this.movie

	turnOffCharacters();
	clearSprites();

	var char = {sprites: [], spriteI:0, spriteChanges: [],
		i:0, actions:[],
		centerX: 0, 
		centerY: 0,
		thing: thing
	}
	movie.character.current = char;
	this.characters.push(char)
	

	this.addCharacter(char, callback, errorCallback)
	return char;
}

OMemePlayer.prototype.drawBackground = function() {
	
	if (this.backgroundImg) {
		this.context.drawImage(this.backgroundImg, 0, 0, 
			this.canvas.width, this.canvas.height);
	}
	else {
		/* javascript generated backdrop
		try {
			eval(document.getElementById("scene-script").value);
		}
		catch (e) {
		}*/
		this.canvas.width = this.canvas.width;
		this.context.filleStyle = "#000000";
		this.context.fillRect(0, 0, 
				600, this.height);
	}
}

OMemePlayer.prototype.drawCharacterWithSelection = function (char) {

	if (char){
		var movie = this.movie // superflous in a loop
		this.drawCharacter(char, 
			movie.character.x, movie.character.y, this.context);		

		if (char.sprites){
			this.context.lineWidth = 1;
			this.context.strokeStyle = "black";
			this.context.strokeRect(movie.character.x - char.centerX, 
					movie.character.y - char.centerY, 
				char.centerX * 2, char.centerY * 2);
		}
		else {

		}
	}
}

OMemePlayer.prototype.drawSelection = function (char, x, y, context) {
	if (char.sprites && char.sprites[char.currentSprite]){

		var img = char.sprites[char.currentSprite];
		context.lineWidth = 1;
		context.strokeStyle = "black";
		context.strokeRect(x - img.width/2, y - img.height/2, 
			img.width, img.height);
	}
}

OMemePlayer.prototype.drawCharacter = function (char, x, y, context){
	if (char.sprites){
		if (char.sprites[char.currentSprite]){
			var img = char.sprites[char.currentSprite];
			if (char.zoom){
				context.drawImage(img, x - img.width/2, y - img.height/2, 
					img.width * char.zoom, img.height * char.zoom);			
			}
			else {
				context.drawImage(img, x - img.width/2, y - img.height/2);										
			}
		}
	}
	else if (char.paths) {
		//todo 2020 damn, the old school character line drawer, turn this into a doodle app
		context.lineWidth = 6;
		context.shadowBlur = 10;
		for (var i = 0; i < char.paths.length; i++){
			context.strokeStyle = movie.colors[char.paths[i].color];
			context.beginPath();
			context.moveTo(char.paths[i].pxdata[0][0] + x - movie.character.centerX, 
					char.paths[i].pxdata[0][1] + y - movie.character.centerY);
			for (var j = 1; j < char.paths[i].pxdata.length; j++){
				context.lineTo(char.paths[i].pxdata[j][0] + x - movie.character.centerX, 
						char.paths[i].pxdata[j][1] + y - movie.character.centerY);
//				context.moveTo(char.paths[i].pxdata[j][0] + x - movie.character.centerX, 
//						char.paths[i].pxdata[j][1] + y - movie.character.centerY);
			}
			context.stroke();
			context.closePath();
			
		}
		context.shadowBlur = 0;
	}
}

OMemePlayer.prototype.drawCountIn = function(n) {
	this.context.font = "bold 18pt Arial Black";
	this.context.shadowColor = "black";
	this.context.shadowBlur = 10;
	this.context.fillStyle = "black";
	this.context.fillRect(0, 0, 75, 75);
	this.context.fillStyle = "grey";
	this.context.fillRect(0, 0, 75 * (Math.ceil(n) - n), 75);
	this.context.fillStyle = "white";
	this.context.fillText( Math.ceil(n), 30, 50);
	this.context.shadowBlur = 0;
}

OMemePlayer.prototype.drawLoading = function() {
	var n = 0;
	this.context.font = "bold 18pt Arial Black";
	this.context.shadowColor = "black";
	this.context.shadowBlur = 10;
	this.context.fillStyle = "white";
	this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
	//this.context.fillStyle = "grey";
	//this.context.fillRect(0, 0, 75 * (Math.ceil(n) - n), 75);
	this.context.fillStyle = "black";
	this.context.fillText("Loading...", 30, 50);
	this.context.shadowBlur = 0;
}

OMemePlayer.prototype.currentCharacter = function () {
	return this.movie.character.current;
}


// shouldn't really be in the player
OMemePlayer.prototype.getJSON = function () {
	var movie = this.movie
	var mov = {
			type: "MEME",
			name: "", //document.getElementById("movie-title").value,
			length: movie.scene.length, characters: [], 
			//scene: document.getElementById("scene-script").value,
			dialog: movie.scene.dialog};
	if (movie.scene.backdrop){
		mov.backdrop = movie.scene.backdrop.src; //movie.scene.backdropSource;
	}
	for (var ic = 0; ic < this.characters.length; ic++){
		mov.characters[ic] = {actions: this.characters[ic].actions,
			spriteChanges: this.characters[ic].spriteChanges,
			thing: this.characters[ic].thing,
			paths: this.characters[ic].paths};
	}
	mov.soundtrack = {sounds: [],
		channels: movie.scene.soundtrack.channels};

	var sounds = movie.scene.soundtrack.sounds;
	var newSound;
	var oldSound;
	for (var isnd = 0; isnd < sounds.length; isnd++) {
		oldSound = sounds[isnd];
		newSound = {data: oldSound.data, type: oldSound.type, i: oldSound.i};
		console.log(sounds[isnd]);
		if (newSound.type == "omgsong") {
			newSound.omgsong = sounds[isnd].omgsong.getData();
		}
		else {
			newSound.src = sounds[isnd].src;
		}
		mov.soundtrack.sounds[isnd] = newSound;
	}
	
	mov.video = {list: movie.scene.video.list};

	mov.doodles = {list: movie.scene.doodles.list};
	
	return mov;
}

OMemePlayer.prototype.playButton = function() {
	var scene = this
	scene.resetSoundtrack = true;
	if (!scene.paused){
		this.pause();
	}
	else {
		//TODO commented this out
		//document.getElementById("after-show").style.visibility = "hidden";
		
		if (scene.hasPlayed && scene.position < scene.length){
			this.resume();
		}
		else {
			this.play();
		}
	}
}

OMemePlayer.prototype.loadBackground = function(){

	if (!this.meme) return
	
	var background = this.meme.background
	if (background && background.thing && background.thing.url) {
		this.backgroundImg = new Image()
		this.backgroundImg.src = background.thing.url
	}
}

OMemePlayer.prototype.addBackground = function(thing, callback, errorCallback){

	if (!this.meme) return

	this.meme.background = {thing} 
	
	this.loadBackground()
}

OMemePlayer.prototype.updateDoodles = function updateDoodles(nowInLoop) {
	
	var drawn;
	var data;
	var j;
	for (var i = 0; i < doodles.list.length; i++) {
		
		drawn = false;
		this.context.lineWidth = doodles.list[i].width;
		data = doodles.list[i].data;
		for (j = 1; j < data.length; j++) {
			
			if (data[j][2] > nowInLoop){
				break;
			}
		
			if (!drawn) {
				this.context.beginPath();
				drawn = true;
			}

			this.context.moveTo(data[j - 1][0], data[j - 1][1]);
			this.context.lineTo(data[j][0], data[j][1]);
		}

		if (drawn) {
			this.context.closePath();
			this.context.strokeStyle = movie.colors[doodles.list[i].color]; 
			this.context.stroke();
		}

	}	
	
}






/// below is everything not refactored yet
/// the music stuff should definitely be external... I'm pretty sure








function saveCharacter(){
	if (currentCharacter()){
//	   try{
			var xhr = new XMLHttpRequest();
			xhr.open("POST", "/ahelp", true);
			xhr.onreadystatechange = function(){
				if (xhr.readyState == 4){
					var id = xhr.responseText;
					if (id != "bad"){
					    currentCharacter().id = id;
					}
				}
			}
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			var json = JSON.stringify({src: currentCharacter().src,
				   paths: currentCharacter().paths}); 
			var params = "type=Character&userid=" + movie.currentUser + 
					"&json=" + encodeURIComponent(json);
			xhr.send(params);
//		   } catch (excp) {}
   }
}

function openCharacters(){
	   //try{
				var xhr = new XMLHttpRequest();
			xhr.open("GET", "/ahelp?type=Character&userid=" + movie.currentUser, true);
			xhr.onreadystatechange = function(){
				if (xhr.readyState == 4){
					var resp = xhr.responseText;
					if (resp != "bad"){
						document.getElementById("dialog-title").innerHTML = "Open a Saved Character";
						var dialog = document.getElementById("chooser-dialog");
						var list = document.getElementById("chooser-dialog-list");
						list.innerHTML = "";
						var movies = JSON.parse(resp);
						for (var i = 0; i < movies.length; i++){
							var obj = movies[i].o;
							var newDiv = document.createElement("canvas");
							newDiv.className = "saved-character";
							//newDiv.innerHTML = "ID: " + movies[i].id;
							newDiv.height = 80;
							newDiv.width = 60;
							if (obj.paths){
								drawCharacter(obj, newDiv.width / 2, newDiv.height, 
										newDiv.getContext("2d"));								
							}

							newDiv.onclick = (function (obj, id) {
									return function() {
										if (obj.src){
											addCharacterFromFile(obj);
										}
										else {
											addCharacter(obj);
										}
										dialog.style.display = "none";
									};
							})(obj, movies[i].id);
							list.appendChild(newDiv);
						}
						dialog.style.display = "block";
					}
				}
			}
			xhr.send(); 
		 //  }
		   //catch (excp) {}
}

function dropSceneBackground(e){
    e.preventDefault();
    e.dataTransfer.items[0].getAsString(function(url){
        addBackdrop(url);
    });
}
function dropCharacter(e){
    e.preventDefault();
    e.dataTransfer.items[0].getAsString(function(url){
        addCharacterFromFile(url);
    });
}


function updateAudioChannels(nowInLoop){
	var strack = movie.scene.soundtrack;
	drawSoundtrack();
	if (movie.scene.paused){ 
		for (var is = 0; is < strack.sounds.length; is++){
			if (strack.soundAudios[is])
				strack.soundAudios[is].pause();
		}
		if (oMemePlayer.player.playing && !oMemePlayer.player.editting)
			oMemePlayer.player.stop();
	}
	else if (strack.soundI < strack.playList.length && strack.playList[strack.soundI].start < nowInLoop){
		
		var sound = strack.sounds[strack.playList[strack.soundI].sound];
		var makePlay;

		var aa = strack.soundAudios[strack.playList[strack.soundI].sound];
		makePlay = function(){
			if (sound.type == "omgsong") {
				oMemePlayer.player.play(sound.omgsong);			
				aa = {};
				aa.started = strack.playList[strack.soundI].start;
				aa.currentTime = (nowInLoop - aa.started) / 1000;
				aa.pause = function () {oMemePlayer.player.stop()};
				strack.playingSounds.push({"audio": aa, 
					"start": strack.playList[strack.soundI].start,
					"stop": strack.playList[strack.soundI].stop});
				strack.soundI++;				
			}
			else if (aa.readyState == 4){
				if (nowInLoop < strack.playList[strack.soundI].stop){
					aa.started = strack.playList[strack.soundI].start;
					aa.currentTime = (nowInLoop - aa.started) / 1000;
					aa.play();
					strack.playingSounds.push({"audio": aa, 
							"start": strack.playList[strack.soundI].start,
							"stop": strack.playList[strack.soundI].stop});
				}
				strack.soundI++;				
			}
			else {
				setTimeout(makePlay, 250);
			}
		};			
		makePlay();
	}
	for (var it = 0; it < strack.playingSounds.length; it++){
		if (strack.playingSounds[it].stop > -1 && strack.playingSounds[it].stop < nowInLoop){
			if (strack.playingSounds[it].audio.started == strack.playingSounds[it].start){
				strack.playingSounds[it].audio.pause();
				strack.playingSounds[it].audio.currentTime = 0;
			}
			strack.playingSounds.splice(it, 1);
			it--;
		}
	}
	if (movie.audio){
		for (var ic = 0; ic < movie.scene.soundtrack.channels.length; ic++){
			var chan = movie.scene.soundtrack.channels[ic];
			var achan = movie.audio.channels[ic];
			var ci = chan.i;
			var coord = {x: -1, y: -1};
			if (movie.scene.paused){ 
				achan.gain.gain.value = 0;
			}
			else if (!achan.recording){
				while (ci < chan.data.length && chan.data[ci][2] < nowInLoop){
					if (achan.data[ci].freq == -1){
						achan.gain.gain.value = 0;
					}
					else {
						achan.gain.gain.value = achan.defaultGain;
						achan.osc.frequency.setValueAtTime(achan.data[ci].freq, 0);
						achan.panner.setPosition(achan.data[ci].pan, 0, 0);
					}
					chan.i++;
					ci++;
				}
				if (movie.scene.mode == "SOUNDTRACK" && ci > 0 && 
						ci-1 < chan.data.length && chan.data[ci-1][0] > -1){
					movie.scene.context.fillStyle = movie.instruments[chan.instrument];
					movie.scene.context.fillRect(chan.data[ci-1][0], chan.data[ci-1][1], 20, 20);
				}
				if (ci == chan.data.length || ci == 0){
					achan.gain.gain.value = 0;
				}
			}
		}
	}
}

function drawSoundtrack() {
	if (movie.scene.mode != "SOUNDTRACK"){
		return;
	}
	
	if (!movie.scene.soundtrack.image) {
		var soundImage = new Image();
		soundImage.src = "/img/sound.png";
		movie.scene.soundtrack.image = soundImage;
	}
	var sounds = movie.scene.soundtrack.sounds;
	var soundAudios = movie.scene.soundtrack.soundAudios;
	var ctx = movie.scene.context; 
	var img = movie.scene.soundtrack.image;
	var leftOffset = 5;
	var timelineStart = leftOffset * 2 + img.width;
	var width = movie.scene.canvas.width - timelineStart;
	var soundStart;
	var end;
	for (var is = 0; is < sounds.length; is++) {
		ctx.beginPath();
		ctx.moveTo(timelineStart, img.height * is + img.height / 2 + 1);
		ctx.lineTo(timelineStart + width, img.height * is + img.height / 2 + 1);
		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.drawImage(img, leftOffset, img.height * is);

		ctx.strokeStyle = "yellow";
		ctx.lineWidth = 10;
		
		for (var isd = 0; isd < sounds[is].data.length; isd++) {
			ctx.beginPath();
			soundStart = timelineStart + width * (sounds[is].data[isd][0] / movie.scene.length);
			end = sounds[is].data[isd][1];
			if (end == -1) {
				end = movie.scene.position;
			}
			soundEnd = timelineStart + width * (end / movie.scene.length);
			ctx.moveTo(soundStart, img.height * is + img.height / 2 - 5);
			ctx.lineTo(soundEnd, img.height * is + img.height / 2 - 5);
			ctx.stroke();
		}
	}
	ctx.beginPath();
	var lineX = timelineStart + width * (movie.scene.position / movie.scene.length);
	ctx.moveTo(lineX, 0);
	ctx.lineTo(lineX, movie.scene.canvas.height);
	ctx.strokeStyle = "#808080";
	ctx.lineWidth = 2;
	ctx.stroke();
}

function updateVideos(nowInLoop){
	var v = movie.scene.video;
	if (movie.scene.paused){ 
		for (var is = 0; is < v.list.length; is++){
			v.elements[is].pause();
		}
	}
	else {
		if (v.i < v.playList.length && v.playList[v.i].start < nowInLoop){
			var id = v.playList[v.i].id;		
			var iii = v.i;
			var aa = v.elements[id];
			var makePlay = function(){
				if (aa.readyState == 4){
					aa.j = v.playList[iii].i;
					aa.currentTime = 0;
					aa.style.visibility = "visible";
					aa.style.left = (v.list[id].data[v.playList[iii].i][0][0] - aa.clientWidth/2) + "px";
					aa.style.top = (v.list[id].data[v.playList[iii].i][0][1] - aa.clientHeight/2) + "px";
					aa.play();
					v.playing[v.playing.length] = {"id": id,
							"element": aa, 
							"start": v.playList[iii].start,
							"stop": v.playList[iii].stop,
							"i": 0, 
							"j": v.playList[iii].i};
					v.i++;
				}
				else {
					setTimeout(makePlay, 250);
				}
			};
			makePlay();
		}
		for (var it = 0; it < v.playing.length; it++){
			var vid = v.playing[it];
			var vData = v.list[vid.id].data;
			var j = vid.j;
			while (vid.i+1 < vData[j].length && 
					vData[j][vid.i+1][2] < nowInLoop){
				vid.i++;
			}
			if (vid.i < vData[j].length && vData[j][vid.i][0] == -1){
				v.playing.splice(it, 1);
				it--;
				if (vid.element.j == j){
					vid.element.pause();
					vid.element.style.visibility = "hidden";
					vid.element.currentTime = 0;
				}
			}
			else {
				vid.element.style.left = (vData[j][vid.i][0] - vid.element.clientWidth/2) + "px";
				vid.element.style.top = (vData[j][vid.i][1] -vid.element.clientHeight/2)+ "px";
			}
		}
	}
}

function turnOffSprites(){
	if (currentCharacter() && currentCharacter().sprites){
		for (var ic = 0; ic < currentCharacter().sprites.length; ic++){
			var ooo = document.getElementById("sprite-canvas" + ic);
			if (ooo){
				ooo.style.borderWidth = "0px";
				ooo.style.margin = "8px";
			}
		}
		var ooo = document.getElementById("visible-canvas");
		if (ooo){
			ooo.style.borderWidth = "0px";
			ooo.style.margin = "8px";
		}
	}

}
function turnOnSprite(ic){
	var ooo;
	if (ic == -1){
		ooo = document.getElementById("visible-canvas");
	}
	else {
		ooo = document.getElementById("sprite-canvas" + ic);
	}
	if (ooo){
		turnOffSprites();
		ooo.style.borderWidth = "8px";
		ooo.style.margin = "0px";	
	}
}
function visibleCanvas(){
	setSprite(-1);
}
function spriteSizeMinus(){
	if (currentCharacter()){
		if (!currentCharacter().zoom){
			currentCharacter().zoom = 1;
		}
		currentCharacter().zoom = Math.max(0.01, currentCharacter().zoom - 0.05);
		setSprite(-2);
	}	
}
function spriteSizePlus(){
	if (currentCharacter()){
		if (!currentCharacter().zoom){
			currentCharacter().zoom = 1;
		}
		currentCharacter().zoom = Math.min(4, currentCharacter().zoom + 0.05);
		setSprite(-2);
	}	
}
function turnOffCharacters(){
	if (false && mmkr.characterList){
		for (var ic = 0; ic < this.characters.length; ic++){
			//var ooo = document.getElementById("char-canvas" + ic);
			//ooo.parentElement.style.borderWidth = "0px";
			//ooo.parentElement.style.margin = "8px";
		}
	}
}
function turnOnCharacter(ic, div){
	//div.style.borderWidth = "8px";
	//div.style.margin = "0px";
}

function recallSound(n){
	if (typeof(n) == "object") {
		n = n.i;	}

	movie.scene.soundtrack.currentSound = n;
}

function recallVideo(n){
	if (movie.scene.video.current > -1){
		var oo = document.getElementById("video" + movie.scene.video.current);
		oo.style.borderWidth = "0px";
		oo.style.margin = "8px";
	}
	var ooo = document.getElementById("video" + n);
	ooo.style.borderWidth = "8px";
	ooo.style.margin = "0px";

	movie.scene.video.current = n;
}


function clearSprites(){
	var asprite = document.getElementsByClassName("sprite");
	while (asprite.length > 0){
		asprite[0].parentElement.removeChild(asprite[0]);
	}
}
function loadSprites(n){
	clearSprites();

	if (!this.characters[n].sprites){
		return;
	}
	for (var is = 0; is < this.characters[n].sprites.length; is++){
		loadSprite(n, is);
	}
	if (currentCharacter() && currentCharacter().sprites){
		turnOnSprite(currentCharacter().currentSprite);
	}
}
function loadSprite(char, isprite){
	if (document.getElementById("sprites") && char == movie.character.current){
		var newItem = document.createElement("div");
		newItem.innerHTML = "<canvas onclick='setSprite(" + 
			isprite + ")' id='sprite-canvas" + isprite + 
			"' class='sprite-canvas'></canvas>"; 
		newItem.setAttribute("class", "sprite");
		document.getElementById("sprites").appendChild(newItem);
		document.getElementById("sprite-canvas" + isprite).getContext("2d").drawImage(
			this.characters[char].sprites[isprite], 0, 0);
	}
}

function setSprite(n){
	if (currentCharacter() && currentCharacter().spriteChanges){
		turnOnSprite(n);
		var spriteChange = [n, movie.scene.position - 1];
		if (n == -2){
			spriteChange[2] = currentCharacter().zoom;
		}
		currentCharacter().spriteChanges[currentCharacter().spriteChanges.length] = spriteChange;
		currentCharacter().spriteChanges.sort(function(a,b){return a[1]-b[1];})
		if (n > -2){		
			currentCharacter().currentSprite = n;
		}
	}
}

function clearCharacterCanvas(){
	movie.character.drawingCharacter = {paths:  [], actions: []};
	movie.character.canvas.getContext("2d").clearRect(0, 0, movie.character.canvas.width, movie.character.canvas.height);	
}


function showDrawCharactersButton(){
	document.getElementById("draw-characters").style.visibility="visible";
}

function chooseColor(color){
	var offs = 5;
	if (movie.character.currentColor > -1){ 
		var oldColor = document.getElementById("color-" + movie.character.currentColor);
		oldColor.style.borderWidth = "1px";
		oldColor.style.borderColor = "#808080";
		oldColor.style.zIndex = 0;
	}
	var newColor = document.getElementById("color-" + color);
	newColor.style.borderWidth = "3px";
	newColor.style.borderColor = "#FFFFFF";
	newColor.style.zIndex = 1;
	movie.character.currentColor = color;


}

function loadAudio(){
	for (var ic = 0; ic < movie.scene.soundtrack.channels.length; ic++){
		var ch = movie.scene.soundtrack.channels[ic];
		var chan = makeChannel(ch.instrument);
		chan.gain.gain.value = 0;
		for (var icd = 0; icd < ch.data.length; icd++){
			if (ch.data[icd][1] == -1){
				chan.data[icd] = {"freq": -1, "pan": -1};
			}
			else {
				var freq = makeFreq(ch.data[icd][1]) ;
				var panX = makePan(ch.data[icd][0]);
				chan.osc.frequency.value = freq;
				chan.panner.setPosition(panX, 0, 0);
				chan.data[icd] = {"freq": freq, "pan":panX};				
			} 
		}
		movie.audio.channels[movie.audio.channels.length] = chan;
		chan.recording = false;
	}
}
function loadVideo(){
	for (var ic = 0; ic < movie.scene.video.list.length; ic++){
		var ch = movie.scene.soundtrack.channels[ic];
		var chan = makeChannel(ch.instrument);
		chan.gain.gain.value = 0;
		for (var icd = 0; icd < ch.data.length; icd++){
			if (ch.data[icd][1] == -1){
				chan.data[icd] = {"freq": -1, "pan": -1};
			}
			else {
				var freq = makeFreq(ch.data[icd][1]) ;
				var panX = makePan(ch.data[icd][0]);
				chan.osc.frequency.value = freq;
				chan.panner.setPosition(panX, 0, 0);
				chan.data[icd] = {"freq": freq, "pan":panX};				
			} 
		}
		movie.audio.channels[movie.audio.channels.length] = chan;
		chan.recording = false;
	}
}

function addSoundFile(template){
	if (typeof(template) == "string"){
		var ooo = {"src": template, 
			"data": [], "type": "file"};
		template = ooo;
	}
	var aa = new Audio();
	aa.src = template.src;
	aa.load();
	var ii = movie.scene.soundtrack.sounds.length;
	template.i = ii;
	movie.scene.soundtrack.sounds[ii] = template;
	movie.scene.soundtrack.soundAudios[ii] = aa;

	recallSound(ii);
	 
	return template;
}


function addOpenMusicSong(song) {

	var template = {"data": [], "type": "omgsong", 
		"omgsong": song};

	var ii = movie.scene.soundtrack.sounds.length;
	template.i = ii;
	movie.scene.soundtrack.sounds[ii] = template;
	movie.scene.soundtrack.soundAudios[ii] = false;

	recallSound(ii);
	 
	return template;
	
}

function loadOpenMusicSong(template) {

	template.omgsong = new OMGSong(null, template.omgsong)
	
	var ii = movie.scene.soundtrack.sounds.length;
	template.i = ii;
	movie.scene.soundtrack.sounds[ii] = template;
	movie.scene.soundtrack.soundAudios[ii] = false;

	recallSound(ii);
	 
	return template;
	
}


function addVideoFile(template){
	if (!template){
		template = {"src": document.getElementById("video-file").value, 
			"data": []};
	}
	var aa = document.createElement("video");
	document.getElementById("scene-view").appendChild(aa);
	aa.setAttribute("class", "vid");
	aa.preload = true;
	aa.src = template.src;
	var ii = movie.scene.video.list.length;
	movie.scene.video.list[ii] = template;
	movie.scene.video.elements[ii] = aa;
	aa.addEventListener("mouseout", movie.tool.mouseout, false);
	aa.addEventListener("mousedown", movie.tool.mousedown, false);
	aa.addEventListener("mousemove", movie.tool.mousemove, false);
	aa.addEventListener("mouseup",   movie.tool.mouseup, false);
	aa.addEventListener("touchstart", movie.tool.touchstart, false);
	aa.addEventListener("touchmove", movie.tool.touchmove, false);
	aa.addEventListener("touchend",   movie.tool.touchend, false);

	var newItem = document.createElement("div");
	newItem.setAttribute("class", "video");
	newItem.setAttribute("id", "video" + ii);
	newItem.setAttribute("onclick", "recallVideo(" + ii + ")");
	newItem.style.backgroundImage = "url('img/sound.png')";
	document.getElementById("video-list").appendChild(newItem);
	recallVideo(ii);
}




function makeFreq(y){
	return buildFrequency(movie.audio.ascale, movie.audio.octaves, 1 - y / movie.scene.canvas.height, movie.audio.base);	
}
function makePan(x){
	return (x / movie.scene.canvas.width - 0.5) * 10;
}
//translated from Adam Smith's Android code
function buildScale(quantizerString) {
    if (quantizerString != null && quantizerString.length > 0) 
    {
        var parts = quantizerString.split(",");
        var scale = []; //new float[parts.length];
        for (var i = 0; i < parts.length; i++) {
            scale[i] = parseFloat(parts[i]);
        }
        return scale;
    } else {
        return null;
    }
}
function buildFrequency(scale, octaves, input, base) {
	input = Math.min(Math.max(input, 0.0), 1.0);
	var mapped = 0;
	if (scale == null) {
		mapped = base + input * octaves * 12.0;
	} else {
		var idx = Math.floor((scale.length * octaves + 1) * input);
		mapped = base + scale[idx % scale.length] + 12 * Math.floor(idx / scale.length);
	}
	return Math.pow(2, (mapped - 69.0) / 12.0) * 440.0;
}

function makeChannel(color){
	var info = getInstrumentInfo(color);
	var chan = 	{};
	var acontext = movie.audio.context;
	chan.data = [];
	chan.muted = false;
	chan.defaultGain = 0.4;
	chan.osc = acontext.createOscillator();
	chan.gain = acontext.createGainNode();
	chan.delay = acontext.createDelayNode();
	chan.delayGain = acontext.createGainNode();
	chan.panner = acontext.createPanner();
	chan.gain.gain.value = chan.defaultGain; 
	chan.delayGain.gain.value = 0.3;
	chan.osc.connect(chan.gain);
	chan.gain.connect(chan.panner);
	chan.panner.connect(acontext.destination);

	chan.osc.type = info.type;

	if (info.delay){
		chan.delay.delayTime.value = 0.5;
		chan.gain.connect(chan.delay);
		chan.delay.connect(chan.delayGain);
		chan.delayGain.connect(acontext.destination);
	}
	chan.osc.noteOn(0);
	chan.recording = true;
	return chan;
}
function getInstrumentInfo(color){
    var instrumentType = 0;
    var ldelay = false;
	var softEnvelope = false; // TODO slow attack and sustain if true
    if (color == 0) {
		ldelay = true;
		softEnvelope = true;
    } 
    else if (color == 1) {
    } 
    else if (color == 2) {
		softEnvelope = true;
		instrumentType = 1;
    } 
    else if (color == 3) {
		instrumentType = 1;
    } 
    else if (color == 4) {
		softEnvelope = true;
		instrumentType = 1;
    } 
    else if (color == 5) {
		instrumentType = 1;
    } 
    else if (color == 6) {
		softEnvelope = true;
		instrumentType = 1;
		ldelay = true;
    } 
    else if (color == 7) {
		softEnvelope = true;
		instrumentType = 2;
    } 
    else if (color == 8) {
		instrumentType = 2;
    } 
    else if (color == 9) {
		instrumentType = 2;
		ldelay = true;
		softEnvelope = true;    } 
    else if (color == 10) {
	instrumentType = 2;
	ldelay = true;
    } 
	return {type: instrumentType, delay: ldelay, soft: softEnvelope};
}

function chooseInstrument(color){
  var offs = 5;
  movie.scene.soundtrack.currentSound = -1;
  movie.scene.resetSoundtrack = true;
  if (movie.scene.soundtrack.currentColor > -1){ 
  var oldColor = document.getElementById("inst-" + movie.scene.soundtrack.currentColor);
  oldColor.style.borderWidth = "1px";
  oldColor.style.borderColor = "#808080";
  oldColor.style.zIndex = 0;
  }
  var newColor = document.getElementById("inst-" + color);
  newColor.style.borderWidth = "3px";
  newColor.style.borderColor = "#FFFFFF";
  newColor.style.zIndex = 1;
  movie.scene.soundtrack.currentColor = color;


}

