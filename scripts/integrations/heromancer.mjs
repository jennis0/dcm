import { log, inPlaceFilter } from "../lib.mjs";
import { getSetting, SETTINGS } from "../settings.mjs";

const DOC_TYPE_MAP = {
    raceDocs: "race",
    classDocs: "class",
    backgroundDocs: "background",
}

/**
 * Filters a grouped document list in place, removing docs not in our index
 * and pruning empty groups. All HeroMancer document types now use this
 * grouped structure: [{ folderName, docs: [...] }]
 */
function filterGroupedDocs(docType, groups) {
    inPlaceFilter(groups, (group) => {
        const remaining = inPlaceFilter(group.docs, (doc) => {
            return CONFIG.dndContentManager.index.itemInIndex("Item", docType, doc.uuid)
        }, `heromancer ${docType} doc`);
        return remaining > 0
    }, `heromancer ${docType} group`)
}

export function patchHeromancer() {
    if (!game.modules.has("hero-mancer") || !game.modules.get("hero-mancer").active) {
        log("Skipping Hero Mancer integration due to presence")
        return false;
    }

    if (!getSetting(SETTINGS.filterHeromancer)) {
        return
    }

    log("Hooking HeroMancer")
    let patched = false
    Hooks.on("renderHeroMancer", (app) => {
        if (patched) return
        patched = true

        const proto = Object.getPrototypeOf(app)
        const original = proto._prepareContext
        proto._prepareContext = async function(options) {
            const context = await original.call(this, options)
            log("Filtering HeroMancer document context")
            for (const [contextKey, docType] of Object.entries(DOC_TYPE_MAP)) {
                if (Array.isArray(context[contextKey])) {
                    filterGroupedDocs(docType, context[contextKey])
                }
            }
            return context
        }

        app.render(true)
    })
}