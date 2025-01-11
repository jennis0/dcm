import { log } from "./lib.mjs";
import { getSetting, setSetting, SETTINGS } from "./settings.mjs";


export function getSources(itemtype) {
    return getSetting(SETTINGS[itemtype].sources)
}

export function addSources(itemtype, newSources) {
    const sources = new Set(getSources(itemtype));
    const startSize = sources.size

    newSources.forEach(s => {
        log(`Adding source: ${s} for type: ${itemtype}`)
        sources.add(s)
    })
    setSetting(SETTINGS[itemtype].sources, [...sources])

    if (sources.size != startSize) {
        CONFIG.dndContentManager.forceRebuild = true
    }
}

export function removeSources(itemtype, sourcesToDel) {
    const sources = new Set(getSources(itemtype));
    const startSize = sources.size

    sourcesToDel.forEach(s => {
        log(`Removing source: "${s}" for type: "${itemtype}"`)
        sources.delete(s)
    })
    setSetting(SETTINGS[itemtype].sources, [...sources])

    if (sources.size != startSize) {
        CONFIG.dndContentManager.forceRebuild = true
    }
}