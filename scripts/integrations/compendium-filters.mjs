import { getSetting, SETTINGS } from "../settings.mjs";
import { log } from "../lib.mjs";


function createFilters(itemtypes) {
    // Creates a filter which only selects items with approved UUIDs
    const ids = [...itemtypes].map(i => {

        //Skip if item type is not defined or if disabled in settings
        if (!SETTINGS[i] || !getSetting(SETTINGS[i].enabled)) {
            return null
        }

        //If no items are selected, assume no filtering is required
        const v = getSetting(SETTINGS[i].content);
        if (!v | v.length === 0) {
            return null
        }

        //Construct basic "uuid in list" filter
        return {
            "k": "uuid", "o":"in", v: v
        }
    })
    const filtered_ids = ids.filter(f => f !== null);
    return filtered_ids
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