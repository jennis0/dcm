import { MODULE_NAME, SETTINGS } from "../settings.mjs"

/**
 * Retrieves all item UUIDs of a specified type from a single pack.
 * Applies special filtering to handle feats
 *
 * @param {string} type - The type of items to retrieve.
 * @param {strimg} pack - The pack to retrieve items from 
 * @returns {Promise<string[]>} An array of item UUIDs of the specified type.
 */
async function getItemsFromPack(type, pack) {
    if (type === 'feat') {
        return await pack.getIndex(
            {fields: new Set(["uuid", "system.type"])}
        )
        .then(
            index =>  index.filter(d => d.system.type?.value === type)
                .map(d => d.uuid)
        )
    }
    return await pack.index.filter(d => d.type === type).map(item => item.uuid)
}

/**
 * Retrieves all item UUIDs of a specified type from the game packs.
 *
 * @param {string} type - The type of items to retrieve.
 * @returns {string[]} An array of item UUIDs of the specified type.
 */
export async function getAllItems(type) {
    return (await Promise.all(game.packs.filter(p => p.metadata.type === "Item")
        .map(
            async (p) => await getItemsFromPack(type, p)
        ))).flat()
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


/**
 * Retrieves premade journal pages from a specific compendium based on the provided document type.
 *
 * @async
 * @param {string} document_type - The type of document to search for in the compendium.
 * @returns {Map<string, Object>} A map of journal page names (in lowercase) to their corresponding page objects.
 *                                Returns an empty map if no matching journal is found.
 */
export async function getPremadeJournalPages(document_type) {
    const targetCompendium = game.packs.get(MODULE_NAME + ".dcm-journals");
    
    if (document_type.toLowerCase() === 'race') {
        document_type = 'species'
    }

    const targetJournalIndex = targetCompendium.index.find(j => j.name.toLowerCase() === document_type.toLowerCase())
    if (!targetJournalIndex) {
        return new Map()
    }

    return new Map(
        (await targetCompendium.getDocument(targetJournalIndex._id))
            .pages.map(p => [p.name.toLowerCase(), p])
    )
}

/**
 * Searches for an item in a map of premade journal pages by its ID or name.
 *
 * @param {Map<string, any>} pageMap - A map where keys are item IDs or names (in lowercase) 
 *                                     and values are the corresponding journal page data.
 * @param {Object} item - The item to search for in the map.
 * @param {string} item.id - The unique identifier of the item.
 * @param {string} item.name - The name of the item.
 * @returns {Object|null} - The journal page data associated with the item if found, or `null` if not found.
 */
export function itemInPremadeJournalPages(pageMap, item) {
    let page = pageMap.get(item.uuid.toLowerCase())

    if (!page) {
        page = pageMap.get(item.id.toLowerCase())
    }

    if (!page) {
        page = pageMap.get(item.name.toLowerCase())
    }

    if (page) {
        page.name = item.name
        page._source.name = item.name
        page.title.level = 1
        page.sort = -1
        page._source.title.level = 1
        return page
    }

    return null
}
