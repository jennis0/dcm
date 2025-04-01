import { log } from "../lib.mjs";
import { getSetting, SETTINGS } from "../settings.mjs";

function inPlaceFilter(array, filterFn) {
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < array.length; readIndex++) {
        if (filterFn(array[readIndex])) {
            array[writeIndex] = array[readIndex];
            writeIndex++;
        }
    }
    array.length = writeIndex;
    return array.length
}

function filterRace(hmIndex) {
    inPlaceFilter(hmIndex, (raceGroup) => {
        const remaining = inPlaceFilter(raceGroup.docs, (doc) => {
            return CONFIG.dndContentManager.index.itemInIndex("Item", "race", doc.uuid)
        });
        return remaining > 0
    })
    return true
}

 function filterIndex(docType, hmIndex) {
    if (docType === "race") {
        filterRace(hmIndex)
    } else {
        inPlaceFilter(hmIndex, (doc) => {
            return CONFIG.dndContentManager.index.itemInIndex("Item", docType, doc.uuid)
        })
    }
    return true
};


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