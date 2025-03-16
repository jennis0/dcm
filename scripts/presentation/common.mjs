import { SETTINGS } from "../settings.mjs"

/**
 * Retrieves all item UUIDs of a specified type from the game packs.
 *
 * @param {string} type - The type of items to retrieve.
 * @returns {string[]} An array of item UUIDs of the specified type.
 */
export function getAllItems(type) {
    return game.packs.filter(p => p.metadata.type === "Item")
        .map(
            p => p.index.filter(item => item.type === type).map(item => item.uuid)
        ).flat()
}

/**
 * Creates a new journal entry with the specified title, sheet, journal type, and folder.
 * If a journal entry with the same name and type already exists in the specified folder, it will be deleted first.
 *
 * @param {string} title - The title of the journal entry.
 * @param {string} sheet - The sheet class to be used for the journal entry.
 * @param {string} journalType - The type of the journal entry.
 * @param {Folder|null} [folder=null] - The folder in which to create the journal entry. If null, the journal entry will be created in the root folder.
 * @returns {Promise<JournalEntry|null>} - The newly created journal entry, or null if creation failed.
 */
export async function makeJournal(title, sheet, journalType, folder=null) {


    //Delete existing journal if present
    const existingJournal = game.journal.filter(p => p.folder?.uuid === folder?.uuid 
        && p.name === SETTINGS[journalType].label 
        && p.flags.dcm.journalType === journalType
    )
    if (existingJournal.length > 0) {
        await existingJournal[0].delete()
    } 

    //Create JournalData with flag to indicate we made it
    const journalData = {
        name: title,
        folder: folder.id,
        permission: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
        flags: {
            core: {
                sheetClass: sheet
            },
            dcm: {
                journalType: journalType
            }
        },
    };

    //Create journal
    const newJournal = await JournalEntry.create(journalData)
    if (!newJournal) {
        ui.notifications.error("Failed to create a new Journal Entry.");
        return;
    }
    return newJournal;
}

/**
 * Creates a basic page object with a title and content.
 *
 * @param {string} title - The title of the page.
 * @param {string} content - The content of the page.
 * @param {number|null} [level=null] - The level of the title (optional).
 * @param {number|null} [sort=null] - The sort order of the page (optional).
 * @returns {Object} The page object.
 */
export function makePage(title, content, level=null, sort=null) {
    return {
        _id: foundry.utils.randomID(),
        name: title,
        text: {content: content},
        title: {level},
        sort: sort
    };
}

/**
 * Creates a spell page object.
 *
 * @param {string} title - The title of the spell page.
 * @param {string[]} spells - An array of spell UUIDs.
 * @param {number} level - The spell level.
 * @param {number|null} [sort=null] - The sort order.
 * @returns {Object} A promise that resolves to the spell page object.
 */
export function makeSpellPage(title, spells, level, sort=null) {
    return {
        _id: foundry.utils.randomID(),
        name: title,
        type: "spells",
        sort: sort,
        title: {level :level},
        system: {
            grouping: "level",
            identifier: "classIdentifier",
            type: "class",
            spells: spells
        }
    }
}


/**
 * Adds pages to a journal entry.
 *
 * @param {JournalEntry} journal - The journal entry to which pages will be added.
 * @param {Array<Object>} pages - An array of page objects to be added to the journal entry.
 * @returns {Promise<Array<JournalEntryPage>>} A promise that resolves to an array of the newly created journal entry pages.
 */
export async function addPages(journal, pages) {
    const embeddedPages = []
    for (const p of pages) {
        embeddedPages.push((await journal.createEmbeddedDocuments("JournalEntryPage", [p]))[0])
    }
    return embeddedPages
}


/**
 * Generates an HTML table from the provided headers and rows.
 *
 * @param {string[]} headers - An array of strings representing the table headers.
 * @param {string[][]} rows - A 2D array of strings representing the table rows.
 * @returns {string} - A string containing the HTML representation of the table.
 */
export function htmlTable(headers, rows) {
    const toElement = (element, h) => `<${element}>${h}</${element}>`

    const htmlRows = []
    htmlRows.push(
        toElement("tr", headers.map(h => toElement("th", h)).join(""))
    )
    
    rows.forEach(r => {
        htmlRows.push(
            toElement("tr", r.map(entry => toElement("td", entry)).join(""))
        )
    })

    return toElement("table", htmlRows.join("\n"))
}
