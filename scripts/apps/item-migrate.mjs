import { enrichSource } from '../enrich-source.mjs';
import { log } from '../lib.mjs';
import { MODULE_NAME, SETTINGS } from '../settings.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api


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
            closeOnSubmit: true
        },
        position: {
            width: 650,
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

    static #handleOpenItem(event, target) {
        event.stopPropagation();
        const uuid = target.getAttribute("name")
        console.log(uuid)
        if (uuid) {
            const item = fromUuidSync(uuid);
            item.render(true)
        }
    }

    static PARTS = {
        enable: {
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

    static submitHandler() {

    }

    async _prepareContext(options) {

        log("In prepare context")

        const index = CONFIG.dndContentManager.index.get();

        const context = await super._prepareContext(options);
        const actor = fromUuidSync(this.actor);
   
        if (this.items.length === 0) {
            this.items = actor.items.filter(
                i => {
                    if (i.type !== "spell" && !SETTINGS.items.item_subtypes.includes(i.type)) {
                        return false
                    }
                    if (i._stats.compendiumSource) {
                        return  !index.itemInIndex("Item", i.type, i._stats.compendiumSource, "uuid")
                    }
                    return false;
                }
            )

            this.itemMatches = this.items
            .map(item => {
                const matchedItems = index.getItemInIndex("Item", item.type, item.name, "name") || new Set();
                console.log(matchedItems.size)
                return { 
                    original_item: {
                        name: item.name,
                        img: item.img,
                        type: item.type,
                        id: item.id,
                        migrate: -1,
                        src: enrichSource(item.system.source, item.uuid)
                    },
                    newItems: 
                        matchedItems.map((newItemUuid, itr) => {
                            const newItem = fromUuidSync(newItemUuid);
                            return {
                                name: newItem.name,
                                img: newItem.img,
                                type: newItem.type,
                                id: newItem.id,
                                src: enrichSource({}, newItem.uuid),
                                migrate: itr
                            }
                        }),
                    migrate: matchedItems.size > 0 ? 0 : -1
                }
            })
        }

        context.items = this.itemMatches

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.item-card').on('click', this._onToggleMigrate.bind(this));
    }

    static #handleToggleMigrate(event, target) {
        const itemId = target.getAttribute("name");
        const item = this.itemMatches.find(i => i.original_item.id === itemId);
        if (item) {
            item.migrate = parseInt(target.getAttribute("data-index"));
            console.log(item)
            this.render(false);
        }
    }
}