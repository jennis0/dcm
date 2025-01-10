import { log } from "./lib.mjs";
import { getSetting, SETTINGS } from "./settings.mjs";


export class DCMIndex extends Object {
    constructor() {
        super();
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
            //Dont apply to any item types that are disabled
            if (!getSetting(SETTINGS[s].enabled) || getSetting(SETTINGS[s].content).length === 0) {
                continue
            }
            index[s] = new Set(getSetting(SETTINGS[s].content))
        }
        return index;
    };

    rebuild() {
        log("Rebuilding DCM Index")
        this.itemTypeToIndexMap = DCMIndex._buildIndexMap();
        this.permittedItemIndices = DCMIndex._buildItemIndices();
    }

    spotlightItemInIndex(item) {

        if (item.documentName !== "Item") {
            return true
        }

        if (!this.itemTypeToIndexMap[item.type]) {
            return true;
        }

        const indexName = this.itemTypeToIndexMap[item.type];

        if (!this.permittedItemIndices[indexName]) {
            return true
        }

        //Have to reparse UUID as they sometimes use a slightly different format
        const uuid = foundry.utils.parseUuid(item.uuid);
        return this.permittedItemIndices[indexName].has(uuid.uuid)
    }

    quickInsertItemInIndex(item) {

        if (item.documentType !== "Item") {
            return true
        }

        if (!this.itemTypeToIndexMap[item.subType]) {
            return true;
        }

        const indexName = this.itemTypeToIndexMap[item.subType];

        if (!this.permittedItemIndices[indexName]) {
            return true
        }

        //Have to reparse UUID as they sometimes use a slightly different format
        const uuid = foundry.utils.parseUuid(item.uuid);
        return this.permittedItemIndices[indexName].has(uuid.uuid)
    }

}