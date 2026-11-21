import { log } from "./lib.mjs";
import { getSetting, SETTINGS, MODULE_LABEL} from "./settings.mjs";
import { Version } from "./version-utils.mjs";

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
        "Compendium.dnd5e-content-manager.dcm-journals.JournalEntry.TwVIF5nUDBsdcWxs"
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

    // No migrations currently required
}