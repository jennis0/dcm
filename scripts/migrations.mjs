import { exportSettings, importSettings } from "./export.mjs";
import { log } from "./lib.mjs";
import { getSetting, SETTINGS } from "./settings.mjs";


function v111MigrationRegisterSettings() {
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
        game.settings.register(MODULE_NAME, item.enabled, 
            {
                config: false,
                type: Boolean,
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
    var arr = version.split('.');

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
    const currentVersion = CONFIG.dndContentManager.version;
    //const currentVersionParsed = parseSemVer(currentVersion);
    const lastVersion = getSetting(SETTINGS.lastLoadedVersion);
    const lastVersionParsed = parseSemVer(currentVersion);

    log(`Current version: ${currentVersion}, Last version: ${lastVersion}`)

    if (currentVersion === lastVersion) {
        return false
    }

    if (lastVersionParsed.major === 1 && lastVersionParsed.minor === 1 && lastVersionParsed.build === 0) {
        log("Migration: Copying user settings to migrate to world settings")
        v111MigrationRegisterSettings();
        CONFIG.dndContentManager.migrationData = exportSettings();

        Hooks.once("ready", () => {
            log("Migration: Writing to world settings")
            importSettings(CONFIG.dndContentManager.migrationData)
            CONFIG.dndContentManager.migrationData = null;

            console.log(exportSettings())
        })
    }
}