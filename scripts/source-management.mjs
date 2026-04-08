import { log } from "./lib.mjs";
import { getSetting, setSetting, SETTINGS } from "./settings.mjs";


/**
 * Retrieves the sources configuration for a given item type.
 *
 * @param {string} itemtype - The type of item for which to retrieve sources.
 * @returns {*} The sources setting associated with the specified item type.
 */
export function getSources(itemtype) {
    return getSetting(SETTINGS[itemtype].sources)
}


/**
 * Adds new sources to the specified item type and updates related settings.
 *
 * - Merges new sources with existing ones for the given item type.
 * - Updates the sources setting and, if applicable, merges previously selected content from the new sources into the current content selection.
 * - Triggers a rebuild if the set of sources has changed.
 *
 * @param {string} itemtype - The type of item to which sources are being added.
 * @param {string[]} newSources - An array of new source identifiers to add.
 */
export function addSources(itemtype, newSources) {
    const sources = new Set(getSources(itemtype));
    const startSize = sources.size

    newSources.forEach(s => {
        log(`Adding source: ${s} for type: ${itemtype}`)
        sources.add(s)
    })
    setSetting(SETTINGS[itemtype].sources, [...sources])

    const previousContentSelections = getSetting(SETTINGS[itemtype].previousContentSelections)
    const items = newSources.map(s => previousContentSelections[s] ?? []).flat()
    if (items.length > 0) {
        const selectedContent = getSetting(SETTINGS[itemtype].content).concat(items)
        setSetting(SETTINGS[itemtype].content, [...new Set(selectedContent)])
    }

    if (sources.size != startSize) {
        CONFIG.dndContentManager.forceRebuild = true
    }
}

/**
 * Removes specified sources and their associated content for a given item type.
 *
 * @param {string} itemtype - The type of item whose sources are being managed.
 * @param {string[]} sourcesToDel - An array of source identifiers to remove.
 *
 * This function:
 * - Removes the specified sources from the list of available sources.
 * - Removes content entries associated with the deleted sources.
 * - Stores deleted content in a "previousContentSelections" setting for potential recovery.
 * - Updates the relevant settings for sources and content.
 * - Sets a flag to force a rebuild if sources were actually removed.
 */
export function removeSources(itemtype, sourcesToDel) {
    const sources = new Set(getSources(itemtype));
    const startSize = sources.size

    const deletedContent = Object.fromEntries(sourcesToDel.map(s => [s, []]))
    const preservedContent = [];
    const content = getSetting(SETTINGS[itemtype].content)

    const sourcesToDelSet = new Set(sourcesToDel)
    content.forEach(c => {
        const sourceId = foundry.utils.parseUuid(c).collection?.metadata?.id
        if (sourceId && sourcesToDelSet.has(sourceId)) {
            deletedContent[sourceId].push(c);
        } else {
            preservedContent.push(c);
        }
    })

    sourcesToDel.forEach(s => {
        log(`Removing source: "${s}" for type: "${itemtype}"`)
        sources.delete(s)
    })

    let previousContentSelections = getSetting(SETTINGS[itemtype].previousContentSelections)
    previousContentSelections = {...previousContentSelections, ...deletedContent}

    setSetting(SETTINGS[itemtype].sources, [...sources])
    setSetting(SETTINGS[itemtype].previousContentSelections, previousContentSelections)
    setSetting(SETTINGS[itemtype].content, preservedContent)

    if (sources.size != startSize) {
        CONFIG.dndContentManager.forceRebuild = true
    }
}