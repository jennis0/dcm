import { ClearSettings } from "./apps/clear.mjs";
import { ContentSelector } from "./apps/content-selector.mjs";
import { SourceSelector } from "./apps/source-selector.mjs";
import { patchCompendiumBrowser } from "./compendium-filters.mjs";
import { log } from "./lib.mjs";
import { initSettings } from "./settings.mjs"
import { registerSpellLists } from "./spell-lists.mjs";


Hooks.once("init", () => {
    initSettings();
})

Hooks.once("ready", () => {

    const window = new SourceSelector();
    window.render(true);

    const window2 = new ContentSelector();
    window2.render(true);

    patchCompendiumBrowser();
    registerSpellLists();
})
