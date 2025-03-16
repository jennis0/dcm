import { log } from "../lib.mjs";
import { getSetting, MODULE_NAME, SETTINGS } from "../settings.mjs";


// Proxy for SearchLib class to capture only calls to the 'search' method
class SearchLibProxy {

    constructor(searchLib) {
        // Return a Proxy to handle only calls to 'search'
        return new Proxy(searchLib, {

            get(target, prop) {
                if (prop === 'search') {
                    if (CONFIG.dndContentManager.forceRebuild) {
                        CONFIG.dndContentManager.index.rebuild();   
                    }
                    return function(...args) {
                        return target[prop].apply(target, args) // Forward the call
                            .filter(r => CONFIG.dndContentManager.index.quickInsertItemInIndex(r.item))
                    };
                } else if (prop === "isSearchLibProxy") {
                    return true;
                }
                // Default: forward all other property accesses
                return target[prop];
            },

            set(target, prop, value) {
                // Forward all property set operations
                target[prop] = value;
                return true;
            }
        });
    }
}

export async function patchQuickInsert()
{
    if (!game.modules.has("quick-insert") || !game.modules.get("quick-insert").active) {
        log("Skipping Quick Insert integration due to presence")
        return false;
    }

    if (!getSetting(SETTINGS.filterQuickInsert)) {
        log("Skipping Quick Insert integration due to setting")
        return false;
    }

    //If searchLib hasn't yet been constructed force one to exist
    if (!globalThis.QuickInsert.searchLib) {
        await globalThis.QuickInsert.forceIndex();
    }
    
    //Wrap the searchLib so we can filter the results
    if (!(globalThis.QuickInsert.searchLib.isSearchLibProxy)) {
        globalThis.QuickInsert.searchLib = new SearchLibProxy(
            globalThis.QuickInsert.searchLib
        );
    }

    log("Amended Quick Insert filters")
    return true;
}