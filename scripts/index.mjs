import { getContent } from "./content-management.mjs";
import { log, warn } from "./lib.mjs";
import { getSetting, SETTINGS } from "./settings.mjs";
import { getSources } from "./source-management.mjs";


export class DCMIndex extends Object {
    constructor() {
        super();
        this.needsRebuild = true;
        this.itemTypeToIndexMap = new Map();
        this.permittedItemIndices = new Map();
    }

    get() {
        if (this.needsRebuild) {
            this.rebuild()
            this.needsRebuild = false;
        }
        return this
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
    static _buildItemIndices() {
        const index = new Map();
        for (const s of SETTINGS.itemtypes) {
            //Dont apply to any item types that are disabled or have no items selected
            if (!getSetting(SETTINGS[s].enabled) || getSetting(SETTINGS[s].content).length === 0) {
                continue
            }
            const itemUuids = new Set(getContent(s));
            const sources = new Set(getSources(s));
            index[s] = { itemUuids, sources, itemIds: new Map(), itemNames: new Map() };

            // Build ID index
            itemUuids.forEach(item => {
                const parsedUuid = foundry.utils.parseUuid(item);

                if (index[s].itemIds.get(parsedUuid.id)) {
                    index[s].itemIds.get(parsedUuid.id).add(parsedUuid.uuid)
                } else {
                    index[s].itemIds.set(parsedUuid.id, new Set([parsedUuid.uuid]))
                }

                const name = parsedUuid.collection.index.get(parsedUuid.id).name
                
                if (index[s].itemNames.get(name)) {
                    index[s].itemNames.get(name).add(parsedUuid.uuid)
                } else {
                    index[s].itemNames.set(name, new Set([parsedUuid.uuid]))
                }
            });

        }
        return index;
    };

    rebuild() {
        log("Rebuilding DCM Index")
        this.itemTypeToIndexMap = DCMIndex._buildIndexMap();
        this.permittedItemIndices = DCMIndex._buildItemIndices();
    }

    itemInIndex(documentType, subType, searchValue, searchType = "uuid", acceptWorldItems=true) {
        
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

        if (searchType === "uuid" || searchType === "id") {
            //Have to reparse UUID as they sometimes use a slightly different format
            const parsedUuid = foundry.utils.parseUuid(searchValue);

            //If compendium isn't considered an enabled source, skip item
            //No metadata case is for world items which currently are kept enabled
            if (parsedUuid.collection?.metadata) {
                if (!this.permittedItemIndices[indexName].sources.has(parsedUuid.collection?.metadata.id)) {
                    return false
                }
            } else if (acceptWorldItems) {
                return true
            }

            if (searchType === "uuid") {
                return this.permittedItemIndices[indexName].itemUuids.has(parsedUuid.uuid)
            } else if (searchType === "id") {
                return this.permittedItemIndices[indexName].itemIds.has(parsedUuid.id)
            }
        }

        //Finally check if in index
        if (searchType === "name") {
            return this.permittedItemIndices[indexName].itemNames.has(item.name)
        }

        warn(`Search type ${searchType} not recognised`)
        return false
    }

    has(item, searchType="uuid", acceptWorldItems=false) {
        if (searchType === "uuid") {
            return this.itemInIndex(item.documentName, item.type, item.uuid, "uuid", acceptWorldItems)
        }
        if (searchType === "id") {
            return this.itemInIndex(item.documentName, item.type, item.uuid, "id", acceptWorldItems)
        }
        if (searchType === "name") {
            return this.itemInIndex(item.documentName, item.type, item.name, "name", acceptWorldItems)
        }
    }

    getItemInIndex(documentType, subType, searchValue, searchType = "name", acceptWorldItems=true) {
        
        //If not an item don't filter (we don't consider spell lists here)
        if (documentType !== "Item") {
            return null
        }

        //If no index for this item type, don't filter
        if (!this.itemTypeToIndexMap[subType]) {
            return null;
        }

        const indexName = this.itemTypeToIndexMap[subType];
        if (!this.permittedItemIndices[indexName]) {
            return null
        }

        if (searchType === "id") {
            //Have to reparse UUID as they sometimes use a slightly different format
            const parsedUuid = foundry.utils.parseUuid(searchValue);

            //If compendium isn't considered an enabled source, skip item
            //No metadata case is for world items which currently are kept enabled
            if (parsedUuid.collection?.metadata &&
                    !this.permittedItemIndices[indexName].sources.has(parsedUuid.collection.metadata.id)) {
                return null;
            } else if (!parsedUuid.collection?.metadata && acceptWorldItems) {
                return null;
            }

            //Finally check if in index
            if (searchType === "id") {
                return this.permittedItemIndices[indexName].itemIds.get(parsedUuid.id)
            }
        }
        
        if (searchType === "name") {
            return this.permittedItemIndices[indexName].itemNames.get(searchValue)
        }

        warn(`Search type ${searchType} not recognised`)
        return null
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

}