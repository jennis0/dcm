import { exportSettings, importSettings } from "./export.mjs";
import { log } from "./lib.mjs";
import { getSetting, SETTINGS, MODULE_LABEL, MODULE_NAME} from "./settings.mjs";
import { Version } from "./version-utils.mjs";

/**
 * Handles a bug from v1.1.0 where user settings were not copied to world settings
 */
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

/**
 * Creates a chat message describing the changes in the current version
 */
function createUpdateMessage() {

    log("Creating update message")

    const updates = [
        "Improvement of how duplicate filtering works and addition of an inverse filter to find unique items",
        "Button to collapse/expand tables of items for easier working with large sets of items",
        "General tweaks to presentation to increase information density and useability",
        "The 'Make Spells Journal' option in Create Player Handbook now actually creates a journal",
        "Fixed QuickInsert integration bug which caused it not to function until changes we made",
        "Feat handbook no longer contains non-feat features if when not being managed by DCM",
        "Resolved CSS issue with content selector sidebar spacing in Firefox",
        "Add feat types back in for 5e 2024"
    ]

    const content = `<p><i>Module updated to ${CONFIG.dndContentManager.version}</i></p>`
        + "<h3>Change Log</h3><ul><li>" + updates.join("</li><li>") + "</li></ul>";


    ChatMessage.create({content: content, author: game.userId,
            type: CONST.CHAT_MESSAGE_STYLES.OTHER, 
            whisper: [game.userId], 
            speaker: {alias: `${MODULE_LABEL}`}
        }
    )
}

/**
 * Checks current and last loaded versions and handles any necessary migrations
 */
export function handleMigrations() {
    const currentVersion = CONFIG.dndContentManager.version;
    const lastVersion = Version.fromString(getSetting(SETTINGS.lastLoadedVersion));

    log(`Current version: ${currentVersion}, Last version: ${lastVersion}`)

    if (currentVersion.equals(lastVersion)) {
        return false
    }
    
    Hooks.on("ready", () => {
        createUpdateMessage()
    })

    if (lastVersion.equals(new Version(1,1,0))) {
        log("Migration: Copying user settings to migrate to world settings")
        v111MigrationRegisterSettings();
        CONFIG.dndContentManager.migrationData = exportSettings();

        Hooks.once("ready", () => {
            log("Migration: Writing to world settings")
            importSettings(CONFIG.dndContentManager.migrationData)
            CONFIG.dndContentManager.migrationData = null;
        })
    }
}