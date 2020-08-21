if (typeof omg === "object" && omg.types) {
    if (omg.types["MEME"]) {
        omg.types["MEME"].embedClass = OMGEmbeddedViewerMEME
    }
}

function OMGEmbeddedViewerMEME(viewer) {
    var data = viewer.data
    this.viewMode = viewer.params.viewMode || "full"
    this.div = document.createElement("div")
    this.div.className = "omg-thing-p"
    this.textDiv = document.createElement("div")

    viewer.embedDiv.style.paddingLeft = "8px"
    viewer.embedDiv.style.paddingRight = "8px"
    
    if (viewer.params.maxHeight) {
        viewer.embedDiv.style.height = viewer.params.maxHeight + "px"
    }

    let scripts = ["/apps/meme/js/omeme_player.js"]
    
    for (var i = 0; i < data.layers.length; i++) {
        if (data.layers[i].type === "SOUNDTRACK") {
            scripts.push("/apps/music/js/omgclasses.js")
            scripts.push("/apps/music/js/omusic_player.js")
            scripts.push("/apps/music/js/omgservice_music.js")
            scripts.push("/apps/music/js/fx.js")
            scripts.push("/apps/music/js/libs/tuna-min.js")
            scripts.push("/apps/music/js/libs/viktor/viktor.js")
            break
        }
    }

    omg.util.loadScripts(scripts, () => {
        var mp = new OMemePlayer({div: viewer.embedDiv});
        mp.load(data)

        viewer.memePlayer = mp
        
    })

}
