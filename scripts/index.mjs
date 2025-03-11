import { getContent } from "./content-management.mjs";
import { log } from "./lib.mjs";
import { getSetting, SETTINGS } from "./settings.mjs";
import { getSources } from "./source-management.mjs";


export class DCMIndex extends Object {
    constructor() {
        super();
        this.needsRebuild = false;
        this.itemTypeToIndexMap = new Map();
        this.permittedItemIndices = new Map();
    }

    //Create mapping from item subtypes to indexes
    static _buildIndexMap() {
        const filters = new Map();
        for (const s of SETTINGS.itemtypes) {
            if (SETTINGS[s].type !== "Item") {
                continue
            }
            if (s === "items") {
                SETTINGS.items.item_subtypes.forEach(s => filters[s] = "items")
                continue
            }
            filters[SETTINGS[s].subtype] = s
        }
        return filters
    };

    //Create efficient indexes to check item UUIDs
    static  _buildItemIndices() {
        const index = new Map();
        for (const s of SETTINGS.itemtypes) {
            //Dont apply to any item types that are disabled or have no items selected
            if (!getSetting(SETTINGS[s].enabled) || getSetting(SETTINGS[s].content).length === 0) {
                continue
            }
            index[s] = {items: new Set(getContent(s)), sources: new Set(getSources(s))}
        }
        return index;
    };

    rebuild() {
        log("Rebuilding DCM Index")
        this.itemTypeToIndexMap = DCMIndex._buildIndexMap();
        this.permittedItemIndices = DCMIndex._buildItemIndices();
    }

    itemInIndex(documentType, subType, uuid) {
        
        //If not an item don't filter (we don't consider spell lists here)
        if (documentType !== "Item") {
            return true
        }

        //If no index for this item type, don't filter
        if (!this.itemTypeToIndexMap[subType]) {
            return true;
        }

        const indexName = this.itemTypeToIndexMap[subType];
        if (!this.permittedItemIndices[indexName]) {
            return true
        }

        //Have to reparse UUID as they sometimes use a slightly different format
        const parsedUuid = foundry.utils.parseUuid(uuid);

        //If compendium isn't considered an enabled source, skip item
        //No metadata case is for world items which currently are kept enabled
        if (parsedUuid.collection.metadata &&
                !this.permittedItemIndices[indexName].sources.has(parsedUuid.collection.metadata.id)) {
            return false;
        } else if (!parsedUuid.collection.metadata) {
            return true;
        }

        //Finally check if in index
        return this.permittedItemIndices[indexName].items.has(parsedUuid.uuid)
    }

    spotlightItemInIndex(item) {
        return this.itemInIndex(item.documentName, item.type, item.uuid)
    }

    quickInsertItemInIndex(item) {
        return this.itemInIndex(item.documentType, item.subType, item.uuid)
    }

    compendiumBrowserItemInIndex(item) {
        return this.itemInIndex("Item", item.type, item.uuid)
    }

    itemTypeInIndex(item) {
        const indexName = this.getItemIndexType(item)
        if (indexName === null) {
            return false;
        }

        const itemIndex = this.permittedItemIndices[indexName];
        if (itemIndex === undefined || itemIndex === null) {
            return false;
        }
        return true;
    }

    itemSourceInIndex(item) {

        if (!this.itemTypeInIndex(item)) {
            return false;
        }

        const parsedUuid = foundry.utils.parseUuid(item.uuid);

        return this.permittedItemIndices[this.itemTypeToIndexMap[item.type]]
            .sources
            .has(parsedUuid.collection.metadata.id)
    }

    getItemIndexType(item) {
        const indexName = this.itemTypeToIndexMap[item.type];
        if (indexName === undefined || indexName === null) {
            return null;
        }
        return indexName;
    }

}