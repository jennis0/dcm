import {getSetting, SETTINGS} from '../settings.mjs';
import { getAllItems, makeJournal, makePage, addPages, makeSpellPage } from './common.mjs';


/**
 * Builds an index of existing class and subclass pages from all journal entry packs
 * Maps item UUIDs to their corresponding journal pages
 * 
 * @returns {Promise<Map<string, JournalEntryPage>>} Map of item UUIDs to existing pages
 */
async function buildExistingPageIndex() {
    // Get all journal entry packs and their documents
    const allPacks = game.packs.filter(pack => pack.metadata.type === "JournalEntry");
    const documents = await Promise.all(allPacks.map(pack => pack.getDocuments()));
    const flattenedDocs = documents.flat();
    
    // Extract class and subclass pages with their item UUIDs
    const classPages = flattenedDocs
        .map(doc => doc.pages
            .filter(page => page.type === "class" || page.type === "subclass")
            .map(page => [page.system.item, page])
        )
        .flat();
    
    return new Map(classPages);
}

/**
 * Creates or retrieves an existing class journal page
 * 
 * @param {Map} existingPages - Map of existing pages indexed by item UUID
 * @param {string} title - Title of the class
 * @param {string} classUuid - UUID of the class item
 * @param {string} content - Description content for the class
 * @returns {Promise<JournalEntryPage>} The created or retrieved class page
 */
async function makeClassPage(existingPages, title, classUuid, content) {
    // Return existing page if found
    if (existingPages.has(classUuid)) {
        const page = existingPages.get(classUuid);
        await page.update({ sort: null });
        return page;
    }
    
    // Create new class page
    return {
        name: title,
        type: "class",
        sort: null,
        system: new dnd5e.dataModels.journal.ClassJournalPageData({
            item: classUuid,
            name: title,
            description: content
        }),
    };
}

/**
 * Creates a spell list journal entry
 * 
 * @param {string} className - Name of the target class
 * @param {string} classIdentifier - Identifier of the target class
 * @returns {JournalEntryPageData} The created or retrieved class page
 */
function makeCombinedSpellList(className, classIdentifier) {

    // Don't try and make a spell list if still on v3.3.1
    if (CONFIG.dndContentManager.systemV3) {
        return null;
    }

    // Get class spells
    const spells = game.system.registry.spellLists.forType("class", classIdentifier)
    
    // Return null if no spells registered for class
    if (!spells) {
        return null;
    }

    // Restrict to spells which are accepted (or take all if spell filtering disabled)
    const filteredSpells = getSetting(SETTINGS.spell.enabled) 
        && CONFIG.dndContentManager.index.permittedItemIndices?.spell?.items.size > 0? 
            [...spells.uuids.filter(u => CONFIG.dndContentManager.index.itemInIndex("Item", "spell", u))] :
            [...spells.uuids]

    // Create new spell list page data
    return makeSpellPage(
        `${className} Spell List`,
        filteredSpells,
        2
    )
}

/**
 * Creates or retrieves an existing subclass journal page
 * 
 * @param {Map} existingPages - Map of existing pages indexed by item UUID
 * @param {string} title - Title of the subclass
 * @param {string} subclassUuid - UUID of the subclass item
 * @param {string} content - Description content for the subclass
 * @returns {Promise<JournalEntryPage>} The created or retrieved subclass page
 */
async function makeSubclassPage(existingPages, title, subclassUuid, content) {
    // Return existing page if found
    if (existingPages.has(subclassUuid)) {
        const page = existingPages.get(subclassUuid);
        await page.update({ 
            title: { level: 2 }, 
            sort: null 
        });
        return page;
    }
    
    // Create new subclass page
    return {
        name: title,
        type: "subclass",
        title: { level: 2 },
        sort: null,
        system: new dnd5e.dataModels.journal.SubclassJournalPageData({
            item: subclassUuid,
            name: title,
            description: content
        })
    };
}

/**
 * Creates a journal containing pages for classes and their subclasses
 * 
 * @param {string} folder - Destination folder for the journal
 * @param {boolean} useExistingPages - Whether to reuse existing pages
 * @param {string} sheet - Sheet template to use
 * @returns {Promise<Journal>} The created journal with all class and subclass pages
 */
export async function createClassbook(folder, useExistingPages, sheet) {
    // Get classes based on settings or get all available classes
    const classes = getSetting(SETTINGS.class.enabled)
        ? getSetting(SETTINGS.class.content) 
        : await getAllItems("class");
    
    // Get subclasses based on settings or get all available subclasses
    const subclasses = getSetting(SETTINGS.subclass.enabled)
        ? getSetting(SETTINGS.subclass.content)
        : await getAllItems("subclass");
    
    // Build index of existing pages if requested
    const existingPageIndex = useExistingPages 
        ? await buildExistingPageIndex() 
        : new Map();
    
    // Create pages for each class and store with their identifiers
    const classPages = await Promise.all(classes.map(async classUuid => {
        const cls = await fromUuid(classUuid);
        return [
            cls.system.identifier,
            await makeClassPage(existingPageIndex, cls.name, cls.uuid, cls.description),
            makeCombinedSpellList(cls.name, cls.system.identifier)
        ];
    }));
    
    // Initialize class map with "unknown" category for orphaned subclasses
    const classMap = new Map();
    classMap.set('unknown', {
        page: await makePage("Unknown Class", "<p>These subclasses are for an unknown class</p>"),
        subclassPages: []
    });
    
    // Populate class map with class pages
    classPages.forEach(([classId, page, spellListPage]) => 
        classMap.set(classId, { page, subclassPages: [], spellListPage})
    );
    
    // Process subclasses and add them to their respective class entries
    await Promise.all(subclasses.map(async subclassUuid => {
        const cls = await fromUuid(subclassUuid);
        const targetClass = classMap.get(cls.system.classIdentifier) || classMap.get("unknown");
        
        const subclassPage = await makeSubclassPage(
            existingPageIndex,
            cls.name,
            cls.uuid,
            cls.description
        );
        
        targetClass.subclassPages.push(subclassPage);
    }));
    
    // Sort subclass pages alphabetically for each class
    classMap.forEach(classData => {
        classData.subclassPages.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    // Remove "unknown" category if empty
    if (classMap.get("unknown").subclassPages.length === 0) {
        classMap.delete("unknown");
    }
    
    // Sort classes alphabetically and flatten into single page array
    const sortedClassIds = Array.from(classMap.keys()).sort((a, b) => 
        classMap.get(a).page.name.localeCompare(classMap.get(b).page.name)
    );
    
    const allPages = [];
    sortedClassIds.forEach(classId => {
        const classData = classMap.get(classId);
        allPages.push(classData.page);

        if (classData.spellListPage) {
            allPages.push(classData.spellListPage)
        }

        allPages.push(...classData.subclassPages);
    });
    
    // Delete existing class journal if present
    const existingJournal = game.journal.filter(journal => 
        journal.folder === folder && 
        journal.name === "Classes" && 
        journal.flags.dcm.journalType === "class"
    );
    
    if (existingJournal.length > 0) {
        await existingJournal[0].delete();
    }
    
    // Create and populate new journal
    const journal = await makeJournal("Classes", sheet, "class", folder);
    await addPages(journal, allPages);
    
    return journal;
}