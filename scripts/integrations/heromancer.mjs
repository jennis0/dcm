import { log, inPlaceFilter } from "../lib.mjs";
import { getSetting, SETTINGS } from "../settings.mjs";

function filterRace(hmIndex) {
    inPlaceFilter(hmIndex, (raceGroup) => {
        const remaining = inPlaceFilter(raceGroup.docs, (doc) => {
            return CONFIG.dndContentManager.index.itemInIndex("Item", "race", doc.uuid)
        }, "heromancer race doc");
        return remaining > 0
    }, "heromancer race group")
    return true
}

function filterIndex(docType, hmIndex) {
    if (docType === "race") {
        filterRace(hmIndex)
    } else {
        inPlaceFilter(hmIndex, (doc) => {
            return CONFIG.dndContentManager.index.itemInIndex("Item", docType, doc.uuid)
        }, "heromancer item")
    }
    return true
}


export function patchHeromancer() {
    // Hooks on the documentsReady hook, allowing it to apply additional filtering

    if (!game.modules.has("hero-mancer") || !game.modules.get("hero-mancer").active) {
        log("Skipping Hero Mancer integration due to presence")
        return false;
    }

    if (!getSetting(SETTINGS.filterHeromancer)) {
        return
    }

    log("Hooking HeroMancer")
    Hooks.on("heroMancer.documentsReady", (documentType, hmIndex, promises) => 
        {   
            promises.push(
                new Promise(
                    (resolve) => {
                        filterIndex(documentType, hmIndex);
                        resolve(true)
                    },
                )
            )
        }
    )
}