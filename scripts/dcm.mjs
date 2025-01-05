import { ClearSettings } from "./apps/clear.mjs";
import { ContentSelector } from "./apps/content-selector.mjs";
import { SourceSelector } from "./apps/source-selector.mjs";
import { patchCompendiumBrowser } from "./compendium-filters.mjs";
import { MODULE_NAME, SETTINGS } from "./settings.mjs";
import { log } from "./lib.mjs";
import { initSettings, initVersionSetting } from "./register-settings.mjs"
import { registerSpellLists } from "./spell-lists.mjs";
import { EnableMenu } from "./apps/enable-menu.mjs";
import { handleMigrations } from "./migrations.mjs";
import { export_settings } from "./export.mjs";


Hooks.once("init", () => {
    //Create version setting first as this is relied on by the migration
    initVersionSetting();

    //Create config object
    CONFIG.dndContentManager = {};
    
    //Perform any migration work we need to do
    handleMigrations();

    //Register settings
    initSettings();
 

    log("Finished initialisation")
})

Hooks.once("ready", () => {
    //Add our monkey patch to the Compendium Browser
    patchCompendiumBrowser();

    //Add any additional spell lists
    registerSpellLists();

    console.log(export_settings())
    
    // Set that we've successfully loaded this version
    game.settings.set(MODULE_NAME, SETTINGS.lastLoadedVersion, game.modules.get(MODULE_NAME).version)
    log("Finished ready steps")
})
