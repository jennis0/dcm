import { enrichSource } from '../enrich-source.mjs';
import { log } from '../lib.mjs';
import { MODULE_NAME, SETTINGS } from '../settings.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
const { diffObject, flattenObject, getProperty, setProperty, hasProperty } = foundry.utils;


export class ItemMigrateApp extends HandlebarsApplicationMixin(ApplicationV2) {

    constructor({actorUuid}) {
        super();
        this.actor = actorUuid;
        this.items = [];
        this.itemMatches = [];
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        window: {
            title: "Migrate Items",
            icon: null,
            resizeable: true
        },
        form: {
            handler: ItemMigrateApp.submitHandler,
            submitOnChange: false,
            closeOnSubmit: false
        },
        position: {
            width: 1050,
            height: "auto"
          },
        id: 'dcm-migrate-items',
        classes: ["dcm dnd5e2 dialog-lg"],
        resizable: false,
        actions: {
            pickMigrateOption: ItemMigrateApp.#handleToggleMigrate,
            openItem: ItemMigrateApp.#handleOpenItem
        }
    }

    static async #handleOpenItem(event, target) {
        event.stopPropagation();
        const uuid = target.getAttribute("name")
        console.log(target)
        console.log(uuid)
        if (uuid) {
            const item = await fromUuid(uuid);
            console.log(item);
            item.sheet.render(true)
        }
    }

    static PARTS = {
        migrate: {
            template: `modules/${MODULE_NAME}/templates/item-migrate.html`
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
          }
    }



    static injectButton() {
        Hooks.on('renderActorSheet5e', (app, html, data) => {

            const header = html.closest('.app').find('.window-header');
            if (header.find('.dcm-migrate').length === 0) {
                const button = $(`<a class="dcm-migrate pseudo-header-button" aria-label="Migrate Items"
                     data-tooltip="Migrate Items" data-tooltip-direction="DOWN">
                        <i class="fas fa-book-sparkles"></i>
                    </a>`);
                button.on('click', () => {
                    new ItemMigrateApp({ actorUuid: app.actor.uuid }).render(true);
                });
                header.find('.window-title').after(button);
            }
        });
    }

    static async submitHandler(event, formData) {
        const app = this;
        const actor = fromUuidSync(app.actor);
        const updates = [];
        const deletions = [];

        for (const itemPair of app.itemMatches) {
            const originalItemId = itemPair.original_item.id;
            const migrateIndex = itemPair.migrate;

            if (migrateIndex === -1) {
                // Leave the existing item
                continue;
            } else if (migrateIndex === -2) {
                // Remove the existing item without replacement
                deletions.push(originalItemId);
            } else {
                // Remove the existing item and replace with the selected new item
                const newItem = itemPair.newItems[migrateIndex];
                console.log(newItem);
                deletions.push(originalItemId);
                updates.push(
                    fromUuid(newItem.id)
                )
            }
        }

        await Promise.all(deletions);
        await actor.deleteEmbeddedDocuments("Item", deletions);

        await Promise.all(updates);
        await actor.createEmbeddedDocuments("Item", updates);
    }

    getChangeLabel(change) {

        const isEmpty = (value) => {
            return value === "" || value === undefined || value === null || 
                   (Array.isArray(value) && value.length === 0) || 
                   (value instanceof Set && value.size === 0) ||
                   (value instanceof Object && Object.keys(value).length === 0);
        };

        const itemKeyMap = {
            "img":"Image",
            "name":"Name"
        }

        const systemKeyMap = {
            "system.preparation.mode": "Preparation:Mode",
            "system.preparation.prepared": "Prepared",
            "system.description.value": "Description",
            "system.uses.max": "Uses:Max",
            "system.uses.recovery": "Uses:Recovery",
            "system.uses.label": "Uses:Label",
            "system.uses.value": "Uses:Available",
            "system.activation.type": "Activation:Type",
            "system.range.value": "Range",
            "system.school": "Spell School",
            "system.identifier": "Identifier",
        }

        const backups = {
            "system.activation": "Activation",
            "system.duration": "Duration",
            "system.materials": "Materials",
            "system.range": "Range",
            "system.target": "Target",
        }

        let label = change.key;

        //Ignore labels as they are derived from other values
        if (!label.startsWith("labels")) {
        
            if (change.type === "item") {
                if (change.key in itemKeyMap) {
                    label = itemKeyMap[change.key]
                }
            }

            if (change.type === "system") {
                if (change.key in systemKeyMap) {
                    label = systemKeyMap[change.key]
                }
                for (const k in backups) {
                    if (change.key.startsWith(k)) {
                        label = backups[k] +":"+ change.key.slice(k.length + 1, k.length+2).toUpperCase() + change.key.slice(k.length+2)
                    }
                }
            }
        }

        let from = change.compendiumValue;
        if (isEmpty(from)) {
            from = "None"
        }
        if (typeof from === "object") {
            from = JSON.stringify(from)
        }

        let to = change.actorValue;
        if (isEmpty(to)) {
            to = "None"
        }
        if (typeof to === "object") {
            to = JSON.stringify(to)
        }

        change.from = from
        change.to = to;
        change.label = label;

        return change
    }

    getPotentialChanges(diffs, item) {
        const changes = [];

        for (const diff of diffs) {
            console.log(diff);
            console.log(diff.key, hasProperty(item, diff.key))
            if (!hasProperty(item, diff.key)) {
                changes.push({
                    key: diff.key,
                    label: diff.label,
                    possible: false,
                    from: "-",
                    to: "-"
                })
                continue
            }

            changes.push({
                key: diff.key,
                label: diff.label,
                possible: true,
                from: getProperty(item, diff.key),
                to: diff.to
            })
        }

        return changes
    }

    getDiff(actorItem, sourceItem) {
        console.log(actorItem)
        const changes = []

        console.log(sourceItem);

        const compendiumDiffs = diffObject(actorItem, sourceItem);
        const actorDiffs = diffObject(sourceItem, actorItem);

        const cdFlat = flattenObject(compendiumDiffs);
        const adFlat = flattenObject(actorDiffs);

        const isEmpty = (value) => {
            return value === "" || value === undefined || value === null || 
                   (Array.isArray(value) && value.length === 0) || 
                   (value instanceof Set && value.size === 0);
        };


        for (const k in cdFlat) {
            //Things we ignore due to handlign separately or not being relevant
            if (k.startsWith("system.activities") || k.startsWith("_stats") ||
                k.startsWith("system.source") || k.startsWith("ownership") ||
                k === "sort" || k.startsWith("labels") ) {
                continue
            }

            //Handle empty edits caused by editing item at all
            if (isEmpty(adFlat[k]) && isEmpty(cdFlat[k])) {
                continue
            }

            changes.push({
                type:k.startsWith("system") ? "system" : "item",
                key: k,
                compendiumValue: cdFlat[k],
                actorValue: adFlat[k]
            });
        }

        //Handle activities separately
        // if (compendiumDiffs.system.activities) {
        //     for (const [index, k] of Array.from(compendiumDiffs.system.activities.keys()).entries()) {
        //         const origA = actorItem.system.activities.get(k);
        //         const sourA = sourceItem.system.activities.get(k);

        //         console.log(origA)
        //         console.log(sourA)
   
        //         const oAFlat = flattenObject(diffObject(origA, sourA))
        //         const aAFlat = flattenObject(diffObject(sourA, origA))

        //         for (const k2 in oAFlat) {       
        //             //Handle empty edits caused by editing item at all
        //             if (isEmpty(aAFlat[k]) && isEmpty(oAFlat[k])) {
        //                 continue
        //             }
        
        //             changes.push({
        //                 type: "activity",
        //                 activityType: origA.type,
        //                 activityName: origA.name,
        //                 activityId: k,
        //                 activityIndex: index,
        //                 key: k2,
        //                 compendiumValue: oAFlat[k2],
        //                 actorValue: aAFlat[k2]
        //             });
        //         }      
        //     }
        // }

        changes.forEach(c => this.getChangeLabel(c))

        console.log(changes)
        return changes;
    }

    async _prepareContext(options) {

        log("In prepare context")

        const index = CONFIG.dndContentManager.index.get();

        const context = await super._prepareContext(options);
        const origActor = await fromUuid(this.actor);

        const copyActorData = duplicate(origActor);
        copyActorData.name = `${origActor.name} (Copy)`;
        delete copyActorData._id;
        const copyActor = await Actor.create(copyActorData);
        
        if (this.items.length === 0) {
            this.items = copyActor.items.filter(
            i => {
                if (i.type !== "spell" && !SETTINGS.items.item_subtypes.includes(i.type)) {
                return false;
                }
                if (i._stats.compendiumSource) {
                return !index.itemInIndex("Item", i.type, i._stats.compendiumSource, "uuid");
                }
                return false;
            }
            );

            this.itemMatches = [];

            //Instantiate copies of the original items to compare against
            const originalItemsData = await Promise.all(this.items.map(async item => {
                return await fromUuid(item._stats.compendiumSource);
            }));
            console.log(originalItemsData)
            const originalItems = await copyActor.createEmbeddedDocuments("Item", originalItemsData);

            for (const [arrayIndex, item] of this.items.entries()) {
                const matchedItems = index.getItemInIndex("Item", item.type, item.name, "name") || new Set();
                const originalItem = originalItems[arrayIndex];
                const formattedChanges = this.getDiff(item, originalItem);

                const newItems = await Promise.all(matchedItems.map(async (newItemUuid, itr) => {
                    const newItem = await fromUuid(newItemUuid);
                    const createdItems = await copyActor.createEmbeddedDocuments("Item", [newItem.toObject()]);
                    const createdItem = createdItems[0];
                    foundry.utils
                    return {
                        name: newItem.name,
                        img: newItem.img,
                        type: newItem.type,
                        id: newItem.uuid,
                        src: enrichSource(newItem.system.source, newItem.uuid),
                        migrate: itr,
                        itemData: createdItem,
                        changes: this.getPotentialChanges(formattedChanges, newItem)
                    };
                }));

                this.itemMatches.push({
                    original_item: {
                        name: item.name,
                        img: item.img,
                        type: item.type,
                        id: item.id,
                        uuid: item.uuid,
                        migrate: -1,
                        changes: formattedChanges,
                        src: enrichSource(item.system.source, item.uuid)
                    },
                    newItems: newItems,
                    migrate: matchedItems.size > 0 ? 0 : -1
                });
            }
        }

        console.log(copyActor);
        copyActor.delete();

        context.items = this.itemMatches
        context.buttons = [
            { type: "cancel", icon: "fas fa-times", label: "Cancel"},
            { type: "submit", icon: "fas fa-arrow-right", label: "Migrate" }
        ];

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.item-card').on('click', this._onToggleMigrate.bind(this));
    }

    static #handleToggleMigrate(event, target) {
        const itemId = target.getAttribute("name");
        const index = parseInt(target.getAttribute("data-index"));
        const item = this.itemMatches.find(i => i.original_item.id === itemId);
        if (item) {
            item.migrate = index;

            // Remove 'is-selected' class from all item cards in the pair
            const itemPair = target.closest('.item-pair');
            itemPair.querySelectorAll('.item-card').forEach(card => card.classList.remove('is-selected'));

            // Add 'is-selected' class to the clicked item card
            target.classList.add('is-selected');
        }
    }
}