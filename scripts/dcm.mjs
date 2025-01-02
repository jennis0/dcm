import { ClearSettings } from "./apps/clear.mjs";
import { ContentSelector } from "./apps/content-selector.mjs";
import { patchCompendiumBrowser } from "./compendium-filters.mjs";
import { log } from "./lib.mjs";
import { initSettings } from "./settings.mjs"
import { registerSpellLists } from "./spell-lists.mjs";


Hooks.once("init", () => {
    initSettings();
})

Hooks.once("ready", () => {
    patchCompendiumBrowser();
    registerSpellLists();
})