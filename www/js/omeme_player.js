// 17 June, 2020, I'm grabbing this code from 2015, and here's what I said then:

//===
// this is all pretty ugly, and half implemented
// this code should be refactored, change the global functions to object methods
//// also, the movie.scene thing. It isn't very useful having that second object (scene)
///  and another thing, half this code should be in _editor.js, not _player.js
//===

//So, good luck


//2020 oh my god, it's all public functions

var movie;
var oMemePlayer;

function MemePlayer(config) {

	if (!config.div) {
		console.log("MemePlayer: no config.div?")
		return;		
	}
	
	var div = config.div;
	
	//I don't think this is needed for anything in the constructor
	oMemePlayer = this;
	
	//todo 2020port this.player = new OMusicPlayer();
	
	var sceneCanvas = document.createElement("canvas")
	var controlsCanvas = document.createElement("canvas");
	this.sceneCanvas = sceneCanvas
	this.controlsCanvas = controlsCanvas;
	
	div.appendChild(sceneCanvas);
	div.appendChild(controlsCanvas);
	
	var width, height;
	if (config.backgroundImg) {
		//doing this twice seems to fix a bug, since it returns 0 the first time
		// chrome linux
		width = config.backgroundImg.width;
		width = config.backgroundImg.width;

		height = config.backgroundImg.height;
	}
	else {
		width = 480;
		height = 320;
	}
	
	sceneCanvas.width = width;
	sceneCanvas.style.width = width + "px";
	sceneCanvas.height = height;
	sceneCanvas.style.height = height + "px";
	
	controlsCanvas.style.width = width + "px";
	controlsCanvas.width = width;
	
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

	//var characterCanvas = document.getElementById("character-canvas");
	this.controlsContext = controlsCanvas.getContext("2d");		
	this.sceneContext = sceneCanvas.getContext("2d");
	
	// should try to eliminate dependences on this canvas, but need it
	//characterCanvas = document.createElement("canvas");
	//characterContext = mmkr.characterCanvas.getContext("2d");
	//characterCanvas.width = 150;
	//characterCanvas.height = 200;
	
	//div.appendChild(characterCanvas);
	
	// the html5 movie maker app
	//TODO probably a significant center of refactoring
	movie = getFreshScene(config);

	//todo port2020 movie.currentUser = userStuff();
	
	//	movie.scene.context.lineWidth = 6;
	this.sceneContext.shadowColor = "black";
	this.sceneContext.lineJoin = "round";

	/*if (characterCanvas){
		characterCanvas.getContext("2d").lineWidth = 6;
		characterCanvas.getContext("2d").lineJoin = "round"		
		var tool = new tool_pencil();	
		characterCanvas.addEventListener("mousedown", tool.mousedown, false);
		characterCanvas.addEventListener("mousemove", tool.mousemove, false);
		characterCanvas.addEventListener("mouseup",   tool.mouseup, false);
		characterCanvas.addEventListener("touchstart", tool.touchstart, false);
		characterCanvas.addEventListener("touchmove", tool.touchmove, false);
		characterCanvas.addEventListener("touchend",   tool.touchend, false);
	}*/

/*	movie.tool = new tool_pencil2();	
	sceneCanvas.addEventListener("mouseout", movie.tool.mouseout, false);
	sceneCanvas.addEventListener("mousedown", movie.tool.mousedown, false);
	sceneCanvas.addEventListener("mousemove", movie.tool.mousemove, false);
	sceneCanvas.addEventListener("mouseup",   movie.tool.mouseup, false);
	sceneCanvas.addEventListener("touchstart", movie.tool.touchstart, false);
	sceneCanvas.addEventListener("touchmove", movie.tool.touchmove, false);
	sceneCanvas.addEventListener("touchend",   movie.tool.touchend, false);
*/
	if (controlsCanvas){
		var tool3 = new tool_pencil3();	
		controlsCanvas.addEventListener("mousedown", tool3.mousedown, false);
		controlsCanvas.addEventListener("mousemove", tool3.mousemove, false);
		controlsCanvas.addEventListener("mouseup",   tool3.mouseup, false);
		controlsCanvas.addEventListener("touchstart", tool3.touchstart, false);
		controlsCanvas.addEventListener("touchmove", tool3.touchmove, false);
		controlsCanvas.addEventListener("touchend",   tool3.touchend, false);		
	}

	
	
	animate();
	
}

MemePlayer.prototype.load = function (data, playOnLoad) {


}

MemePlayer.prototype.loadUrl = function (url, playOnLoad) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onreadystatechange =  function () {
		if (xhr.readyState == 4 && xhr.status == 200) {
			oo = JSON.parse(xhr.responseText);
			loadObject(oo);

			if (playOnLoad) {
				if (typeof(playOnLoad) == "function") {
					playOnLoad();
				}
				else {
					playButton();					
				}
			}
		}
	};
	xhr.send();
};



/// this was part of the original moviemaker, not sure what needs 
/// to be done with it, probably fix it
function wasTheOnLoad() {
	
	if (document.getElementById("movie-title")){
		document.getElementById("movie-title").onblur = save;
	}

	movie.speak = window.location.search.search("speak=true") > -1;

	if (typeof myMov != "undefined"){
		loadObject(myMov);
		play();
	}
	else {
		try {
			var search = window.location.search.search("id=");
			if (search > 0){
				movie.loading = true;
				var id = window.location.search.substring(search + 3);
				if (id.search("&") > -1){
					id = id.substring(0, id.search("&"));
				}
				var xhr = new XMLHttpRequest();
				xhr.open("GET", "/a?id=" + id, true);
				xhr.onreadystatechange = function(){
					if (xhr.readyState == 4){
						var json = xhr.responseText;
						if (json != "bad"){
						    if (json.indexOf("%") == 0){
						        json = decodeURIComponent(json);
						    }
							loadString(json);
							movie.id = id;
							playButton();
						}
						else {
							editButton();
						}
						movie.loading = false;
					}
				}
				xhr.send();
			}
			else {
				editButton();
			}
		}
		catch (e) {
			movie.loading = false;
			editButton();
		}
	}

   if (document.getElementById("set-the-scene")){
      document.getElementById("set-the-scene").ondrop = dropSceneBackground;
   }
   if (document.getElementById("characters")){
      document.getElementById("characters").ondrop = dropCharacter;
   }

	animate();
}


function tool_pencil () {
	
	//in htmlmoviemaker, this was drawing characters on a separate canvas
	var canvas = movie.character.canvas;	
	
	var context = canvas.getContext("2d");	
	var tool = this;
	this.started = false;
	this.drawnSegments = 0;
	this.drawnPaths = 0; 

	this.touchstart = function (ev) {
		ev.preventDefault(); 
		x = ev.targetTouches[0].pageX - movie.character.canvasOffsetLeft;
		y = ev.targetTouches[0].pageY - movie.character.canvasOffsetTop;
		tool.start(x, y);
	}
	this.touchmove = function (ev) {
		ev.preventDefault(); 
		x = ev.targetTouches[0].pageX - movie.character.canvasOffsetLeft;
		y = ev.targetTouches[0].pageY - movie.character.canvasOffsetTop;
		tool.move(x, y);
	}
	this.touchend = function (ev) {
		ev.preventDefault(); 
		tool.end();
	}

	this.mousedown = function (ev) {
		ev.preventDefault(); 
		x = ev.pageX - movie.character.canvasOffsetLeft;
		y = ev.pageY - movie.character.canvasOffsetTop;
		tool.start(x, y);
	}
	this.start = function(x, y){
		tool.drawnPaths = movie.character.drawingCharacter.paths.length;
		movie.character.drawingCharacter.paths[tool.drawnPaths] = {color: movie.character.currentColor, 
				pxdata: [[x, y]],
		};

		context.strokeStyle = movie.colors[movie.character.currentColor];
		context.beginPath();
		context.moveTo(x, y);

		tool.started = true;

		tool.drawnSegments = 0;
		tool.drawnSegments++;
	};

	this.mousemove = function (ev) {
		ev.preventDefault(); 
		x = ev.pageX - movie.character.canvasOffsetLeft;
		y = ev.pageY - movie.character.canvasOffsetTop;
		tool.move(x, y);
	}

	this.move = function(x, y){

		if (tool.started) {

			context.lineTo(x, y);
			context.stroke();
			movie.character.drawingCharacter.paths[tool.drawnPaths].pxdata[tool.drawnSegments] = [x, y];
			tool.drawnSegments++;
		}
	};

	this.mouseup = function (ev) {
		ev.preventDefault(); 
		tool.end();
	}

	this.end = function (){
		if (tool.started) {
			context.closePath();	
			tool.started = false;	      
			tool.drawnPaths++;
		}
	};
}



function tool_pencil3 () {
	var canvas = movie.scene.canvas;
	var context = movie.scene.context;	
	var tool = this;
	this.started = 0;
	this.drawnSegments = 0;
	this.looperCounter = 0;

	this.setOffsets = function(){
		var offsets = omg.ui.totalOffsets(movie.scene.canvas);
		movie.scene.canvasOffsetLeft = offsets.left;
		movie.scene.canvasOffseTop = offsets.top;
	}
	
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

	this.mousedown = function (ev) {
		tool.setOffsets();
		x = ev.pageX - movie.scene.canvasOffsetLeft;
		y = ev.pageY - movie.scene.canvasOffsetTop;
		tool.start(x, y);
	}
	this.mousemove = function (ev) {
		x = ev.pageX - movie.scene.canvasOffsetLeft;
		y = ev.pageY - movie.scene.canvasOffsetTop;
		tool.move(x, y);
	}
	this.mouseup = function (ev) {
		ev.preventDefault(); 
		tool.end();
	}

	this.start = function(x, y){
		
		if (x < movie.controls.playButtonWidth){
			tool.started = 1;
		}
		else {
			tool.started = 2;
			tool.wasPaused = movie.scene.paused;
			movie.scene.paused = true;

			var newPosition = x - movie.controls.playButtonWidth;
			newPosition = newPosition / (movie.controls.canvas.clientWidth - (movie.controls.playButtonWidth * 2));
			newPosition = Math.round(newPosition * movie.scene.length);
			movie.scene.started = Date.now() - newPosition;
			movie.scene.position = newPosition;
			movie.updateIs = true;
		}
	};

	this.move = function(x, y){
		if (tool.started == 2){
			var newPosition = x - movie.controls.playButtonWidth;
			newPosition = newPosition / (movie.controls.canvas.clientWidth - (movie.controls.playButtonWidth * 2));
			newPosition = Math.round(newPosition * movie.scene.length);
			movie.scene.started = Date.now() - newPosition;
			movie.scene.position = newPosition;
			movie.updateIs = true;
			movie.scene.soundtrack.fresh = true;
		}
	};

	this.end = function (){
		if (tool.started == 1 && x < movie.controls.playButtonWidth) {
			playButton();
		}
		else if (tool.started == 2){
			movie.scene.soundtrack.fresh = true;
			if (x < movie.controls.playButtonWidth){
				if (!tool.wasPaused){
					movie.scene.paused = false;
				}
			}
			else {
				var newPosition = x - movie.controls.playButtonWidth;
				newPosition = newPosition / (movie.controls.canvas.clientWidth - (movie.controls.playButtonWidth * 2));
				newPosition = Math.round(newPosition * movie.scene.length);
				movie.scene.started = Date.now() - newPosition;
				movie.scene.position = newPosition;
				movie.updateIs = true;
				movie.scene.paused = tool.wasPaused;
			}
		}
		tool.started = 0;

	};
}


function play(){
	for (var ia = 0; ia < movie.character.list.length; ia++){
		if (movie.character.list[ia].actions.length > 0){
			movie.character.list[ia].i = 0;
			movie.character.list[ia].spriteI = 0;
			movie.character.list[ia].currentSprite = 0;
			turnOnSprite(0);
			if (movie.character.list[ia].zoom){
				movie.character.list[ia].zoom = 1;
			}
		}
	}
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


	movie.scene.dialog.showingList = [];
	movie.scene.dialog.i = 0;
	
	movie.scene.started =  Date.now() + movie.preroll;
	movie.scene.paused = false;
	
	movie.scene.hasPlayed = true;
}
function resume(){
	movie.scene.started = Date.now() - movie.scene.position;
	movie.scene.paused = false;
	movie.scene.soundtrack.fresh = true;
}
function pause(){
	movie.scene.paused = true;
}

function animate(){	

	setTheScene();
	var nowInLoop;
	if (movie.scene.paused){
		nowInLoop = movie.scene.position;
	}
	else {
		nowInLoop = Date.now() - movie.scene.started;
		movie.scene.position = nowInLoop;
	}

	if (movie.character.x > -1){
		drawCharacterWithSelection(currentCharacter(), 
			movie.character.x, movie.character.y, movie.scene.context);
	}

	if (movie.scene.dialog.x > -1){
		drawDialog(movie.scene.dialog.text, movie.scene.dialog.x, movie.scene.dialog.y);		
	}

	if (movie.loading){
		drawLoading();
	}
	else if (nowInLoop < 0){
		drawCountIn(Math.abs(nowInLoop/1000));
	}
	else {	
		if (movie.updateIs){
			for (var ic = 0; ic < movie.character.list.length; ic++){
				var char = movie.character.list[ic];
				char.i = 0;
				char.spriteI = 0;
				char.currentSprite = 0;
				if (char.sprites && ic == movie.character.current){
					turnOnSprite(0);
				}
			}
			movie.scene.dialog.showingList = [];
			movie.scene.dialog.i = 0;
			for (var ia = 0; ia < movie.scene.soundtrack.channels.length; ia++){
				movie.scene.soundtrack.channels[ia].i = 0;
			}
			movie.scene.soundtrack.soundI = 0;
			movie.updateIs = false;
		}
		for (var ic = 0; ic < movie.character.list.length; ic++){
			var char = movie.character.list[ic];

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
					&& movie.scene.mode == "CHARACTERS"){
					drawSelection(char, 
						pxdata[char.i][0], pxdata[char.i][1], movie.scene.context);
				}
				drawCharacter(char, 
					pxdata[char.i][0], pxdata[char.i][1], movie.scene.context);
			}
		}
		var dialogs = movie.scene.dialog;
		while (dialogs.i < dialogs.list.length && dialogs.list[dialogs.i].data[0][2] < nowInLoop){
			dialogs.list[dialogs.i].i = 0;
			dialogs.showingList[dialogs.showingList.length] = 
				dialogs.list[dialogs.i];
			if (movie.speak && !movie.scene.paused){
				speak(dialogs.list[dialogs.i].text, { amplitude: 100, wordgap: 0, pitch: 50, speed: 175 })
			}
			dialogs.i++;
		}
		for (var idlg = 0; idlg < dialogs.showingList.length; idlg++){
			var dlg = dialogs.showingList[idlg];
			while (dlg.i+1 < dlg.data.length && dlg.data[dlg.i+1][2] < nowInLoop){
				dlg.i++;
			}
			if (dlg.i < dlg.data.length && dlg.data[dlg.i][0] == -1){
				dialogs.showingList.splice(idlg, 1);
				idlg--;
			}
			else {
				updateDialog(dialogs.showingList[idlg]);	
			}
		}
		
		updateDoodles(nowInLoop);
		
		if (nowInLoop > movie.scene.length){
			if (movie.recordPastPlay){
				movie.scene.length = movie.scene.position;
			}
			else {
				movie.scene.paused = true; 
				if (movie.scene.mode == "VIEW"){
					if (document.getElementById("after-show")){
						document.getElementById("after-show").style.visibility = "visible";
					}
				}
			}
		}
	
		updateVideos(nowInLoop);
	}
	drawControls();

	if (oMemePlayer.player) {
		updateAudioChannels(nowInLoop);
	}
	
	requestAnimFrame(function() {
		animate();
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

function updateDialog(dlg) {
	if (dlg.i < dlg.data.length && dlg.data[dlg.i][0] > -1){
		
		var x = dlg.data[dlg.i][0]; 
		var y = dlg.data[dlg.i][1];
		
		drawDialog(dlg.text, x, y);
	}
}

function drawDialog(text, x, y) {

	var context = movie.scene.context;
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
	var xdiff = movie.scene.canvas.width - (x + w);
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
	
function drawControls(){
	var ctx = movie.controls.context;
	if (!ctx){
		return;
	}
	var playWidth = movie.controls.playButtonWidth;
	var cHeight = movie.controls.canvas.height;
	ctx.shadowBlur = 2;
	ctx.shadowColor = "black";

	ctx.clearRect(0, 0, movie.controls.canvas.width, movie.controls.canvas.height);	
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, movie.controls.playButtonWidth, movie.controls.canvas.height);
	ctx.fillStyle = "black";
	ctx.strokeStyle = "black";
	if (movie.scene.paused){
		ctx.beginPath();
		ctx.moveTo(playWidth * 0.25, movie.controls.canvas.height * 0.25);
		ctx.lineTo(playWidth * 0.25, movie.controls.canvas.height * 0.75);
		ctx.lineTo(playWidth * 0.75, movie.controls.canvas.height * 0.5);
		ctx.closePath();
		ctx.fill();
	}	
	else {
		ctx.fillRect(playWidth * 0.175, cHeight * 0.25, playWidth * 0.25, cHeight * 0.5);
		ctx.fillRect(playWidth * 0.575, cHeight * 0.25, playWidth * 0.25, cHeight * 0.5);	
	}

	var newPosition = movie.controls.canvas.clientWidth - (movie.controls.playButtonWidth * 2);
	newPosition = newPosition * (movie.scene.position / movie.scene.length);
	newPosition += movie.controls.playButtonWidth;
	newPosition = Math.min(newPosition, movie.controls.canvas.width - movie.controls.playButtonWidth);
	if (newPosition > playWidth){
		ctx.shadowBlur = 10;
		ctx.fillStyle = "yellow";
		ctx.fillRect(newPosition, 0, movie.controls.playButtonWidth, movie.controls.canvas.height);
		ctx.strokeRect(newPosition, 0, movie.controls.playButtonWidth, movie.controls.canvas.height);
	}
}

function addCharacter(template){
	turnOffCharacters();
	var ic = movie.character.list.length;
	if (template){
		movie.character.list[ic] = template;
		if (!template.actions){
			template.actions = [];
		}
	}
	else {
		movie.character.list[ic] = movie.character.drawingCharacter;
	}
	movie.character.list[ic].i = 0;
	movie.character.current = ic;
	clearCharacterCanvas();
	if (document.getElementById("draw-characters")){
		document.getElementById("draw-characters").style.visibility = "hidden";		
	}
	var newCanvas = makeCharacterButton(ic);
	if (newCanvas){
		drawCharacter(movie.character.list[ic], 
				newCanvas.width / 2, newCanvas.height, newCanvas.getContext("2d"));		
	}

	loadSprites(movie.character.current);
	
}
function addCharacterFromFile(template, callback, errorCallback){
	var img = new Image();
	var src;
	if (template){
		if (template.src){
			src = template.src;			
			if (!template.actions){
				template.actions = [];
			}
			if (!template.spriteI){
				template.spriteI = 0;
			}
			if (!template.spriteChanges)
				template.spriteChanges = [];
		}
		else {
			src = template;
		}
	}

	turnOffCharacters();
	clearSprites();
	var charI = movie.character.list.length;
	movie.character.current = charI;
	movie.character.list[charI] = 
		{sprites: [], currentSprite:0, spriteI:0, spriteChanges: [],
			i:0, actions:[],
			centerX: 0, 
			centerY: 0,
			"src":src};
	

	img.onerror = function(){
		if (errorCallback)
			errorCallback();
	};
	img.onload = function(){
		if (movie.scene.mode == "CHARACTERS"){
			//TODO document.getElementById("sprites").style.display = "block";	
		}		

		movie.character.list[charI].sprites = [img];
		movie.character.list[charI].centerX = img.width / 2; 
		movie.character.list[charI].centerY = img.height / 2;

		loadSprite(charI, 0);
		turnOnSprite(0);
		
		if (template && template.src){
			movie.character.list[charI].spriteChanges = template.spriteChanges;
			movie.character.list[charI].actions = template.actions;
		}

	
		var srcSearch = src.search("_1");
		if (srcSearch > 0){
			var getNextSprite = function(nextSprite){
				var src2  = src.substr(0, srcSearch) + "_" + nextSprite + ".png";
				var img2 = new Image();
				img2.src = src2;
				img2.onload = function(){
					movie.character.list[charI].sprites[nextSprite - 1] = img2;
					loadSprite(charI, nextSprite - 1);

					getNextSprite(nextSprite + 1);
				};
			};
			getNextSprite(2);
		}
		
		if (callback)
			callback(movie.character.list[charI]);
		
	};

	img.src = src;
	
	return movie.character.list[charI];
}

function addLarry(){
	addCharacterFromFile("img/larry/l_1.png");
	setTheScene();
}

function addDinos(){
	addCharacterFromFile("img/dino/car.png");
	addCharacterFromFile("img/dino/trex_1.png");
	setTheScene();
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
		for (var ic = 0; ic < movie.character.list.length; ic++){
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

function recallCharacter(character){
	for (var ic = 0; ic < movie.character.list.length; ic++){
		if (movie.character.list[ic] == character) {
			movie.character.current = ic;
			loadSprites(ic);
			return;
		}  
	}
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

	if (!movie.character.list[n].sprites){
		return;
	}
	for (var is = 0; is < movie.character.list[n].sprites.length; is++){
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
			movie.character.list[char].sprites[isprite], 0, 0);
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

function setTheScene(){
	if (movie.scene.backdrop){
		movie.scene.context.drawImage(movie.scene.backdrop, 0, 0, 
				movie.scene.canvas.width, movie.scene.canvas.height);
	}
	else {
		/*try {
			eval(document.getElementById("scene-script").value);
		}
		catch (e) {
		}*/
		movie.scene.canvas.width = movie.scene.canvas.width;
		movie.scene.context.filleStyle = "#000000";
		movie.scene.context.fillRect(0, 0, 
				600, movie.scene.canvas.height);
	}
}

function drawCharacterWithSelection(){

	if (currentCharacter()){
		var char = currentCharacter();
		drawCharacter(char, 
			movie.character.x, movie.character.y, movie.scene.context);		

		if (char.sprites){
			movie.scene.context.lineWidth = 1;
			movie.scene.context.strokeStyle = "black";
			movie.scene.context.strokeRect(movie.character.x - char.centerX, 
					movie.character.y - char.centerY, 
				char.centerX * 2, char.centerY * 2);
		}
		else {

		}
	}
}

function drawSelection(char, x, y, context) {
	if (char.sprites && char.sprites[char.currentSprite]){

		var img = char.sprites[char.currentSprite];
		context.lineWidth = 1;
		context.strokeStyle = "black";
		context.strokeRect(x - img.width/2, y - img.height/2, 
			img.width, img.height);
	}
}

function drawCharacter(char, x, y, context){
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
	else {
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

function drawCountIn(n){
	movie.scene.context.font = "bold 18pt Arial Black";
	movie.scene.context.shadowColor = "black";
	movie.scene.context.shadowBlur = 10;
	movie.scene.context.fillStyle = "black";
	movie.scene.context.fillRect(0, 0, 75, 75);
	movie.scene.context.fillStyle = "grey";
	movie.scene.context.fillRect(0, 0, 75 * (Math.ceil(n) - n), 75);
	movie.scene.context.fillStyle = "white";
	movie.scene.context.fillText( Math.ceil(n), 30, 50);
	movie.scene.context.shadowBlur = 0;
}

function drawLoading(){
	var n = 0;
	movie.scene.context.font = "bold 18pt Arial Black";
	movie.scene.context.shadowColor = "black";
	movie.scene.context.shadowBlur = 10;
	movie.scene.context.fillStyle = "white";
	movie.scene.context.fillRect(0, 0, movie.scene.canvas.width, movie.scene.canvas.height);
	//movie.scene.context.fillStyle = "grey";
	//movie.scene.context.fillRect(0, 0, 75 * (Math.ceil(n) - n), 75);
	movie.scene.context.fillStyle = "black";
	movie.scene.context.fillText("Loading...", 30, 50);
	movie.scene.context.shadowBlur = 0;
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

window.requestAnimFrame = (function(callback) {
	return window.requestAnimationFrame || 
	window.webkitRequestAnimationFrame || 
	window.mozRequestAnimationFrame || 
	window.oRequestAnimationFrame || 
	window.msRequestAnimationFrame || 
	function(callback) {
		window.setTimeout(callback, 1000 / 60);
	};
})();

function clearActions(){
	movie.scene.animating = false;
	movie.scene.length = 0;
	for (var ic = 0; ic < movie.character.list.length; ic++){
		movie.character.list[ic].actions = [];
	}
	setTheScene();
}

function undoCharacterCanvas(){
	var char = movie.character.list[movie.character.current];
	if (char.paths.length > 0){
		char.paths = char.paths.slice(0, char.paths.length - 1);
		var ctx = movie.character.canvas.getContext("2d");
		ctx.clearRect(0, 0, movie.character.canvas.width, movie.character.canvas.height);
		drawCharacter(currentCharacter(), movie.character.centerX, movie.character.centerY, ctx);
	}
}
function currentCharacter(){
	return movie.character.list[movie.character.current];
}

function getTheCode(){
	document.getElementById("movie-script").value = getJSON();
}

function getJSON (){
	var mov = {
			type: "MEME",
			name: "", //document.getElementById("movie-title").value,
			length: movie.scene.length, characters: [], 
			//scene: document.getElementById("scene-script").value,
			dialog: movie.scene.dialog};
	if (movie.scene.backdrop){
		mov.backdrop = movie.scene.backdrop.src; //movie.scene.backdropSource;
	}
	for (var ic = 0; ic < movie.character.list.length; ic++){
		mov.characters[ic] = {actions: movie.character.list[ic].actions,
			spriteChanges: movie.character.list[ic].spriteChanges,
			src: movie.character.list[ic].src,
			paths: movie.character.list[ic].paths};
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



function loadString(s){
	var mov = JSON.parse(s);
	loadObject(mov);
}

MemePlayer.prototype.loadObject = function(mov){
	//var mode = movie.scene.mode;
	movie = getFreshScene();
	movie.scene.title = mov.title ? mov.title : "";
	if (document.getElementById("movie-title"))
		document.getElementById("movie-title").value = movie.scene.title;
	//movie.scene.mode = mode;
	movie.scene.length = mov.length;
	
	if (typeof (mov.preroll) == "number") {
		movie.preroll = mov.preroll;
	}
	//movie.scene.position = mov.length;
	movie.scene.position = 0;
	movie.character.list = [];
	clearLists();
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
		if (mov.characters[ic].src){
			addCharacterFromFile(mov.characters[ic]);
		}
		else {
			addCharacter(mov.characters[ic]);
		}
	}
	if (!document.getElementById("scene-script")){
		var ta = document.createElement("textarea");
		ta.id = "scene-script";
		ta.style.display = "none";
		document.body.appendChild(ta);
	}
	document.getElementById("scene-script").value = mov.scene;
	if (mov.backdrop){
		addBackdrop(mov.backdrop);
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

function charactersButton(){
	movie.scene.mode = "CHARACTERS";
	turnOffButtons();
	document.getElementById("characters-button").style.backgroundColor = "white";
	document.getElementById("characters").style.display = "block";
	if (currentCharacter()){
		document.getElementById("sprites").style.display = "block";
	}
}
function setTheSceneButton(){
	movie.scene.mode = "SCENE";
	turnOffButtons();
	document.getElementById("set-the-scene-button").style.backgroundColor = "white";
	document.getElementById("set-the-scene").style.display = "block";
}
function dialogButton(){
	movie.scene.mode = "DIALOG";
	turnOffButtons();
	document.getElementById("dialog-button").style.backgroundColor = "white";
	document.getElementById("dialog").style.display = "block";
}
function soundtrackButton(){
	movie.scene.mode = "SOUNDTRACK";
	turnOffButtons();
	document.getElementById("soundtrack-button").style.backgroundColor = "white";
	document.getElementById("soundtrack").style.display = "block";
	if (!movie.audio){
		document.getElementById("no-web-audio").style.display = "block";
		document.getElementById("soundtrack-instructions").style.display = "none";
	}
}
function videoButton(){
	movie.scene.mode = "VIDEO";
	turnOffButtons();
	document.getElementById("video-button").style.backgroundColor = "white";
	document.getElementById("video").style.display = "block";
}
function shareButton(){
	movie.scene.mode = "SHARE";
	turnOffButtons();
	document.getElementById("share-button").style.backgroundColor = "white";
	document.getElementById("share").style.display = "block";
	save();
}
function turnOffButtons() {
	document.getElementById("characters-button").style.backgroundColor = "#DEDEDE";
	document.getElementById("set-the-scene-button").style.backgroundColor = "#DEDEDE";
	document.getElementById("dialog-button").style.backgroundColor = "#DEDEDE";
	document.getElementById("share-button").style.backgroundColor = "#DEDEDE";
	document.getElementById("soundtrack-button").style.backgroundColor = "#DEDEDE";
	document.getElementById("video-button").style.backgroundColor = "#DEDEDE";

	document.getElementById("characters").style.display = "none";
	document.getElementById("set-the-scene").style.display = "none";
	document.getElementById("dialog").style.display = "none";
	document.getElementById("soundtrack").style.display = "none";
	document.getElementById("video").style.display = "none";
	document.getElementById("share").style.display = "none";
}

function showDrawCharactersButton(){
	document.getElementById("draw-characters").style.visibility="visible";
}

function playButton(){
	movie.scene.soundtrack.fresh = true;
	if (!movie.scene.paused){
		pause();
	}
	else {
		//TODO commented this out
		//document.getElementById("after-show").style.visibility = "hidden";
		
		if (movie.scene.hasPlayed && movie.scene.position < movie.scene.length){
			resume();
		}
		else {
			play();
		}
	}
}

function save(){

	var json = getJSON();

	document.getElementById("get-json").value = json;
	document.getElementById("embed-json").value = "<script>\nmyMov = " + json + 
			"</script>\n<script src='html5moviemaker.js'></script>" + 
			"<canvas height='400' width='800' id='scene-canvas'></canvas>";
		
	if (movie.changed){
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "/a", true);
		xhr.onreadystatechange = function(){
			if (xhr.readyState == 4){

				var id = xhr.responseText;
				if (id != "bad"){
					document.getElementById("new-animation-share").value = "http://yougotadoodle.appspot.com/moviemaker.htm?id=" + id;
					movie.id = id;
				}
			}
		}
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		
		var params = "json=" + encodeURIComponent(json) + "&userid=" + movie.currentUser;
		if (movie.id != -1){
			params += "&id=" + movie.id;
		}
		xhr.send(params);
		
	}
}

function addBackdrop(filename, callback, errorCallback){
	var backdrop = filename;
	if (!filename){
		backdrop = document.getElementById("backdrop-file").value;
	} 
	var img = new Image();

	img.onload = function(){
		movie.scene.backdrop = img;
		movie.scene.backdropSource = backdrop;
		
		var width = img.width;
		width = img.width;

		var height = img.height;
		//mmkr.sceneCanvas.width = width;
		//mmkr.sceneCanvas.style.width = width + "px";
		//mmkr.sceneCanvas.height = height;
		//mmkr.sceneCanvas.style.height = height + "px";
		
		//mmkr.controlsCanvas.style.width = width + "px";
		//mmkr.controlsCanvas.width = width;
	
		setTheScene();
		
		if (callback)
			callback();
	};
	img.onerror = function () {
		if (errorCallback)
			errorCallback();
	};
	
	img.src = backdrop;
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

function editButton(){
	movie.id = -1;
	document.getElementById("toolbar").style.display = "block";
	document.getElementById("area1").style.display = "block";
	if (currentCharacter()){
		document.getElementById("sprites").style.display = "block";
	}
	movie.scene.mode = "CHARACTERS";
	document.getElementById("after-show").style.visibility = "hidden";
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
  movie.scene.soundtrack.fresh = true;
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

function load(){
	loadString(document.getElementById('load-json').value);
	setTimeout(function() {play(); }, 400);
}

function facebookButton(){
	share('http://www.facebook.com/sharer/sharer.php?t=YouGotADoodle&u=http%3A%2F%2Fyougotadoodle.appspot.com%2Fmoviemaker.htm');
}
function twitterButton(){
	share( "http://twitter.com/home?status=http%3A%2F%2Fyougotadoodle.appspot.com%2Fmoviemaker.htm");
}
function emailButton(){
	var url = 'mailto:?subject=You Got A Moving Music Doodle!&body=http://yougotadoodle.appspot.com/moviemaker.htm';
	share(url);
}
function share(url){
	
	if (movie.scene.length == 0 || movie.id == 0){
		//url = ;
		window.location = url; 

	}
	else {
		url = url + '%3Fid%3D' + movie.id ;
		//var newWindow = window.open(url, "share"); 
		window.location = url; 
	}
}


function getCookie(c_name)
{
var i,x,y,ARRcookies=document.cookie.split(";");
for (i=0;i<ARRcookies.length;i++)
{
  x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
  y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
  x=x.replace(/^\s+|\s+$/g,"");
  if (x==c_name)
    {
    return unescape(y);
    }
  }
}

function userStuff(){
   var userid = getCookie("userid");
   if (userid !=null && userid !=""){
	   //open last movie?
	   return userid;
   }
   else {
	   try{
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "/ahelp", true);
		xhr.onreadystatechange = function(){
			if (xhr.readyState == 4){
				var id = xhr.responseText;
				if (id != "bad"){
				    setCookie("userid", id, 365);
					userid = id;
				}
			}
		}
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		var json = "{}"; 
		var params = "type=User&json=" + encodeURIComponent(json);
		xhr.send(params);
	   }
	   catch (excp) {}
   }
   return userid;
}

function setCookie(c_name,value,exdays)
{
var exdate=new Date();
exdate.setDate(exdate.getDate() + exdays);
var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
document.cookie=c_name + "=" + c_value;
}

function getFreshScene(config) {
	var mmkr = oMemePlayer;
	var characterCanvas = mmkr.characterCanvas;
	var sceneCanvas = mmkr.sceneCanvas;
	var controlsCanvas = mmkr.controlsCanvas;
	var soundImage = document.getElementById("sound-image");
	var userid = (movie && movie.currentUser) ? movie.currentUser : -1;
	var mov = {id: -1,
			currentUser: userid,
			changed: true,
			loading: false,
			preroll: 3000,
			colors: ["#FFFFFF", "#808080", "#FF0000", "#FFFF00", 
	              "#00FF00", "#00FFFF", "#0000FF", "#800080"],
			instruments: ["#FFFFFF", "#FF0000", "#FFFF00", "#00FF00", "#0000FF", 
			      "#FF8000", "#9E9E9E", "#00FFFF", "#800080", "#632DFF", "#63FF08"],
			controls: {playButtonWidth: 40, 
				  canvas: controlsCanvas,
				  context: controlsCanvas.getContext("2d")},
			scene: {title: "",
			  datetime: Date.now(),	
			  length: 0,
			  position: 0,
			  dialog: {list: [], showingList: [], i: 0},
			  soundtrack: {sounds: [], soundAudios: [], playingSounds: [], 
			    currentSound: -1, soundI: 0, playList: [],
			    currentColor: 0, channels: [], fresh: true,
			    image: soundImage},
			  video: {list: [], elements: [], playing: [], playList: [], current: -1, i: 0},
			  doodles: {list: [], currentColor: 0},
			  paused: true,
			  mode: "VIEW",
			  canvas: sceneCanvas, 
			  context: sceneCanvas.getContext("2d"),
	  		  canvasOffsetLeft: sceneCanvas.offsetLeft +
	  		  		sceneCanvas.parentElement.offsetLeft +
	  		  		sceneCanvas.parentElement.parentElement.offsetLeft,
			  canvasOffsetTop: sceneCanvas.offsetTop +
			  		sceneCanvas.parentElement.offsetTop + 
			  		sceneCanvas.parentElement.parentElement.offsetTop
			},
			character: {current: -1,
			  list: [], 
			  currentColor: 0,
			  drawingCharacter: {paths: [], actions: []},
			  x: -1, y: -1, 
			  /*canvas: characterCanvas,
			  centerX: characterCanvas.clientWidth/2,
			  centerY: characterCanvas.clientHeight/2,
			  canvasOffsetLeft: characterCanvas.parentElement.parentElement.offsetLeft +
		  			characterCanvas.parentElement.offsetLeft +
		  			characterCanvas.offsetLeft, 
			  canvasOffsetTop: characterCanvas.parentElement.parentElement.offsetTop +
			  		characterCanvas.parentElement.offsetTop +
			  		characterCanvas.offsetTop */
			}
		};
	
	try {
		var acontext = new webkitAudioContext();
		mov.audio = {context: acontext, channels: [],
			ascale: [0,2,4,5,7,9,11], octaves:4, base:36};

		mov.hasAudio = true;
	}
	catch(e) {
	}

	if (config && config.backgroundImg) {
		//Two?
		mov.backgroundImg = config.backgroundImg,
		mov.scene.backdrop = config.backgroundImg;
	
	}
	
	return mov;
}

function newProject(){
	var mode = movie.scene.mode;
	movie = getFreshScene();
	clearLists();
	movie.scene.mode = mode;
}

function clearLists(){
	//if (document.getElementById("character-list"))
	//	document.getElementById("character-list").innerHTML = "";

	//document.getElementById("get-json").value = "";
	//document.getElementById("embed-json").value = "";
	//document.getElementById("new-animation-share").value = "";

}

function openProject(){
	   //try{
				var xhr = new XMLHttpRequest();
			xhr.open("GET", "/ahelp?type=Animations&userid=" + movie.currentUser, true);
			xhr.onreadystatechange = function(){
				if (xhr.readyState == 4){
					var resp = xhr.responseText;
					if (resp != "bad"){
						document.getElementById("dialog-title").innerHTML = "Open a Saved Project";
						var dialog = document.getElementById("chooser-dialog");
						var list = document.getElementById("chooser-dialog-list");
						list.innerHTML = "";
						var movies = JSON.parse(resp);
						for (var i = 0; i < movies.length; i++){
							var newDiv = document.createElement("div");
							newDiv.className = "saved-project";
							newDiv.innerHTML = movies[i].title + 
								   "<br/>ID: " + movies[i].id;
							var obj = movies[i].o;
							newDiv.onclick = (function (obj, id) {
									return function() {
										loadObject(obj);
										movie.id = id; 
										dialog.style.display = "none";
										playButton();
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
	
	//document.getElementById("dialog-chooser")
	
}

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

function about() {
	window.location = "http://monadpad.com";
}

function updateDoodles(nowInLoop) {

	var ctx = movie.scene.context;
	
	var doodles = movie.scene.doodles;

	var drawn;
	var data;
	var j;
	for (var i = 0; i < doodles.list.length; i++) {
		
		drawn = false;
		ctx.lineWidth = doodles.list[i].width;
		data = doodles.list[i].data;
		for (j = 1; j < data.length; j++) {
			
			if (data[j][2] > nowInLoop){
				break;
			}
		
			if (!drawn) {
				ctx.beginPath();
				drawn = true;
			}

			ctx.moveTo(data[j - 1][0], data[j - 1][1]);
			ctx.lineTo(data[j][0], data[j][1]);
		}

		if (drawn) {
			ctx.closePath();
			ctx.strokeStyle = movie.colors[doodles.list[i].color]; 
			ctx.stroke();
		}

	}	
	
}