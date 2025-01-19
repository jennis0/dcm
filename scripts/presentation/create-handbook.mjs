import { log } from "../lib.mjs";
import { createClassbook } from "./create-classbook.mjs";
import { createGroupedItembook, createItembook } from "./create-itembook.mjs";

/**
 * Creates various player handbook journals based on provided options
 * 
 * @param {Object} options - Configuration options for handbook creation
 * @param {string} [options.folderTitle] - Title of the folder to store journals in
 * @param {boolean} [options.existingPages] - Whether to reuse existing pages
 * @param {string} [options.styleOption] - Style template to use for journals
 * @param {boolean} [options.class] - Whether to create class handbook
 * @param {boolean} [options.races] - Whether to create races handbook
 * @param {boolean} [options.backgrounds] - Whether to create backgrounds handbook
 * @param {boolean} [options.feats] - Whether to create feats handbook
 * @returns {Promise<void>} Resolves when all handbooks are created
 */
export async function createHandbooks(options) {
    // Get or create the target folder if specified
    let folder = null;
    if (options.folderTitle) {
        folder = await getOrCreateFolder(options.folderTitle);
    }
    
    // Initialize array to track handbook creation promises
    const journalPromises = [];

    console.log(options)
    
    // Create requested handbooks
    if (options.class) {
        log("Creating class handbook")
        journalPromises.push(
            createClassbook(folder, options.existingPages, options.styleOption)
        );
    }
    
    if (options.races) {
        log("Creating Species handbook")
        journalPromises.push(
            createItembook("race", folder, options.styleOption)
        );
    }
    
    if (options.backgrounds) {
        log("Creating Background handbook")
        journalPromises.push(
            createItembook("background", folder, options.styleOption)
        );
    }
    
    if (options.feats) {
        log("Creating Feat handbook")
        journalPromises.push(
            createGroupedItembook("feat", "Feats", folder, options.styleOption)
        );
    }
    
    // Wait for all handbooks to be created and notify user
    await Promise.all(journalPromises);
    ui.notifications.notify("Created player options journals");
}

/**
 * Gets an existing folder by name or creates a new one
 * 
 * @param {string} folderName - Name of the folder to find or create
 * @returns {Promise<Folder>} The existing or newly created folder
 */
async function getOrCreateFolder(folderName) {
    const existingFolder = game.journal.folders.getName(folderName);
    if (existingFolder) return existingFolder;
    
    return await Folder.create({
        name: folderName,
        type: "JournalEntry"
    });
}