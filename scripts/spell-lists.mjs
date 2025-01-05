import { getSetting, SETTINGS } from "./settings.mjs";
import { isV3, log } from "./lib.mjs";


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
    log("Finished registering spell lists");
}