import { log } from "../lib.mjs";
import { getSetting, MODULE_NAME, SETTINGS } from "../settings.mjs";


// Proxy for SearchLib class to capture only calls to the 'search' method
class SearchLibProxy {

    constructor(searchLib) {
        // Return a Proxy to handle only calls to 'search'
        return new Proxy(searchLib, {

            get(target, prop) {
                if (prop === 'search') {
                    return function(...args) {
                        return target[prop].apply(target, args) // Forward the call
                            .filter(r => SearchLibProxy._applyFilters(r.item))
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

    //Create mapping from item subtypes to indexes
    static _constructFilterIndex() {
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
    }

    //Create efficient indexes to check item UUIDs
    static _constructIndex() {
        const index = new Map();
        for (const s of SETTINGS.itemtypes) {
            //Dont apply to any item types that are disabled
            if (!getSetting(SETTINGS[s].enabled) || getSetting(SETTINGS[s].content).length === 0) {
                continue
            }
            index[s] = new Set(getSetting(SETTINGS[s].content))
        }
        return index;
    }

    //Apply item UUID filtering
    static _applyFilters(item) {
        if (item.documentType !== "Item") {
            return true
        }


        if (!FILTERS[item.subType] || !INDEX[FILTERS[item.subType]]) {
            return true
        }

        //Have to reparse UUID as Quick Insert uses a slightly different format
        const uuid = foundry.utils.parseUuid(item.uuid);
        return INDEX[FILTERS[item.subType]].has(uuid.uuid)
    }
}

let FILTERS = null;
let INDEX = null;



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

    Hooks.on("renderSearchAppV2", async () => {    
        //If searchLib hasn't yet been constructucted force one to exist
        if (!globalThis.QuickInsert.searchLib) {
            await globalThis.QuickInsert.forceIndex();
        }
        
        //Wrap the searchLib so we can filter the results
        if (!(globalThis.QuickInsert.searchLib.isSearchLibProxy)) {
            globalThis.QuickInsert.searchLib = new SearchLibProxy(
                globalThis.QuickInsert.searchLib
            );
        }
        //Create updated set of filters and indicies
        FILTERS = SearchLibProxy._constructFilterIndex()
        INDEX = SearchLibProxy._constructIndex();    
        log("Amended Quick Insert filters")
    })
    return true;
}