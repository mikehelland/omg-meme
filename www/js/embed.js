if (typeof omg === "object" && omg.types) {
    if (omg.types["MEME"]) {
        omg.types["MEME"].embedClass = OMGEmbeddedViewerMEME
    }
}

function OMGEmbeddedViewerMEME(viewer) {
    var data = viewer.data
    var parentDiv = viewer.embedDiv
    this.viewMode = viewer.params.viewMode || "full"
    this.div = document.createElement("div")
    this.div.className = "omg-thing-p"
    this.textDiv = document.createElement("div")
    this.div.appendChild(this.textDiv)
    parentDiv.appendChild(this.div)

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
        var mp = new OMemePlayer({div: this.div});
        mp.load(data)
    })

}

OMGEmbeddedViewerMEME.prototype.markdown = function (input) {
    if (!this.converter) {
        this.converter = new showdown.Converter()
        this.converter.setOption('simplifiedAutoLink', 'value');
        this.converter.setOption('openLinksInNewWindow', true);
    }

    this.textDiv.innerHTML = this.converter.makeHtml(input);
}

OMGEmbeddedViewerMEME.prototype.makeAttachments = function (attachments) {
    var otherCount = 0
    if (attachments && attachments.length > 0) {
        var otherAttachments = document.createElement("div")
        otherAttachments.innerHTML = "Attachments:"
        
        for (var i = 0; i < attachments.length; i++) {
            var attachment = attachments[i]
            var type = attachment.mimeType.split("/")[0]

            var res = this.makeAttachment(attachment, type)
            if (res.other) {
                otherAttachments.appendChild(res.div)
                otherCount++
            }
        }

        if (otherCount > 0) {
            this.div.appendChild(otherAttachments)
        }
    }
}

OMGEmbeddedViewerMEME.prototype.makeAttachment = function(attachment, type) {
    var attachmentDiv
    var other = false
    if (type === "image") {
        attachmentDiv = document.createElement("img")
    }
    else if (type === "audio") {
        var link = document.createElement("a")
        link.innerHTML = attachment.name
        this.div.appendChild(link)
        attachmentDiv = document.createElement(type)
        attachmentDiv.controls = true
    }
    else if (type === "video") {
        attachmentDiv = document.createElement(type)
        attachmentDiv.controls = true
    }
    else {
        attachmentDiv = document.createElement("a")
        attachmentDiv.innerHTML = attachment.name
        attachmentDiv.className = "omg-viewer-attachment"
        attachmentDiv.classList.add("omg-thing-p")
        attachmentDiv.target = "_out"
        attachmentDiv.href = attachment.url
        other = true
    }

    if (!other) {
        attachmentDiv.src = attachment.url
        attachmentDiv.className = "omg-viewer-attachment-" + type
        this.div.appendChild(attachmentDiv)
    }

    return {div: attachmentDiv, other: other}
}

    
