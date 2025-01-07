import { getSetting, SETTINGS } from "./settings.mjs";
import { isV3, log } from "./lib.mjs";

//Gets the compendium name from a SpellList UUID
function _getCompendiumName(uuid) {
    const loc = uuid.search(".JournalEntry")
    if (loc < 0) {
        return null;
    }
    //Remove page ID and starting 'Compendium.'
    return uuid.slice(11, loc);
}

//Add pre-registered spell lists to fixed compendium so they can't be deselected
function noteSpellListModules() {
    const spellListPages = game.modules.map(p => p.flags.dnd5e?.spellLists).filter(p => p).flat()
    const sm = CONFIG.dndContentManager.fixed.get("spelllist");
    sm.items = new Set(spellListPages)
    sm.compendia = new Set(spellListPages.map(p => _getCompendiumName(p)).filter(p => p))
    
    log(`Found ${sm.compendia.length} compendia registering ${sm.items.length} spell lists`)
}

function clearSpellLists() {
    //Currently does nothing
    // game.system.registry.spellLists.#byType = new Map();
    // game.system.registry.spellLists.#bySpell = new Map();
    // game.system.registry.spellLists.#loading = new Set();
    log("Cleared existing spell lists");
}

export function registerSpellLists() {

    //Registry doesn't exist in 3.3.1
    if (isV3()) {
        return;
    }
    
    clearSpellLists();

    const lists = getSetting(SETTINGS.spelllist.content);
    lists.forEach(sl => {
        game.system.registry.spellLists.register(sl)
    }
    );

    noteSpellListModules();

    log("Finished registering spell lists");
}