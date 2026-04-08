import { log, inPlaceFilter } from "../lib.mjs";
import { getSetting, SETTINGS } from "../settings.mjs";

function filterIndex(spotlightIndex) {
    inPlaceFilter(
        spotlightIndex,
        (item) => CONFIG.dndContentManager.index.spotlightItemInIndex(item.data),
        "spotlight item",
        (item) => item?.data?.uuid
    );
    return true
}


export function patchSpotlightOmnisearch() {
    // Hooks on the indexBuilt spotlight hook, allowing it to apply additional filtering

    if (!game.modules.has("spotlight-omnisearch") || !game.modules.get("spotlight-omnisearch").active) {
        log("Skipping Spotlight Omnisearch integration due to presence")
        return false;
    }

    if (!getSetting(SETTINGS.filterSpotlight)) {
        return
    }

    log("Hooking spotlight")
    Hooks.on("spotlightOmnisearch.indexBuilt", (spotlightIndex, promises) => 
        {              
            promises.push(
                new Promise((resolve) => {
                    CONFIG.dndContentManager.index.rebuild();
                    filterIndex(spotlightIndex);
                    resolve();
                })
            )
        }
    )
}

export function forceSpotlightRebuild() {
    //Spotlight doesn't rebuild when the search dialog is opened so we have to force 
    // it whenever the index has changed due to DCM

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