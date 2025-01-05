import { ContentSelector } from "./apps/content-selector.mjs";
import { SourceSelector } from "./apps/source-selector.mjs";
import { ClearSettings } from "./apps/clear.mjs";
import { MODULE_NAME, SETTINGS } from "./settings.mjs"
import { log } from "./lib.mjs";
import { EnableMenu } from "./apps/enable-menu.mjs";
import { export_settings } from "./export.mjs";


export function initVersionSetting() {
    game.settings.register(MODULE_NAME, SETTINGS.lastLoadedVersion, 
        {
            scope: "world",
            config: false,
            restricted: true,
            type: String,
            default: ""
        }
    )
}

export function initSettings() {

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
        game.settings.register(MODULE_NAME, item.content,
            {
                config: false,
                type: Array,
                scope: "world",
                restricted: true,
                default: []
            }
        )
        game.settings.register(MODULE_NAME, item.enabled, 
            {
                config: false,
                type: Boolean,
                scope: "world",
                restricted: true,
                default: true
            }
        )
    })

    game.settings.registerMenu(MODULE_NAME, "enableMenu",
        {
            name:"Select Filtered Types",
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
            name: "Approved Content",
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
            scope: "world",
            config: true,
            type: ClearSettings,
            restricted: true,
            icon: "fas fa-trash"
        }
    )

    game.settings.register(MODULE_NAME, "export", 
        {
            scope: "world",
            config: true,
            restricted: true,
            type: Function,
            default: () => console.log(export_settings())
        }
    )

    log("Finished registering settings")
}