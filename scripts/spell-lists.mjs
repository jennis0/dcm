import { MODULE_NAME, SETTINGS } from "./settings.mjs";
import { isV3, log } from "./lib.mjs";


function clearSpellLists() {
    //Currently does nothing
    // game.system.registry.spellLists.#byType = new Map();
    // game.system.registry.spellLists.#bySpell = new Map();
    // game.system.registry.spellLists.#loading = new Set();
    log("Cleared existing spell lists");
}

export function registerSpellLists() {

    if (isV3()) {
        return;
    }
    
    clearSpellLists();

    const lists = game.settings.get(MODULE_NAME, SETTINGS.spelllist.content);
    lists.forEach(sl => {
        game.system.registry.spellLists.register(sl)
    }
    );
    log("Finished registering spell lists");
}