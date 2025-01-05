import { export_settings, import_settings } from "./export.mjs";
import { log } from "./lib.mjs";
import { MODULE_NAME, SETTINGS } from "./settings.mjs";


function v111MigrationRegisterSettings() {
    SETTINGS.itemtypes.forEach(i => {
        const item = SETTINGS[i];
        game.settings.register(MODULE_NAME, item.sources,
            {
                config: false,
                type: Array,
                restricted: true,
                default: []
            }
        ),
        game.settings.register(MODULE_NAME, item.content,
            {
                config: false,
                type: Array,
                restricted: true,
                default: []
            }
        )
        game.settings.register(MODULE_NAME, item.enabled, 
            {
                config: false,
                type: Boolean,
                restricted: true,
                default: true
            }
        )
    })
}


function parseSemVer(version) {
    if (typeof(version) != 'string') { return {
        major: 0,
        minor: 0,
        build: 0
    }; }

    if (version === "dev") {
        return {
            major: 100,
            minor: 100,
            build: 100
        }
    }

    version = version.replace(/^v/, '');
    var arr = str.split('.');

    // parse int or default to 0
    var maj = parseInt(arr[0]) || 0;
    var min = parseInt(arr[1]) || 0;
    var rest = parseInt(arr[2]) || 0;
    return {
        major: maj,
        minor: min,
        build: rest
    }
}

export function handleMigrations() {
    const currentVersion = parseSemVer(game.modules.get(MODULE_NAME).version);
    const lastVersion = parseSemVer(game.settings.get(MODULE_NAME, SETTINGS.lastLoadedVersion));

    if (currentVersion === lastVersion) {
        return false
    }

    if (lastVersion.major > 2 || (lastVersion.major === 1 && lastVersion.minor === 1 && lastVersion.build === 0)) {
        log("Migration: Copying user settings to migrate to world settings")
        v111MigrationRegisterSettings();
        CONFIG.dndContentManager.migrationData = export_settings();

        Hooks.once("ready", () => {
            log("Migration: Writing to world settings")
            import_settings(CONFIG.dndContentManager.migrationData)
            CONFIG.dndContentManager.migrationData = null;

            console.log(export_settings())
        })
    }
}