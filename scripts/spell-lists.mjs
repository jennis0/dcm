import { MODULE_NAME, SETTINGS } from "./constants.mjs";


function clearSpellLists() {
    //Currently does nothing
    // game.system.registry.spellLists.#byType = new Map();
    // game.system.registry.spellLists.#bySpell = new Map();
    // game.system.registry.spellLists.#loading = new Set();
    console.log("D&D Content Manager | Cleared existing spell lists");
}

export function registerSpellLists() {

    clearSpellLists();

    const lists = game.settings.get(MODULE_NAME, SETTINGS.spelllist.content);
    lists.forEach(sl => {
        game.system.registry.spellLists.register(sl)
    }
    );
    console.log("D&D Content Manager | Finished registering spell lists");
}