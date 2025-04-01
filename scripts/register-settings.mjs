import { ContentSelector } from "./apps/content-selector.mjs";
import { SourceSelector } from "./apps/source-selector.mjs";
import { ClearSettings } from "./apps/clear.mjs";
import { MODULE_NAME, SETTINGS } from "./settings.mjs"
import { log } from "./lib.mjs";
import { EnableMenu } from "./apps/enable-menu.mjs";
import { ExportDialog, ImportDialog } from "./export.mjs";
import { PlayerHandbookMenu } from "./apps/player-handbook.mjs";


export function initVersionSetting() {
    game.settings.register(MODULE_NAME, SETTINGS.lastLoadedVersion, 
        {
            scope: "world",
            config: false,
            restricted: true,
            type: String,
            default: game.modules.get(MODULE_NAME).version
        }
    )
}

export function initSettings() {

    console.groupCollapsed("DnD Content Manager | Registering Settings")

    SETTINGS.itemtypes.forEach(i => {
        const item = SETTINGS[i];
        game.settings.register(MODULE_NAME, item.sources,
            {
                config: false,
                type: Array,
                scope: "world",
                restricted: true,
                default: []
            }
        ),
        log(`Registered setting ${item.sources}`)
        game.settings.register(MODULE_NAME, item.content,
            {
                config: false,
                type: Array,
                scope: "world",
                restricted: true,
                default: []
            }
        )
        log(`Registered setting ${item.content}`)
        game.settings.register(MODULE_NAME, item.enabled, 
            {
                config: false,
                type: Boolean,
                scope: "world",
                restricted: true,
                default: true
            }
        )
        log(`Registered setting ${item.enabled}`)
    })

    game.settings.registerMenu(MODULE_NAME, "sourceMenu", 
        {
            name: "Compendium Sources",
            label: "Configure Sources",
            hint: "Choose the compendia which will be used as sources for character options",
            scope: "world",
            config: true,
            type: SourceSelector,
            restricted: true,
            icon: "fas fa-book-open-reader"
        }
    )

    game.settings.registerMenu(MODULE_NAME, "contentMenu",
        {
            name: "Player Content",
            label: "Configure Content",
            hint: "Choose which items from your selected compendia will be available for players",
            scope: "world",
            config: true,
            type: ContentSelector,
            restricted: true,
            icon: "fas fa-ballot-check"
        }
    )

    game.settings.registerMenu(MODULE_NAME, "handbookMenu",
        {
            name: "Player Option Journals",
            label: "Create Player Option Journals",
            hint: "Create a set of Journals which contain the selected player options",
            scope: "world",
            config: true,
            restricted: true,
            type: PlayerHandbookMenu,
            icon: "fas fa-book-sparkles"
        }
    )

    game.settings.registerMenu(MODULE_NAME, "clear", 
        {
            name: "Clear Settings",
            hint: "Erase all settings (for sources and allowed content)",
            label: "Clear Settings",
            scope: "world",
            config: true,
            type: ClearSettings,
            restricted: true,
            icon: "fas fa-trash"
        }
    )

    game.settings.registerMenu(MODULE_NAME, "exportConfig", {
        name: "Export Settings",
        label: "Download File",
        hint: "Download current settings as a JSON file",
        scope: "world",
        config: true,
        type: ExportDialog,
        restricted: true,
        icon: "fas fa-file-export"
    })

    game.settings.registerMenu(MODULE_NAME, 'importConfig', {
        name: 'Load Settings',
        label: "Upload File",
        hint: "Upload a JSON file with existing settings",
        config: true,
        scope: "world",
        type: ImportDialog,
        restricted: true,
        icon: "fas fa-file-import"
      });

      game.settings.register(MODULE_NAME, SETTINGS.injectCompendiumButtons, 
        {
            name: "Add Compendium Sidebar Buttons",
            hint: "Add buttons for configuring options and creating the player journal to the compendium tab",
            config: true,
            scope: "player",
            type: Boolean,
            default: true,
            restricted: true,
            requiresReload: true
        }
      );
      
      
      game.settings.register(MODULE_NAME, SETTINGS.injectItemButton, 
        {
            name: "Add Item Toggle",
            hint: "Adds toggle to item sheets to directly enable/disable without opening the configuration menu",
            config: true,
            scope: "player",
            type: Boolean,
            default: true,
            restricted: true,
            requiresReload: true
        }
      );

      if (game.modules.get("quick-insert")) {
        game.settings.register(MODULE_NAME, SETTINGS.filterQuickInsert, 
            {
                name: "Filter Quick Insert Results",
                hint: "Filter results returned by Quick Insert (if installed)",
                scope: "world",
                config: true,
                type: Boolean,
                default: false,
                restricted: true,
                requiresReload: true
            }
        )
    }

    if (game.modules.get("spotlight-omnisearch")) {
        game.settings.register(MODULE_NAME, SETTINGS.filterSpotlight, 
            {
                name: "Filter Spotlight Omnisearch Results",
                hint: "Filter results returned by Spotlight Omnisearch (if installed)",
                scope: "world",
                config: true,
                type: Boolean,
                default: false,
                restricted: true,
                requiresReload: true
            }
        )
    }

    if (game.modules.get("hero-mancer")) {
        game.settings.register(MODULE_NAME, SETTINGS.filterHeromancer, 
            {
                name: "Filter Hero Mancer Options",
                hint: "Filter player options shown by Hero-Mancer (if installed)",
                scope: "world",
                config: true,
                type: Boolean,
                default: false,
                restricted: true,
                requiresReload: true
            }
        )
    }

    game.settings.register(MODULE_NAME, SETTINGS.playerHandbookOptions, 
        {
            name: "Player Handbook Options",
            config: false,
            default: {
                class: true,
                races: true,
                backgrounds: true,
                feats: true,
                spells: true,
                existingPages: true,
                folderTitle: "Player Handbook",
                styleOption: null
            },
            restricted: true,
            type: Object
        }
    ) 

    console.groupEnd()
}