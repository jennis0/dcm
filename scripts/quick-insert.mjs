import { log } from "./lib.mjs";
import { getSetting, SETTINGS } from "./settings.mjs";


// Proxy for SearchLib class to capture only calls to the 'search' method
class SearchLibWrapper {

    constructor(searchLib) {
        // Return a Proxy to handle only calls to 'search'
        return new Proxy(searchLib, {

            get(target, prop) {
                if (prop === 'search') {
                    return function(...args) {
                        return target[prop].apply(target, args) // Forward the call
                            .filter(r => SearchLibWrapper._applyFilters(r.item))
                    };
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
            if (!getSetting(SETTINGS[s].enabled)) {
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

Hooks.on("renderSearchAppV2", () => {
    INDEX = SearchLibWrapper._constructIndex();
    log("Updated Quick Insert index")
})

export async function patchQuickInsert()
{
    if (!game.modules.has("quick-insert") || game.modules.get("quick-insert").unavailable) {
        log("Skipping Quick Insert integration due to presence")
        return false;
    }

    if (!getSetting(SETTINGS.filterQuickInsert)) {
        log("Skipping Quick Insert integration due to setting")
        return false;
    }

    FILTERS = SearchLibWrapper._constructFilterIndex()
    INDEX = SearchLibWrapper._constructIndex();

    await globalThis.QuickInsert.forceIndex();

    globalThis.QuickInsert.searchLib = new SearchLibWrapper(
        globalThis.QuickInsert.searchLib
    );
    log("Applied Quick Insert integration")
    return true;
}


