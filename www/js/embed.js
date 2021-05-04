
function OMGEmbeddedViewerMEME(viewer) {
    var data = viewer.data
    this.viewMode = viewer.params.viewMode || "full"
    this.viewer = viewer

    this.playerHolder = document.createElement("div")

    this.playerHolder.style.marginLeft = "8px"
    this.playerHolder.style.marginRight = "8px"
    this.playerHolder.style.boxSizing = "border-box"
    this.playerHolder.style.position = "relative"
    this.playerHolder.style.height = "100%"

    viewer.embedDiv.appendChild(this.playerHolder)

    if (viewer.params.maxHeight) {
        viewer.embedDiv.style.height = viewer.params.maxHeight + "px"
    }

    let autoPlay = viewer.params.autoPlay
    for (var i = 0; i < data.layers.length; i++) {
        if (data.layers[i].type === "SOUNDTRACK") {
            autoPlay = false
            break
        }
    }

    import("/apps/meme/js/omeme_player.js").then(o => {
        var OMemePlayer = o.default
        var mp = new OMemePlayer({div: this.playerHolder});
        mp.loadPreview(data)
        
        viewer.player = mp
        this.player = mp

        this.canvas = mp.canvas

        if (data.length && !autoPlay) {
            this.makePlayButton()
        }
        if (data.length && autoPlay) {
            this.player.onload = () => {
                this.player.play()    
                this.playcountUpdate()
            }
            this.player.load(this.viewer.data)
        }
        
    })

}

OMGEmbeddedViewerMEME.prototype.makePlayButton = function () {

    this.playButton = document.createElement("div")
    this.playButton.className = "omg-viewer-play-button"

    var img = document.createElement("img")
    img.src = "/apps/music/img/play-button.svg"
    img.style.height = this.canvas.clientHeight / 2 + "px"
    img.style.marginLeft = this.canvas.clientWidth / 2 - this.canvas.clientHeight / 4 + "px"
    img.style.marginTop = this.canvas.clientHeight / 4 + "px"
    img.style.cursor = "pointer"
    this.playButtonImg = img
    this.playButton.appendChild(img)

    this.playButton.style.opacity = "0.7"
    img.onmouseenter = e => this.playButton.style.opacity = "1"
    img.onmouseleave = e => this.playButton.style.opacity = "0.7"
    
    this.viewer.embedDiv.appendChild(this.playButton)

    this.playButtonImg.onclick = e => this.playButtonClick()
}

OMGEmbeddedViewerMEME.prototype.playButtonClick = function (data) {

    if (!this.player.loaded) {
        this.player.onload = () => {
            this.viewer.embedDiv.removeChild(this.playButton)
            this.playButtonImg.classList.remove("loader")
            this.player.play()    
            this.playcountUpdate()
        }
        this.playButtonImg.classList.add("loader")
        this.player.load(this.viewer.data)
        return
    }

    if (this.player.paused) {
        this.player.play()
        this.playcountUpdate()
        this.playButtonImg.src = ""
    }
    else {
        this.player.stop()
        this.playButtonImg.src = "/apps/music/img/play-button.svg"
    }
}

OMGEmbeddedViewerMEME.prototype.playcountUpdate = function () {
    if (!this.playButtonHasBeenClicked) {
        this.playButtonHasBeenClicked = true;                
        omg.server.postHTTP("/playcount", {id: this.viewer.data.id});
    }
}

