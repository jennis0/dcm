import { log, mutateSettingSet } from "./lib.mjs";
import { getSetting, setSetting, SETTINGS } from "./settings.mjs";


export function getContent(itemtype) {
    return getSetting(SETTINGS[itemtype].content)
}

export function addContent(itemtype, newContent) {
    mutateSettingSet(SETTINGS[itemtype].content, (set) => {
        newContent.forEach(c => {
            log(`Adding item: ${c} for type: ${itemtype}`)
            set.add(c)
        })
    })
}

export function removeContent(itemtype, contentToRemove) {
    mutateSettingSet(SETTINGS[itemtype].content, (set) => {
        contentToRemove.forEach(c => {
            log(`Removing item: ${c} for type: ${itemtype}`)
            set.delete(c)
        })
    })
}

export function removeContentBySource(itemtype, sourcesToRemove) {
    const content = getContent(itemtype);
    const sourceSet = new Set(sourcesToRemove)
    const startLength = content.length

    const filteredContent = content.filter(
        c => !sourceSet.has(foundry.utils.parseUuid(c).collection.metadata.id)
    )

    setSetting(SETTINGS[itemtype].content, filteredContent)

    if (filteredContent.length != startLength) {
        CONFIG.dndContentManager.forceRebuild = true
    }
}