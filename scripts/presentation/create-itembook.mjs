import { getSetting, SETTINGS } from "../settings.mjs";
import { makeJournal, getAllItems, addPages, makePage, htmlTable } from "./common.mjs";

function makeItemPage(title, itemUuid) {
    return makePage(
        title,
        `<p>@Embed[${itemUuid} caption=false]</p>`,
        1
    )
}

function makeIndexPage(label, itemGroups) {
    const entries = [...itemGroups.keys().map(
        k => {
            const entries = itemGroups.get(k).pages.map(page => `<li>@UUID[.${page.id}]{${page.name}}</li>`).join("\n")
            return `<ul class="columns-two">${entries}</ul>`
        }
    )]

    const content = `<p>The following ${label} can be used to build your character</p>${entries}`

    return makePage(
        label,
        content,
        1,
        -1
    )
}

async function makeBackgroundIndexPage(label, itemGroups) {

    const entries = await Promise.all([...itemGroups.keys().map(
        async k => {
            if (!CONFIG.dndContentManager.systemV3 && CONFIG.dndContentManager.modernRules) {
                return createBackgroundTable(itemGroups.get(k).items)
            } else {
                const list = itemGroups.get(k).pages.map(item => `<li>@UUID[.${item.id}]{${item.name}}</li>`).join("\n")
                return `<ul class="columns-two">${list}</ul>`
            }
            
        }
    )])

    const content = `<p>The following ${label} can be used to build your character</p>${entries.join("<hr/>")}`

    return makePage(
        label,
        content,
        1,
        -1
    )
}

function makeGroupedIndexPage(label, itemTypeMap) {
    const pageOrder = [...itemTypeMap.keys()].sort((a,b) => a.localeCompare(b))
    const entries = pageOrder.map(
        k => {
            const itemGroup = itemTypeMap.get(k);
            const pageId = itemGroup.page.id;
            const entries = itemGroup.items.map(item => `<li>@UUID[.${pageId}#${item.name.slugify()}]{${item.name}}</li>`).join("\n")
            
            //Add headers only if there is more than one type
            if (itemTypeMap.size > 0) {
                return `<h2>${itemGroup.label}</h2><ul class="columns-two">${entries}</ul>`
            } else {
                return `<ul class="columns-two">${entries}</ul>`
            }
            
        }
    )

    const content = `<p>The following ${label} can be used to build your character</p>${entries}`

    return makePage(
        label,
        content,
        1,
        -1
    )
}

function makeCombinedPage(label, items) {
    const content = items.map(
        item => 
            `<h2>@UUID[${item.uuid}]{${item.name}}</h2><p>@Embed[${item.uuid} caption=false inline=true]</p><hr/>`
    ).join("\n")

    return makePage(
        label, 
        content, 
        1
    )

}


/**
 * Formats an array of ability scores into a readable string
 * 
 * @param {Array<string>} abilities - Array of ability score labels
 * @returns {string} Formatted string (e.g., "Strength, Dexterity and Constitution" or "Any")
 */
function formatAbilityScoreText(abilities) {
    if (abilities.length === 6) return "Any";
    
    return abilities.length === 1 
        ? abilities[0] 
        : `${abilities.slice(0, -1).join(", ")} and ${abilities[abilities.length - 1]}`;
}


/**
 * Creates an HTML table displaying background information including ability scores and feats
 * 
 * @param {Array<string>} backgrounds - Array of background UUIDs to process
 * @returns {Promise<string>} HTML table containing background information
 * 
 * Table Format:
 * | Background (linked) | Ability Score Improvements | Feat (linked) |
 */
async function createBackgroundTable(backgrounds) {
    // Define table column headers
    const headers = ["Background", "Ability Scores", "Feat"];
    
    // Process each background to create table rows
    const rows = await Promise.all(backgrounds.map(async backgroundUuid => {
        // Load background data from UUID
        const background = await fromUuid(backgroundUuid);
        
        // Initialize default row with linked background name
        const tableRow = [
            `@UUID[${background.uuid}]{${background.name}}`,
            'Not Set',
            'Not Set'
        ];
        
        // If no advancement data, return default row
        const adv = background.advancement;
        if (!adv) return tableRow;
        
        // Process Ability Score Improvements
        if (adv.byType.AbilityScoreImprovement?.length > 0) {
            const abilityConfig = adv.byType.AbilityScoreImprovement[0].configuration;
            
            // Get available ability score options (those not locked)
            const allowedAbilities = Object.keys(abilityConfig.fixed)
                .filter(ability => !abilityConfig.locked.has(ability))
                .map(ability => CONFIG.DND5E.abilities[ability].label);
            
            // Format ability score text
            tableRow[1] = formatAbilityScoreText(allowedAbilities);
        }
        
        // Process Feat Grants
        if (adv.byType.ItemGrant?.length > 0) {
            for (const grant of adv.byType.ItemGrant) {
                // Load and filter for feat items
                const grantedItems = await Promise.all(
                    grant.configuration.items.map(item => fromUuid(item.uuid))
                );
                const feats = grantedItems.filter(item => item?.type === "feat");
                
                // Add first feat found to table
                if (feats.length > 0) {
                    tableRow[2] = `@UUID[${feats[0].uuid}]{${feats[0].name}}`;
                    break; // Stop after finding first feat
                }
            }
        }
        
        return tableRow;
    }));
    
    // Generate and return final HTML table
    return htmlTable(headers, rows);
}

/**
 * Creates pages for all items and sorts both pages and items in matching order
 * @param {Array} items - Array of item UUIDs
 * @returns {Promise<{sortedPages: Array, sortedItems: Array}>} Sorted arrays of pages and items
 */
async function createSortedItemPages(items) {
    // Create array of page and item pairs
    const pairs = await Promise.all(items.map(async itemUuid => {
        const item = await fromUuid(itemUuid);
        const page = await makeItemPage(item.name, item.uuid);
        return {
            page,
            item: itemUuid,
            name: item.name // Store name for sorting
        };
    }));
    
    // Sort pairs by name
    pairs.sort((a, b) => a.name.localeCompare(b.name));
    
    // Separate sorted pairs back into pages and items
    return {
        sortedPages: pairs.map(pair => pair.page),
        sortedItems: pairs.map(pair => pair.item)
    };
}

/**
 * Determines if custom content should be used based on settings and content availability
 * @param {Array} content - Custom content array from settings
 * @returns {boolean} Whether to use custom content
 */
function shouldUseCustomContent(itemtype, content) {
    return getSetting(SETTINGS[itemtype].enabled) && content.length > 0;
}

/**
 * Creates appropriate index page based on item type
 * @param {string} itemtype - Type of items in the journal
 * @param {Array} pages - Array of journal pages
 * @returns {Promise<Page>} The created index page
 */
async function createIndexPage(itemtype, items, pages) {
    const indexData = new Map([
        [itemtype, {
            label: SETTINGS[itemtype].label,
            items: items,
            pages: pages
        }]
    ]);
    
    return itemtype === "background"
        ? await makeBackgroundIndexPage(SETTINGS[itemtype].label, indexData)
        : await makeIndexPage(SETTINGS[itemtype].label, indexData);
}


/**
 * Creates an itembook journal with pages for each item and an index page
 * @param {string} itemtype - Type of items to include in the journal (e.g., "background")
 * @param {string} folder - Destination folder for the journal
 * @param {string} sheet - Sheet template to use
 * @returns {Promise<Journal>} The created journal with all pages
 */
export async function createItembook(itemtype, folder, sheet) {
    // Get configuration settings for this item type
    const content = getSetting(SETTINGS[itemtype].content);
    
    // Determine which items to include - either from content setting or get all items
    const items = (shouldUseCustomContent(itemtype, content) 
        ? content 
        : getAllItems(SETTINGS[itemtype].subtype))
    
    // Create individual pages for each item, sorted alphabetically
    const { sortedPages, sortedItems } = await createSortedItemPages(items);

    // Create the main journal
    const journal = await makeJournal(
        SETTINGS[itemtype].label,
        sheet,
        itemtype,
        folder
    );
    
    // Add item pages to journal
    await addPages(journal, sortedPages);
    
    // Create and add appropriate index page
    const indexPage = await createIndexPage(itemtype, sortedItems, journal.pages);
    await addPages(journal, [indexPage]);
    
    return journal;
}




export async function createGroupedItembook(itemtype, defaultName, folder, sheet) {
    const content = getSetting(SETTINGS[itemtype].content)
    const items = getSetting(SETTINGS[itemtype].enabled) && content.length > 0 ? 
        content : getAllItems(SETTINGS[itemtype].subtype);

    const itemTypeMap = new Map();
    await Promise.all(items.map(async itemUuid => {
        const item = await fromUuid(itemUuid);
        const type = item.system.type.subtype || "unknown"
        if (!itemTypeMap.has(type)) {
            itemTypeMap.set(type, 
                {
                    label: item.system.type.label ? item.system.type.label + "s" : defaultName,
                    items: [item]
                }
            )
        } else {
            itemTypeMap.get(type).items.push(item)
        }
    }))

    await Promise.all(itemTypeMap.keys()
        .map(async k => {
            const itemGroup = itemTypeMap.get(k)
            const items = itemGroup.items.sort((a,b) => a.name.localeCompare(b.name));
            itemGroup.page = await makeCombinedPage(itemGroup.label, items)
            return itemGroup.page
        }
    ))

    const journal = await makeJournal(SETTINGS[itemtype].label, sheet, itemtype, folder)
    
    await Promise.all([...itemTypeMap.keys()].sort((a,b) => a.localeCompare(b))
        .map(async k => {
            const itemGroup = itemTypeMap.get(k);
            itemGroup.page = (await addPages(journal, [itemGroup.page]))[0]
            return itemGroup
        }
    ))

    const index = await makeGroupedIndexPage(SETTINGS[itemtype].label, itemTypeMap)

    await addPages(journal, [index])
    return journal

}