
import { getSetting, MODULE_NAME, setSetting, SETTINGS } from "./settings.mjs";
import { log } from "./lib.mjs";
import { initSettings, initVersionSetting } from "./register-settings.mjs"
import { registerSpellLists } from "./spell-lists.mjs";
import { handleMigrations } from "./migrations.mjs";
import { ContentSelector } from "./apps/content-selector.mjs";

import { patchCompendiumBrowser } from "./integrations/compendium-filters.mjs";
import { patchQuickInsert } from "./integrations/quick-insert.mjs";
import { patchSpotlightOmnisearch } from "./integrations/spotlight.mjs";

import { SourceSelector } from "./apps/source-selector.mjs";
import { Version } from "./version-utils.mjs";
import { DCMIndex } from "./index.mjs";
import { PlayerHandbookMenu } from "./apps/player-handbook.mjs";


Hooks.once("init", () => {
    //Create version setting first as this is relied on by the migration
    initVersionSetting();

    //Create config object
    CONFIG.dndContentManager = {
        version: Version.fromString(game.modules.get(MODULE_NAME).version),
        fixed: new Map(SETTINGS.itemtypes.map(i => [i, {compendia: new Set(), items: new Set()}])),
        forceRebuild: false,
        systemV3: game.system.version.startsWith("3"),
        modernRules: game.settings.settings.has("dnd5e.rulesVersion")
            && game.settings.get("dnd5e", "rulesVersion") === "modern",
        index: new DCMIndex()
    };
    
    //Perform any migration work we need to do
    handleMigrations();

    //Register settings
    initSettings();

    //Load integrations with other modules (if present)
    patchQuickInsert();
    patchSpotlightOmnisearch();

    if (!CONFIG.dndContentManager.modernRules) {
        SETTINGS.race.label = "Races"
    }

    log("Finished initialisation")
})

Hooks.once("ready", () => {
    // Set that we've successfully loaded this version
    setSetting(SETTINGS.lastLoadedVersion, CONFIG.dndContentManager.version.toString())

    //Add our monkey patch to the Compendium Browser
    patchCompendiumBrowser();

    //Add any additional spell lists
    registerSpellLists();

    log("Finished ready steps")
})


function injectCompendiumButtons(html) {
    log("Injecting sidebar buttons")

    const div = document.createElement("div")
    div.setAttribute("caption", "Test Caption")
    div.classList.add("dcm-button-row")
    div.appendChild(ContentSelector.createSidebarButton())
    div.appendChild(PlayerHandbookMenu.createSidebarButton())

    const headerActions = html.querySelector(".header-actions");
    headerActions.prepend(div);
}

//Add Sidebar button
Hooks.on("renderCompendiumDirectory", (app, [html], data) => {
    if (getSetting(SETTINGS.injectCompendiumButtons))
        if (game.user.role === 4) {
            injectCompendiumButtons(html)
        };
    }
)