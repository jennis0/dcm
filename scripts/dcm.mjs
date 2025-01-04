import { ClearSettings } from "./apps/clear.mjs";
import { ContentSelector } from "./apps/content-selector.mjs";
import { SourceSelector } from "./apps/source-selector.mjs";
import { patchCompendiumBrowser } from "./compendium-filters.mjs";
import { MODULE_NAME, SETTINGS } from "./settings.mjs";
import { log } from "./lib.mjs";
import { initSettings } from "./register-settings.mjs"
import { registerSpellLists } from "./spell-lists.mjs";
import { EnableMenu } from "./apps/enable-menu.mjs";
import { handleMigrations } from "./migrations.mjs";


Hooks.once("init", () => {
    //Create config object
    CONFIG.dndContentManager = {};
    
    //Register settings
    initSettings();
 
    //Perform any migration work we need to do
    handleMigrations();
    log("Finished initialisation")
})

Hooks.once("ready", () => {
    //Add our monkey patch to the Compendium Browser
    patchCompendiumBrowser();

    //Add any additional spell lists
    registerSpellLists();
    
    // Set that we've successfully loaded this version
    game.settings.set(MODULE_NAME, SETTINGS.lastLoadedVersion, game.modules.get(MODULE_NAME).version)
    log("Finished ready steps")
})
