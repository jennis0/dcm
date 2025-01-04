import { ClearSettings } from "./apps/clear.mjs";
import { ContentSelector } from "./apps/content-selector.mjs";
import { SourceSelector } from "./apps/source-selector.mjs";
import { patchCompendiumBrowser } from "./compendium-filters.mjs";
import { MODULE_NAME, SETTINGS } from "./settings.mjs";
import { log } from "./lib.mjs";
import { initSettings } from "./register-settings.mjs"
import { registerSpellLists } from "./spell-lists.mjs";
import { EnableMenu } from "./apps/enable-menu.mjs";


Hooks.once("init", () => {
    initSettings();
})

Hooks.once("ready", () => {
    patchCompendiumBrowser();
    registerSpellLists();

    const w = new EnableMenu();
    w.render(true);

    // Set that we've successfully loaded this version
    game.settings.set(MODULE_NAME, SETTINGS.lastLoadedVersion, game.modules.get(MODULE_NAME).version)
})
