import { ContentSelector } from "./apps/content-selector.mjs";
import { SourceSelector } from "./apps/source-selector.mjs";
import { ClearSettings } from "./apps/clear.mjs";
import { MODULE_NAME, SETTINGS } from "./settings.mjs"
import { log } from "./lib.mjs";
import { EnableMenu } from "./apps/enable-menu.mjs";
import { ExportDialog, exportSettings, ImportDialog } from "./export.mjs";
import { FunctionApp } from "./apps/function-app.mjs";
import { Version } from "./version-utils.mjs";


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

    game.settings.registerMenu(MODULE_NAME, "enableMenu",
        {
            name:"Filtered Types",
            label: "Toggle Filters",
            hint: "Choose which item types to filter",
            scope: "world",
            config: true,
            type: EnableMenu,
            restricted: true,
            icon: "fas fa-check"
        }
    )

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
      

      if (game.modules.get("quick-insert")) {
        game.settings.register(MODULE_NAME, SETTINGS.filterQuickInsert, 
            {
                name: "Apply to Quick Insert",
                hint: "Filter results returned by Quick Insert (if installed)",
                scope: "world",
                config: true,
                type: Boolean,
                default: true,
                restricted: true,
                requiresReload: true
            }
        )
    }


    console.groupEnd()
}