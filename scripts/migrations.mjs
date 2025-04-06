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
 * Displays the changelog by rendering the most recent page of a specific journal entry.
 * 
 * This function retrieves a journal entry from a Compendium using its UUID. If the journal
 * is found, it identifies the most recent page and renders the journal sheet, displaying
 * the changelog. If the journal is not found, it logs a message and exits.
 * 
 * @async
 * @function showChangelog
 * @returns {Promise<void>} Resolves when the changelog is displayed or logs a message if no journal is found.
 */
export async function showChangelog() {

    const currentVersion = CONFIG.dndContentManager.version;
    const lastVersion = Version.fromString(getSetting(SETTINGS.lastLoadedVersion));

    if (currentVersion.equals(lastVersion)) {
        return
    }

    const journal = await fromUuid(
        "Compendium.dnd5e-content-manager.dcm-journals.JournalEntry.BrgcOOsuMEYwdPWi"
    );
    if (!journal) {
        log("No journal found, not showing changelog")
        return
    }
    const mostRecentPage = journal.pages.contents[journal.pages.contents.length - 1];
    journal.sheet.render(true, {pageId: mostRecentPage.id});
}

/**
 * Checks current and last loaded versions and handles any necessary migrations
 */
export function handleMigrations() {
    const currentVersion = CONFIG.dndContentManager.version;
    const lastVersion = Version.fromString(getSetting(SETTINGS.lastLoadedVersion));

    if (currentVersion.equals(lastVersion)) {
        return false
    }

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