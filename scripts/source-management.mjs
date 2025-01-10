import { removeContentBySource } from "./content-management.mjs";
import { log } from "./lib.mjs";
import { getSetting, setSetting, SETTINGS } from "./settings.mjs";


export function getSources(itemtype) {
    return getSetting(SETTINGS[itemtype].sources)
}

export function addSources(itemtype, newSources) {
    const sources = new Set(getSources(itemtype));
    newSources.forEach(s => {
        log(`Adding source: ${s} for type: ${itemtype}`)
        sources.add(s)
    })
    setSetting(SETTINGS[itemtype].sources, [...sources])
}

export function removeSources(itemtype, sourcesToDel) {
    const sources = new Set(getSources(itemtype));
    
    sourcesToDel.forEach(s => {
        log(`Removing source: "${s}" for type: "${itemtype}"`)
        sources.delete(s)
    })
    setSetting(SETTINGS[itemtype].sources, [...sources])
}