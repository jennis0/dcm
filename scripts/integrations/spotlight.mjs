import { log } from "../lib.mjs";
import { getSetting, SETTINGS } from "../settings.mjs";

//Create mapping from item subtypes to indexes
function _constructFilterIndex() {
    const filters = new Map();
    for (const s of SETTINGS.itemtypes) {
        if (SETTINGS[s].type !== "Item") {
            continue
        }
        if (s === "items") {
            SETTINGS.items.item_subtypes.forEach(s => filters[s] = "items")
            continue
        }
        filters[SETTINGS[s].subtype] = s
    }
    return filters
};

//Create efficient indexes to check item UUIDs
function  _constructIndex() {
    const index = new Map();
    for (const s of SETTINGS.itemtypes) {
        //Dont apply to any item types that are disabled
        if (!getSetting(SETTINGS[s].enabled) || getSetting(SETTINGS[s].content).length === 0) {
            continue
        }
        index[s] = new Set(getSetting(SETTINGS[s].content))
    }
    return index;
};

    //Apply item UUID filtering
function _applyFilters(filterList, permittedIndex, item) {

    if (item.documentName !== "Item") {
        return true
    }

    if (!filterList[item.type] || !permittedIndex[filterList[item.type]]) {
        return true
    }

    //Have to reparse UUID as Quick Insert uses a slightly different format
    const uuid = foundry.utils.parseUuid(item.uuid);
    return permittedIndex[filterList[item.type]].has(uuid.uuid)
}


 function filterIndex(filterList, permittedIndex, spotlightIndex) {
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < spotlightIndex.length; readIndex++) {
        if (_applyFilters(filterList, permittedIndex, spotlightIndex[readIndex].data)) 
        {
            spotlightIndex[writeIndex] = spotlightIndex[readIndex];
            writeIndex++;
        }
    }
    spotlightIndex.length = writeIndex;
};


export function patchSpotlightOmnisearch() {

    if (!game.modules.has("spotlight-omnisearch") || !game.modules.get("spotlight-omnisearch").active) {
        log("Skipping Spotlight Omnisearch integration due to presence")
        return false;
    }

    if (!getSetting(SETTINGS.filterSpotlight)) {
        return
    }

    Hooks.on("spotlightOmnisearch.indexBuilt", (spotlightIndex, promises) => 
        {
            const filterList = _constructFilterIndex();
            const permittedIndex = _constructIndex();
            
            promises.push(
                filterIndex(filterList, permittedIndex, spotlightIndex)
            )
        }
    )

}

export function forceSpotlightRebuild() {
    if (!game.modules.has("spotlight-omnisearch") || !game.modules.get("spotlight-omnisearch").active) {
        return false;
    }

    if (!getSetting(SETTINGS.filterSpotlight)) {
        return false
    }

    log("Forcing Spotlight rebuild")
    CONFIG.SpotlightOmnisearch.rebuildIndex();
    CONFIG.dndContentManager.forceRebuild = false;
    return true
}