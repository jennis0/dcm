import { SETTINGS } from "../settings.mjs"

export function getAllItems(type) {
    return game.packs.filter(p => p.metadata.type === "Item")
        .map(
            p => p.index.filter(item => item.type === type).map(item => item.uuid)
        ).flat()
}

export async function makeJournal(title, sheet, journalType, folder=null) {

    //Delete existing journal if present
    const existingJournal = game.journal.filter(p => p.folder === folder 
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

export async function makePage(title, content, level=null, sort=null) {
//Make a basic page with title and content
    return {
        _id: foundry.utils.randomID(),
        name: title,
        text: {content: content},
        title: {level},
        sort: sort
    };
}


export async function addPages(journal, pages) {
    const embeddedPages = []
    for (const p of pages) {
        embeddedPages.push((await journal.createEmbeddedDocuments("JournalEntryPage", [p]))[0])
    }
    return embeddedPages
}


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
