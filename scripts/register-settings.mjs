import { ContentSelector } from "./apps/content-selector.mjs";
import { SourceSelector } from "./apps/source-selector.mjs";
import { ClearSettings } from "./apps/clear.mjs";
import { MODULE_NAME, SETTINGS } from "./settings.mjs"
import { log } from "./lib.mjs";


export function initSettings() {

    SETTINGS.itemtypes.forEach(i => {
        const item = SETTINGS[i];
        game.settings.register(MODULE_NAME, item.sources,
            {
                config: false,
                type: Array,
                default: []
            }
        ),
        game.settings.register(MODULE_NAME, item.content,
            {
                config: false,
                type: Array,
                default: []
            }
        )
    })

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

    game.settings.register(MODULE_NAME, SETTINGS.lastLoadedVersion, 
        {
            scope: "world",
            config: false,
            restricted: true,
            type: String,
            default: ""
        }
    )

    log("Finished registering settings")
}