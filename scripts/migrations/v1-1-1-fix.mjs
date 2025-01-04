import { export_settings } from "../export.mjs";
import { SETTINGS } from "../settings.mjs";


export function migrationWorldSettings() {

    settings = export_settings();

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

    
}