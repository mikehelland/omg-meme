import OMGSpriter from "/apps/sprite/spriter.js"

export default function OMemePlayer(config) {

	if (!config || !config.div) {
		console.warn("MemePlayer: no config.div?")
		return
	}

	this.config = config

	this.paused = true
	this.position = 0

	var div = config.div;
	
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

	this.layerExtras = new Map()

	this.width = 640 || config.width;
	this.height = 480 || config.height;
	
	sceneCanvas.style.boxSizing = "border-box"
	sceneCanvas.style.width = "100%" 
	sceneCanvas.style.height = "100%"
	sceneCanvas.width = this.width;
	sceneCanvas.height = this.height;

	controlsCanvas.style.width = "100%" 

	controlsCanvas.width = controlsCanvas.clientWidth;
	
	sceneCanvas.style.display = "block";
	controlsCanvas.style.display = "block";
	
	if (!config.externalControls) {
		controlsCanvas.style.position = "absolute"
		controlsCanvas.style.bottom = "0px";
		controlsCanvas.style.boxSizing = "border-box"
		controlsCanvas.style.width = sceneCanvas.width 
		controlsCanvas.width = controlsCanvas.clientWidth;
	
	}
	controlsCanvas.style.height = "40px";	
	controlsCanvas.height = 40;
	//controlsCanvas.style.backgroundColor = "#303030";

	this.controlsContext = controlsCanvas.getContext("2d");		
	this.context = sceneCanvas.getContext("2d");
	
	this.context.lineWidth = 6;
	this.context.shadowColor = "black";
	this.context.lineJoin = "round";

	if (controlsCanvas){
		this.setupControls();
	}
}

OMemePlayer.prototype.load = async function(meme) {

	this.meme = meme
	this.sizeCanvas()
	
	this.musicPlayersToLoad = 0

	if (!meme.layers) {
		meme.layers = []	
	}
	for (let layer of meme.layers) {
		layer.i = 0 
		switch (layer.type) {
			case "CHARACTER":
				this.loadCharacter(layer);
				break;
			case "SOUNDTRACK":
				if (layer.thing.type === "AUDIO") {
					this.loadAudio(layer);
				}
				else {
					await this.loadSoundtrack(layer);
				}
				break;
		}
	}


	this.loadBackground()

	if (typeof meme.length !== "number") {
		meme.length = 0
	}

	this.loaded = true
	
	this.animate();
	
	if (this.musicPlayersToLoad === 0 && this.onload) {
		this.onload()
	}
}

OMemePlayer.prototype.loadPreview = function (meme) {
	this.meme = meme
	this.sizeCanvas()
	this.loadBackground(() => {
		this.drawBackground()

		this.meme.layers.forEach(layer => {
			if (layer.disabled) {
				return
			}

			switch(layer.type) {
				case "CHARACTER":
					this.loadCharacter(layer, () => this.animateCharacter(layer, 0))
					break;
				case "DIALOG":
					layer.i = 0
					this.animateDialog(layer, 0)
					break;
				case "DOODLE":
					layer.i = 0
					this.animateDoodle(layer, 0)
					break;
				}
		})
	})
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
		var x = ev.pageX - this.controlsOffsetLeft;
		var y = ev.pageY - this.controlsOffsetTop;
		this.onControlsDown(x, y);
	}, false);
	controlsCanvas.addEventListener("mousemove", (ev) => {
		var x = ev.pageX - this.controlsOffsetLeft;
		var y = ev.pageY - this.controlsOffsetTop;
		this.onControlsMove(x, y);
	}, false);
	controlsCanvas.addEventListener("mouseup",  (ev) => {
		ev.preventDefault(); 
		this.onControlsEnd(ev.pageX - this.controlsOffsetLeft, ev.pageY - this.controlsOffsetTop);
	}, false);
	controlsCanvas.addEventListener("touchstart", (ev) => {
		ev.preventDefault();
		setOffsets();
		var x = ev.targetTouches[0].pageX - this.controlsOffsetLeft;
		var y = ev.targetTouches[0].pageY - this.controlsOffsetTop;
		this.onControlsDown(x, y);
	}, false);
	controlsCanvas.addEventListener("touchmove", (ev) => {
		ev.preventDefault(); 
		var x = ev.targetTouches[0].pageX - this.controlsOffsetLeft;
		var y = ev.targetTouches[0].pageY - this.controlsOffsetTop;
		this.onControlsMove(x, y);
	}, false);
	controlsCanvas.addEventListener("touchend",  (ev) => {
		var x = ev.targetTouches[0].pageX - this.controlsOffsetLeft;
		var y = ev.targetTouches[0].pageY - this.controlsOffsetTop;
		ev.preventDefault(x, y); 
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

		var newPosition = x - this.playButtonWidth
		newPosition = newPosition / (this.controlsCanvas.clientWidth - this.playButtonWidth);
		newPosition = Math.max(0, Math.round(newPosition * this.meme.length));
		this.started = Date.now() - newPosition;
		this.position = newPosition;
		//this.updateIs = true;
		this.seek = true
		
		if (this.onupdateposition) this.onupdateposition(newPosition)
	}
};

OMemePlayer.prototype.onControlsMove = function(x, y){
	if (this.controlsStarted === 2){
		var newPosition = x - this.playButtonWidth
		newPosition = newPosition / (this.controlsCanvas.clientWidth - this.playButtonWidth);
		newPosition = Math.max(0, Math.round(newPosition * this.meme.length));
		this.started = Date.now() - newPosition;
		this.position = newPosition;
		this.updateIs = true;
		this.seek = true
		this.resetSoundtrack = true;

		if (this.onupdateposition) this.onupdateposition(newPosition)
	}
};

OMemePlayer.prototype.onControlsEnd = function (x) {
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
			var newPosition = x - this.playButtonWidth
			newPosition = newPosition / (this.controlsCanvas.clientWidth - this.playButtonWidth);
			newPosition = Math.max(0, Math.round(newPosition * this.meme.length));
			this.started = Date.now() - newPosition;
			this.position = newPosition;
			//this.updateIs = true;
			this.seek = true
			this.paused = this.wasPaused;

			if (this.onupdateposition) this.onupdateposition(newPosition)
		}
	}
	this.controlsStarted = 0;

};


OMemePlayer.prototype.play = function() {
	
	this.updateIs = true
	this.started =  Date.now() //+ preroll;
	this.paused = false;
	
	this.lastFrameChange = this.started
	
	this.hasPlayed = true;
}
OMemePlayer.prototype.resume = function() {
	this.started = Date.now() - this.position;
	this.paused = false;
	this.resetSoundtrack = true;
}
OMemePlayer.prototype.pause = function() {
	this.paused = true;

	for (var i = 0; i < this.meme.layers.length; i++) {
		if (this.meme.layers[i].type === "SOUNDTRACK") {
			var extras = this.layerExtras.get(this.meme.layers[i])
			if (extras.musicPlayer && extras.musicPlayer.playing) {
				extras.musicPlayer.stop()
			}
		}
	}
}

OMemePlayer.prototype.animate = function() {	
	
	this.drawBackground();
	
	if (this.paused){
		this.nowInLoop = this.position;
	}
	else {
		this.nowInLoop = Date.now() - this.started;
		this.position = this.recordPastPlay ? this.nowInLoop : Math.min(this.meme.length, this.nowInLoop)

		if (this.onupdateposition) this.onupdateposition(this.position)
	}

	if (this.loading){
		this.drawLoading();
	}
	else if (this.nowInLoop < 0){
		this.drawCountIn(Math.abs(this.nowInLoop/1000));
	}
	else {	
		for (this._animate_i = 0; this._animate_i < this.meme.layers.length; this._animate_i++) {

			if (this.updateIs) {
				this.meme.layers[this._animate_i].i = 0
			}

			if (this.meme.layers[this._animate_i].disabled) {
				continue
			}
		
			switch(this.meme.layers[this._animate_i].type) {
				case "CHARACTER":
					this.animateCharacter(this.meme.layers[this._animate_i], this.nowInLoop)
					break;
				case "DIALOG":
					this.animateDialog(this.meme.layers[this._animate_i], this.nowInLoop)
					break;
				case "DOODLE":
					this.animateDoodle(this.meme.layers[this._animate_i], this.nowInLoop)
					break;
				case "SOUNDTRACK":
					this.updateSoundtrack(this.meme.layers[this._animate_i], this.nowInLoop)
					break;
				}
		}
		this.updateIs = false
		this.seek = false

		if (this.preview && this.preview.y !== -1) {
			this.context.globalAlpha = 0.6
			switch(this.preview.type) {
				case "CHARACTER":
					//with selection?
					this.drawCharacterWithSelection(this.preview, this.preview.x, this.preview.y, this.context)
					break;
				case "DIALOG":
					this.drawDialog(this.preview.text, this.preview.x, this.preview.y)
					break;
				case "DOODLE":
					this.previewDoodle(this.preview)
					break;
			}
			this.context.globalAlpha = 1
		}
		
		if (this.nowInLoop > this.meme.length){
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
	}

	this.drawControls();
	
	requestAnimationFrame(() => {
		this.animate();
	});
}


OMemePlayer.prototype.animateCharacter = function (char, nowInLoop) {
	
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
		if (char.thing.type === "SPRITE") {
			let spriter = this.layerExtras.get(char).spriter
			//if (this.updateIs || !spriter.lastFrameChange || this.position - spriter.lastFrameChange > 250) {
			if (this.position - spriter.lastFrameChange > 250) {
				spriter.next()
				spriter.lastFrameChange = this.position
			}
			
		}
		this.drawCharacter(char, 
			pxdata[char.i][0], pxdata[char.i][1], this.context);
	}

}

OMemePlayer.prototype.animateDialog = function (dialog, nowInLoop) {
	
	if (this.seek) {
		dialog.i = 0
		for (var i = 0; i < dialog.xyt.length; i++) {
			if (dialog.xyt[i][2] > nowInLoop) {
				break
			}
			else {
				dialog.i = i
			}
		}
	}

	if (!dialog.xyt[dialog.i] || dialog.xyt[dialog.i][0] === -1) {
		this._shouldDrawDialog = false
	}
	else if (dialog.i === 0 && dialog.xyt[dialog.i][2] > nowInLoop) {
		this._shouldDrawDialog = false
	}
	else if (dialog.xyt[dialog.i + 1] && dialog.xyt[dialog.i + 1][2] <= nowInLoop) {
		dialog.i++
		this._shouldDrawDialog = true 
	}
	else {
		this._shouldDrawDialog = true
	}
	
	if (this._shouldDrawDialog) {
		this.drawDialog(dialog.text, dialog.xyt[dialog.i][0], dialog.xyt[dialog.i][1])
	}
}

OMemePlayer.prototype.drawDialog = function(text, x, y) {
	
	if (x === "stop") {
		return
	}

	x = this.canvas.width * x
	y = this.canvas.height * y

	//todo lots of variables being declared in a loop
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

	this.controlsCanvas.width = this.controlsCanvas.clientWidth;
	
	var newPosition = this.controlsCanvas.clientWidth - (this.playButtonWidth * 2);
	newPosition = this.position / this.meme.length * (this.controlsCanvas.clientWidth - this.playButtonWidth);
	newPosition += this.playButtonWidth;
	newPosition = Math.min(newPosition, this.controlsCanvas.width)
	if (newPosition >= this.playButtonWidth){
		this.controlsContext.shadowBlur = 10;
		this.controlsContext.fillStyle = "red";

		this.controlsContext.beginPath();
		this.controlsContext.arc(newPosition, this.controlsCanvas.height /  2, this.controlsCanvas.height / 4, 0, Math.PI * 2)
		this.controlsContext.fill();
	}

	this.controlsContext.textAlign = "right"
	this.controlsContext.fillStyle = "white";
	this.controlsContext.fillText(Math.round(this.meme.length / 100) / 10 + " sec", this.controlsCanvas.width - 18, this.controlsCanvas.height / 2 + 4)

	this.controlsContext.fillStyle = "black";
	this.controlsContext.fillRect(0, 0, this.playButtonWidth, this.controlsCanvas.height);
	this.controlsContext.fillStyle = "white";
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

}

OMemePlayer.prototype.loadCharacter = function (char, callback, errorCallback) {

	let extras = {}
	this.layerExtras.set(char, extras)

	if (!char.scale) {
		char.scale = 1
	}
	if (char.thing.type === "IMAGE") {
		char.img = new Image();
		var img = char.img
		char.sprites = [img];
			
		img.onerror = function(){
			char.loading = false
			if (errorCallback)
				errorCallback();
		};
		img.onload = function(){
			char.loading = false
			
			char.centerX = img.width / 2; 
			char.centerY = img.height / 2;
			char.currentSprite = 0
			
			if (callback)
				callback(char);
			
		};

		char.loading = img
		img.src = char.thing.url;
	}
	else if (char.thing.type === "SPRITE") {
		extras.spriter = new OMGSpriter(char.thing, this.canvas)
		extras.spriter.setSheet()
		if (callback)
			callback(char);
			
	}
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
		this.drawCharacter(char, char.x, char.y, this.context);		

		this.context.lineWidth = 1;
		this.context.strokeStyle = "black";
		this.context.strokeRect(char.x - char.centerX, 
				char.y - char.centerY, 
				char.centerX * 2, char.centerY * 2);
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

OMemePlayer.prototype.drawCharacter = function (char, x, y, context) {
	if (char.thing.type === "SPRITE") {
		let spriter = this.layerExtras.get(char).spriter
		spriter.x = context.canvas.width * x - spriter.frameWidth/2
		spriter.y = context.canvas.height * y - spriter.frameHeight/2
		spriter.draw()
	}
	else if (char.sprites){
		if (char.sprites[char.currentSprite]){
			var img = char.sprites[char.currentSprite];
			if (char.zoom){
				context.drawImage(img, x - img.width/2, y - img.height/2, 
					img.width * char.zoom, img.height * char.zoom);			
			}
			else {
				context.drawImage(img, 
					context.canvas.width * x - img.width/2, 
					context.canvas.height * y - img.height/2);										
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


OMemePlayer.prototype.playButton = function() {
	this.resetSoundtrack = true;

	if (!this.paused){
		this.pause();
	}
	else {
		if (this.hasPlayed && this.position < this.meme.length){
			this.resume();
		}
		else {
			this.play();
		}
	}
}

OMemePlayer.prototype.loadBackground = function(onload) {

	if (!this.meme) return
	
	var background = this.meme.background
	if (background && background.thing && background.thing.url) {
		this.backgroundImg = new Image()
		this.backgroundImg.onload = () => {
			if (onload) onload(this.backgroundImg)
		}
		this.backgroundImg.src = background.thing.url
	}
	else {
		if (onload) onload(this.backgroundImg)
	}
}


OMemePlayer.prototype.previewDoodle = function (doodle) {
	
	this.context.fillStyle = doodle.color;
	this.context.fillRect(this.canvas.width * doodle.x - doodle.width / 2, this.canvas.height * doodle.y - doodle.width / 2, 
						doodle.width, doodle.width)
}

OMemePlayer.prototype.animateDoodle = function (doodle, nowInLoop) {
	
	var drawn = false;
	var start = true
	this.context.lineWidth = doodle.width;
	this.context.strokeStyle = doodle.color; 
		
	for (var j = 0; j < doodle.xyt.length; j++) {
	
		if (doodle.xyt[j][2] > nowInLoop){
			break;
		}
	
		if (!drawn || start) {
			drawn = true;
			start = false
			this.context.beginPath();
			this.context.moveTo(doodle.xyt[j][0] * this.canvas.width, 
								doodle.xyt[j][1] * this.canvas.height);
		}
		else {
			if (doodle.xyt[j][0] === -1) {
				start = true
				this.context.stroke();
			}
			else {
				this.context.lineTo(doodle.xyt[j][0] * this.canvas.width, 
								doodle.xyt[j][1] * this.canvas.height);
			}
		}
	}

	if (drawn) {
		this.context.stroke();
	}	
}

OMemePlayer.prototype.updateSoundtrack = function (soundtrack, nowInLoop) {
	
	//todo seek
	if (false && this.seek) {
		soundtrack.i = 0
		for (var i = 0; i < soundtrack.actions.length; i++) {
			if (soundtrack.actions[i].time > nowInLoop) {
				break
			}
			else {
				soundtrack.i = i
			}
		}
	}

	if (this.paused) {
		return
	}

	if (!soundtrack.actions[soundtrack.i]) {
		return 
	}

	let extras = this.layerExtras.get(soundtrack)
	let action = soundtrack.actions[soundtrack.i]
	if (!extras.started) {
		if (action.time <= nowInLoop) {
			extras.started = true
			extras.play()
		}
	} 
	else if (action.time + action.length <= nowInLoop) {
		extras.started = false
		extras.stop()
		soundtrack.i++
	}
}

OMemePlayer.prototype.loadAudio = function (soundtrack, nowInLoop) {

	if (!this.musicPlayer) {
		this.musicSection = new OMGSection()
		this.music = this.musicSection.song
		this.musicPlayer = new OMusicPlayer()
		this.musicPlayer.loadFullSoundSets = true
		this.musicPlayer.prepareSong(this.music)
	}

	let extras = {}
	let sound
	var blankPart = {soundSet: {name: soundtrack.thing.name, data:[soundtrack.thing], defaultSurface: "PRESET_SEQUENCER"}};
	//var names = tg.currentSection.parts.map(section => section.data.name);
	//blankPart.name = omg.util.getUniqueName(soundSet.name, names);
	
	this.musicPlayersToLoad++
	let runOnload = false

	var part = new OMGPart(undefined,blankPart, this.musicSection);
	this.musicPlayer.loadPart(part, undefined, () => {
		
		sound = this.musicPlayer.getSound(part, soundtrack.thing.name)	
		extras.audio = sound.getBuffer()	
		extras.play = () => sound.play()
		extras.stop = () => sound.stop()
		this.onLayerLoaded(soundtrack, extras)

		this.musicPlayersToLoad--
		if (runOnload && this.musicPlayersToLoad === 0 && this.onload) {
			this.onload()	
		}
	})
	runOnload = true

	this.layerExtras.set(soundtrack, extras)
	return extras
}

OMemePlayer.prototype.loadSoundtrack = async function (soundtrack, player) {
	await this.loadMusicContext()
	let extras = {}
	if (player) {
		extras.song = player.song
		extras.musicPlayer = player
	}
	else {
		this.musicPlayersToLoad++
		try {
			let {song, player} = await this.musicContext.load(soundtrack.thing) 
			extras.song = song
			extras.musicPlayer = player
			this.musicPlayersToLoad--
			if (this.musicPlayersToLoad === 0) {
				if (this.onload) this.onload()
			}
		}
		catch (e) {console.error(e)}
	}
	console.log(extras.musicPlayer.song)
	extras.play = () => extras.musicPlayer.play()
	extras.stop = () => extras.musicPlayer.stop()
	this.layerExtras.set(soundtrack, extras)
}

OMemePlayer.prototype.sizeCanvas = function () {
	if (this.meme) {
		this.canvas.width = this.meme.width
		this.canvas.height = this.meme.height
	}
	//var memeRatio = this.width / this.height
	var memeRatio = this.canvas.width / this.canvas.height
	var canvasRatio = this.canvas.clientWidth / this.canvas.clientHeight

	var shouldBe, padding
	if (memeRatio > canvasRatio) {
		shouldBe = this.canvas.clientWidth / memeRatio
		padding = (this.canvas.clientHeight - shouldBe) / 2

		this.canvas.style.paddingTop = padding + "px"
		this.canvas.style.paddingBottom = padding + "px"
		this.canvas.style.paddingLeft = "0px"
		this.canvas.style.paddingRight = "0px"

		this.verticalPadding = padding * 2
		this.horizontalPadding = 0
	}
	else {
		shouldBe = this.canvas.clientHeight * memeRatio
		padding = (this.canvas.clientWidth - shouldBe) / 2

		this.canvas.style.paddingLeft = padding + "px"
		this.canvas.style.paddingRight = padding + "px"
		this.canvas.style.paddingTop = "0px"
		this.canvas.style.paddingBottom = "0px"

		if (!this.config.externalControls) {
			this.controlsCanvas.style.marginLeft = padding + "px"
			this.controlsCanvas.style.width = this.canvas.clientWidth - padding * 2 + "px"
		}
		
		this.verticalPadding = 0
		this.horizontalPadding = padding * 2
	}
}
OMemePlayer.prototype.onLayerLoaded = function (layer, extras) {
	if (this.onlayerloaded) {
		this.onlayerloaded(layer, extras)
	}
}

OMemePlayer.prototype.loadMusicContext = async function () {
	if (!this.musicContext) {
		var o = await import("/apps/music/js/omusic.js")
		this.musicContext = new o.default()
	}
}