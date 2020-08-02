function OMGDragDropHelper() {
}

OMGDragDropHelper.prototype.








dndContext.onmove = (x, y) => {

    if (dndContext.highlightedDiv) {
        dndContext.highlightedDiv.style.borderBottom = "initial"
    }

    if (!dndContext.draggingDiv) {
        return
    }

    if (Math.abs(x - dndContext.startedX) > dndContext.dX) {
        dndContext.dX = Math.abs(x - dndContext.startedX)
    }
    if (Math.abs(y - dndContext.startedY) > dndContext.dY) {
        dndContext.dY = Math.abs(y - dndContext.startedY)
    }

    dndContext.draggingDiv.style.left = x - dndContext.draggingDiv.clientWidth / 2 - 10 + "px"
    dndContext.draggingDiv.style.top = y - dndContext.draggingDiv.clientHeight / 2 - 10 + "px"

    if (dndContext.dX < 10 && dndContext.dY < 10) {
        return
    }
    
    for (let i = allsets.length - 1; i >= 0; i--) {
        
        if (x > setDivs[i].offsetLeft && x < setDivs[i].offsetLeft + setDivs[i].clientWidth) {
            setDivs[i].style.border =  "1px solid #009900"
            dndContext.currentSet = i
            dndContext.currentSetDiv = setDivs[i]
            
            let searching = true
            for (let j = allsets[i].length; j >= 0; j--) {
                if (searching && 
                            (y > setDivs[i].children[j].offsetTop + 
                                setDivs[i].children[j].clientHeight -
                                setDivs[i].scrollTop
                            || j === 0)) {
                    dndContext.highlightedDiv = setDivs[i].children[j]

                    dndContext.highlightedDiv.style.borderBottom = "30px solid #008800"
                    
                    if (j > allsets[i].length - 2 && setDivs[i].scrollHeight > setDivs[i].clientHeight) {
                        setDivs[i].scrollTop = setDivs[i].scrollHeight
                    }
                        
                    searching = false

                    dndContext.currentSong = j - 1
                }
                else {
                    setDivs[i].children[j].style.borderBottom = "initial"
                }
            }
        }
        else {
            setDivs[i].style.border = "1px solid transparent"
        }
    }
    
}


dndContext.onend = (x, y) => {

    if (!dndContext.draggingDiv) {
        return 
    }

    dndContext.screenDiv.removeChild(dndContext.draggingDiv)

    dndContext.screenDiv.style.display = "none"
    
    if (typeof dndContext.currentSet === "number") {
        let sourceI = dndContext.sourceSet.indexOf(dndContext.thing)
        
        if (sourceI === -1) {
            allsets[dndContext.currentSet].splice(dndContext.currentSong + 1, 0, dndContext.thing)    
        }
        else if (dndContext.sourceSet !== allsets[dndContext.currentSet]) {
            dndContext.sourceSet.splice(sourceI, 1)
            allsets[dndContext.currentSet].splice(dndContext.currentSong + 1, 0, dndContext.thing)    
        }
        else if (sourceI === dndContext.currentSong) {
            //we're good
        }
        else if (sourceI < dndContext.currentSong) {
            allsets[dndContext.currentSet].splice(dndContext.currentSong + 1, 0, dndContext.thing)
            dndContext.sourceSet.splice(sourceI, 1)
        }
        else {
            dndContext.sourceSet.splice(sourceI, 1)
            allsets[dndContext.currentSet].splice(dndContext.currentSong + 1, 0, dndContext.thing)            
        }

        drawBPMGraphs()
        
        dndContext.draggingDiv.style.position = "initial"
        
        if (dndContext.highlightedDiv) {
            dndContext.highlightedDiv.style.borderBottom = "initial"
            dndContext.currentSetDiv.insertBefore(dndContext.draggingDiv, dndContext.highlightedDiv.nextSibling)
        }
        else {
            dndContext.currentSetDiv.appendChild(dndContext.draggingDiv)
        }
        dndContext.draggingDiv.style.backgroundColor = "#008800"
        
        let draggedDiv = dndContext.draggingDiv
        let oldDiv = dndContext.div
        setTimeout(() => {
            draggedDiv.style.backgroundColor = null
            oldDiv.parentElement.removeChild(oldDiv)
        }, 250)
        
        makeDraggable(dndContext.draggingDiv, dndContext.thing, allsets[dndContext.currentSet])

        dndContext.currentSetDiv.style.border = "1px solid transparent"
        dndContext.currentSet = undefined
        dndContext.currentSetDiv = undefined
        dndContext.highlightedDiv == undefined
        
    }
    else {
        dndContext.div.style.opacity = 1
    }

    dndContext.startedAt = 0
    dndContext.draggingDiv = undefined
}

