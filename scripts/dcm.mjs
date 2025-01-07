import { patchCompendiumBrowser } from "./compendium-filters.mjs";
import { MODULE_NAME, setSetting, SETTINGS } from "./settings.mjs";
import { log } from "./lib.mjs";
import { initSettings, initVersionSetting } from "./register-settings.mjs"
import { registerSpellLists } from "./spell-lists.mjs";
import { handleMigrations } from "./migrations.mjs";
import { ContentSelector } from "./apps/content-selector.mjs";
import { patchQuickInsert } from "./quick-insert.mjs";
import { SourceSelector } from "./apps/source-selector.mjs";


Hooks.once("init", () => {
    //Create version setting first as this is relied on by the migration
    initVersionSetting();

    //Create config object
    CONFIG.dndContentManager = {
        version: game.modules.get(MODULE_NAME).version,
        fixed: new Map(SETTINGS.itemtypes.map(i => [i, {compendia: new Set(), items: new Set()}]))
    };
    
    //Perform any migration work we need to do
    handleMigrations();

    //Register settings
    initSettings();

    log("Finished initialisation")
})

Hooks.once("ready", () => {
    // Set that we've successfully loaded this version
    setSetting(SETTINGS.lastLoadedVersion, CONFIG.dndContentManager.version)

    //Add our monkey patch to the Compendium Browser
    patchCompendiumBrowser();

    //Monkey patch quick insert (if present)
    patchQuickInsert();

    //Add any additional spell lists
    registerSpellLists();

    const w = new SourceSelector();
    w.render(true);

    const w2 = new ContentSelector();
    w2.render(true);

    log("Finished ready steps")
})


//Add Sidebar button
Hooks.on("renderCompendiumDirectory", (app, [html], data) => {
        if (game.user.role === 4) {
            ContentSelector.injectSidebarButton(html)
        };
    }
)