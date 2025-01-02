import { MODULE_NAME, SETTINGS } from "../constants.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class ContentSelector extends HandlebarsApplicationMixin(ApplicationV2) {
    //Allow a GM to select approved content for their game
    constructor() {
        super();
        this.tabGroups.primary = "class";
    }

    static DEFAULT_OPTIONS = {
            tag: "form",
            window: {
                title: "Choose Available Content",
                icon: "fas fa-ballot-choice",
                resizeable: true
            },
            id: 'content-selector',
            classes: ["dcm dnd5e2 dialog-lg compendium-browser selector"],
            position: {
                width: 800,
                height: 650
              },
            resizable: false,
            actions: {
                selectPack: ContentSelector.#onSelectPack,
                selectAll: ContentSelector.#onSelectAll,
                changeTab: ContentSelector.#onChangeTab,
                openItem: ContentSelector.#onOpenItem
              },
    }

    static async #onOpenItem(event, target) {
        const item = await fromUuid(target.getAttribute("data-id"))
        if (item) {
            item.sheet.render(true)
        }
    }

    static async #onSelectAll(event, target) {
        //Add/remove all members of this group

        const category = target.getAttribute("category")
        const checked = target.checked;
        const packs = target.closest(".packs-list").querySelectorAll("dnd5e-checkbox[data-action=selectPack]")

        if (!checked) {
            target.indeterminate = false;
        }

        const sc = game.settings.get(MODULE_NAME, SETTINGS[category].content);
        let selectedContent = new Set(sc);
        for (const p of packs) {
            p.checked = checked;

            if (checked) {
                selectedContent.add(p.name)
            }
            else {
                selectedContent.delete(p.name)
            }
        } 
        
        await game.settings.set(MODULE_NAME, SETTINGS[category].content, Array.from(selectedContent))
    }

    static async #onSelectPack(event, target) {
        //Set pack 'All' box to correct state
        const pack_list = target.closest(".packs-list")
        const all_box = pack_list.querySelector("dnd5e-checkbox[data-action=selectAll]")
        const siblings = pack_list.querySelectorAll("dnd5e-checkbox[data-action=selectPack]")
        
        //Check number of siblings currently turned on
        if (all_box !== null & all_box !== undefined) {
            let n_on = 0;
            for (const cb of siblings) {
                if (cb.checked) {
                    n_on += 1;
                }
            }
            all_box.checked = n_on > 0;
            all_box.indeterminate = all_box.checked & n_on < siblings.length;
        }

        //Update setting
        const category = target.getAttribute("category")
        let content = game.settings.get(MODULE_NAME, SETTINGS[category].content) || [];
        if (target.checked) {
            content.push(target.name);
        } else {
            const index = content.indexOf(target.name);
            if (index !== -1) {
                content.splice(index, 1);
            }
        }
        await game.settings.set(MODULE_NAME, SETTINGS[category].content, content);
    }

    static #onChangeTab(event, target) {
        this.tabGroups.primary = target.getAttribute("category")
        this.render(false);
    }

    static PARTS = {
        sidebar: {
            id: "sidebar",
            template: `modules/${MODULE_NAME}/templates/parts/tab-selector.html`
        },
        content: {
            id: "packs",
            template: `modules/${MODULE_NAME}/templates/parts/content-selector.html`
        },
    }

    _getSourceName(sourceType, sourceId) {
        if (sourceType === "world") {
            return "World";
        };
        if (sourceType === "system") {
            return "D&D 5E Core";
        };
        return game.modules.get(sourceId).title;
    }

    _getClasses(docs, selectedOptions) {
        return docs.filter(d => d.type === "class")
            .map(
                d => {return {
                    uuid: d.uuid,
                    checked: selectedOptions.has(d.uuid),
                    label: d.name,
                    source: d.system.source.value,
                    metadata: null,
                    img: d.img
                }}
            ).sort((a,b) => a.label.localeCompare(b.label))
    }

    _getSublasses(docs, selectedOptions) {
        return docs.filter(d => d.type === "subclass")
        .map(
            d => {return {
                uuid: d.uuid,
                checked: selectedOptions.has(d.uuid),
                label: d.name,
                source: d.system.source.value,
                metadata: d.system.classIdentifier,
                img: d.img
            }}
        ).sort((a,b) => a.metadata.localeCompare(b.metadata) || a.label.localeCompare(b.label))
    }

    _getSpellLists(docs, selectedOptions) {
        return docs.map(d => d.pages.filter(p => p.type === "spells")
            .map(p => { return {
                uuid: p.uuid,
                label: p.name,
                checked: selectedOptions.has(p.uuid),
                metadata: p.system.identifier || "No identifier",
                source: d.name || "Untitled Journal",
                img: "systems/dnd5e/icons/spell-tiers/spell3.webp"
            }

        })).flat()
    }

    _getFeats(docs, selectedOptions) {
        const items = docs.filter(d => d.type === "feat" && d.system.type.value === "feat")
            .map(d => {
                return {
                    uuid: d.uuid,
                    checked: selectedOptions.has(d.uuid),
                    label: d.name,
                    source: d.system.source.value || "No Source",
                    metadata: d.system.type.label || "Untyped",
                    img: d.img
                }
            }).sort((a,b) => a.metadata?.localeCompare(b.metadata) || a.label.localeCompare(b.label));
        return items;
    }

    async _getContentOptions(subtype, sourceCompendia, selectedOptions) {
        return await Promise.all(sourceCompendia.map(async (c) => {
            const pack = game.packs.get(c);
            const source = this._getSourceName(pack.metadata.packageType, pack.metadata.packageName);
            const entries = await pack.getDocuments().then(
                docs => {
                    if (subtype === "class") {
                        return this._getClasses(docs, selectedOptions)
                    }
                    if (subtype === "subclass") {
                        return this._getSublasses(docs, selectedOptions)
                    }
                    if (subtype === "feature") {
                        return this._getFeats(docs, selectedOptions);
                    }
                    if (subtype === "spells") {
                        return this._getSpellLists(docs, selectedOptions);
                    }
                    return docs
                        .filter(
                            d => d.type === subtype)
                        .map(d => 
                            {return {
                                uuid: d.uuid,
                                checked: selectedOptions.has(d.uuid),
                                label: d.name,
                                source: d.system.source.value,
                                metadata: null,
                                img: d.img
                            }
                        }
                )}
            )

            const n_checked = entries.filter(e => e.checked).length;
            return {
                label: pack.metadata.label,
                id: pack.metadata.id,
                source,
                entries,
                category: this.tabGroups.primary,
                checked: n_checked > 0,
                indeterminate: n_checked > 0 & n_checked !== entries.length
            }
        }))
    }
  
    _onChangeTab(event, tabs, active) {
        super._onChangeTab(event, tabs, active);
    }

    async _prepareContext(options) {
        // Get current selections from settings
        const context = await super._prepareContext(options);
        const settings = SETTINGS[this.tabGroups.primary];        
        const selectedCompendia = game.settings.get(MODULE_NAME, settings.sources);
        const selectedContent = new Set(game.settings.get(MODULE_NAME, settings.content));

        context.entries = await this._getContentOptions(settings.subtype, selectedCompendia, selectedContent);

        context.categories = SETTINGS.itemtypes.map(i => {
            const setting = SETTINGS[i];
            const active = this.tabGroups.primary === i;

            return {id: i, label:setting.label, svg: setting.icon,
                    group: "primary",
                    active,
                    cssClass: active ? "active" : "",
            }
        })

        return context;
    }
}