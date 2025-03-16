import { getSetting, SETTINGS } from "../settings.mjs";
import { addPages, getAllItems, makeJournal, makeSpellPage } from "./common.mjs";

/**
 * Creates an itembook journal with pages for each item and an index page
 * @param {string} itemtype - Type of items to include in the journal (e.g., "background")
 * @param {string} folder - Destination folder for the journal
 * @param {string} sheet - Sheet template to use
 * @returns {Promise<Journal>} The created journal with all pages
 */
export async function createSpellbook(folder, sheet) {
    // Get configuration settings for this item type
    const content = getSetting(SETTINGS.spell.content);

    // Determine which spells to include - either from content setting or get all items
    const spells = (
        getSetting(SETTINGS.spell.enabled) && content.length > 0
        ? content 
        : getAllItems(SETTINGS.spell.subtype)
    )

    const spellPage = makeSpellPage("Spell List", spells, 1)

    // Create the main journal
    const journal = await makeJournal(
        SETTINGS.spell.label,
        sheet,
        SETTINGS.spell.subtype,
        folder
    );
    
    // Add item pages to journal
    await addPages(journal, [spellPage]);
    return journal;
}
