import { getSetting, SETTINGS } from "../settings.mjs";
import { log } from "../lib.mjs";


const fetchFunc = dnd5e.applications.CompendiumBrowser.fetch;
function patchedFetch(...args) {
    return fetchFunc(...args)
        .then(result => result.filter(
            r => CONFIG.dndContentManager
                    .index
                    .compendiumBrowserItemInIndex(r)
        )
    )
}

export function patchCompendiumBrowser() {
    // Hijack the CompendiumBrowsers fetch function to restrict to only the
    // items we care about.
    
    dnd5e.applications.CompendiumBrowser.fetch = patchedFetch;

    Hooks.on("renderCompendiumBrowser", () => {
        CONFIG.dndContentManager.index.rebuild();
    })

    log("Patched filters into CompendiumBrowser");
}