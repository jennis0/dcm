import { log } from "./lib.mjs";
import { getSetting, setSetting, SETTINGS } from "./settings.mjs";


export function getContent(itemtype) {
    return getSetting(SETTINGS[itemtype].content)
}

export function addContent(itemtype, newContent) {
    const content = new Set(getContent(itemtype))
    const startSize = content.size

    newContent.forEach(c => {
        log(`Adding item: ${c} for type: ${itemtype}`)
        content.add(c)
    })
    setSetting(SETTINGS[itemtype].content, [...content])

    if (content.size != startSize) {
        CONFIG.dndContentManager.forceRebuild = true
    }
}

export function removeContent(itemtype, contentToRemove) {
    const content = new Set(getContent(itemtype))
    const startSize = content.size

    contentToRemove.forEach(c => {
        log(`Removing item: ${c} for type: ${itemtype}`)
        content.delete(c)
    })
    setSetting(SETTINGS[itemtype].content, [...content])

    if (content.size != startSize) {
        CONFIG.dndContentManager.forceRebuild = true
    }
}

export function removeContentBySource(itemtype, sourcesToRemove) {
    const content = getContent(itemtype);
    const sourceSet = new Set(sourcesToRemove)
    const startSize = content.size

    const filteredContent = content.filter(
        c => !sourceSet.has(foundry.utils.parseUuid(c).collection.metadata.id)
    )
    
    setSetting(SETTINGS[itemtype].content, filteredContent)
    
    if (content.size != startSize) {
        CONFIG.dndContentManager.forceRebuild = true
    }
}