import { MODULE_NAME, SETTINGS } from "./constants.mjs";
import { log } from "./lib.mjs";


function createFilters(itemtypes) {
    // Creates a filter which only selects items with approved UUIDs

    return itemtypes.map(i => {
        if (!SETTINGS[i]) {
            return null
        }
        const v = game.settings.get(MODULE_NAME, SETTINGS[i].content);
        return {
            "k": "uuid", "o":"in", v: v
        }
    }).filter(f => f !== null)
}

const fetchFunc = dnd5e.applications.CompendiumBrowser.fetch;
function patchedFetch(...args) {
    createFilters(args[1].types).forEach(
        f => args[1].filters.push(f)
    )
    return fetchFunc(...args);
}

export function patchCompendiumBrowser() {
    // Hijack the CompendiumBrowsers fetch function to restrict to only the
    // items we care about.
    
    dnd5e.applications.CompendiumBrowser.fetch = patchedFetch;
    log("Patched filters into CompendiumBrowser");
}