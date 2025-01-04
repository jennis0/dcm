import { getFeatType } from "../enrich-feats.mjs";
import { MODULE_NAME, SETTINGS } from "../settings.mjs";
import { getClassDetailsFromIdent } from "../enrich-class.mjs";
import { enrichSource } from "../enrich-source.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class ContentSelector extends HandlebarsApplicationMixin(ApplicationV2) {
    //Allow a GM to select approved content for their game
    constructor() {
        super();
        this.tabGroups.primary = "subclass";
        this.group_category = Object.fromEntries(SETTINGS.itemtypes.map(i => [i, new Set([0])]))
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
                selectGrouping: ContentSelector.#onSelectGroup,
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

    static #onSelectGroup(event, target) {
        if (target.checked) {
            this.group_category[target.getAttribute("category")].add(parseInt(target.name));
        } else {
            this.group_category[target.getAttribute("category")].delete(parseInt(target.name));
        }
        this.render(false);
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

    _getModule(pack) {
        if (pack.metadata.packageType === "world") {
            return {
                id: "world",
                title: "World"
            }
        }
        if (pack.metadata.packageType === "system") {
            return game.system
        }
        return game.modules.get(pack.metadata.packageName)
    }

    //Retrieve a fast index and enrich it with source information after the fetch
    async _fetch(pack, filter_fn, data_fn, sort_fn, selectedOptions, fields = []) {
        const module = this._getModule(pack)
        return pack.getIndex(
            {fields: new Set(["uuid", "type", "name", "img", "system.source"].concat(fields))}
        )
        .then(
            index =>  index.filter(d => filter_fn(d))
                .map(d => this._getSource(d))
                .map(d => {
                    return {
                        uuid: d.uuid,
                        checked: selectedOptions.has(d.uuid),
                        label: d.name,
                        module: module.id,
                        moduleName: module.title,
                        source: d.system.source.value,
                        sourceName: d.system.source.label ? d.system.source.label : d.system.source.value,
                        compendium: pack.metadata.id,
                        compendiumName: `${pack.metadata.name} (${pack.metadata.id})`,
                        img: d.img,
                        ...data_fn(d)
                    }
                })
                .sort(sort_fn)
        )
    }

    // Insert correct source information about a document from its index
    _getSource(doc) {
        if (!doc.system.source) {
            doc.system.source = {}
        }
        //dnd5e.dataModels.shared.SourceField.prepareData.call(doc.system.source, doc.uuid);
        enrichSource(doc.system.source, doc.uuid);
        return doc;
    }

    _getSubclasses(pack, selectedOptions) {
        return this._fetch(pack, 
            (d) => d.type === "subclass", 
            (d) => {return {metadata: getClassDetailsFromIdent(d.system.classIdentifier).name}},
            (a,b) => a.metadata?.localeCompare(b.metadata) || a.label.localeCompare(b.label),
            selectedOptions,
            ["system.classIdentifier"]
        )
    }

    async _getSpellLists(pack, selectedOptions) {
        const index = await pack.getDocuments()
        const module = this._getModule(pack)
        return index
            .map(d => d.pages.filter(p => p.type === "spells")
            .map(p => {
                let ident = p.system.identifier;
                let img = "systems/dnd5e/icons/spell-tiers/spell3.webp";
                if (ident) {
                    if (p.system.type === "class") {
                        const cls = getClassDetailsFromIdent(ident)
                        ident = cls.name
                        img = cls.img
                    } else {
                        ident = `${ident.chatAt(0).toUpperCase()}${ident.slice(1, ident.length)}`
                    }
                } else {
                    ident = "No identifier"
                }
                
                return {
                    uuid: p.uuid,
                    label: p.name,
                    checked: selectedOptions.has(p.uuid),
                    metadata: ident,
                    module: module.id,
                    moduleName: module.title,
                    source: p.parent.uuid,
                    sourceName: p.parent.name,
                    compendium: pack.metadata.id,
                    compendiumName: `${pack.metadata.name} (${pack.metadata.id})`,
                    journal: d.name || "Untitled Journal",
                    img: img
                }

        })).flat()
    }

    _getFeats(pack, selectedOptions) {
        return this._fetch(pack,
            d => d.type === "feat" && d.system.type.value === "feat",
            d => {return {metadata: getFeatType(d.system.type.subtype)}},
            (a,b) => a.metadata?.localeCompare(b.metadata) || a.label.localeCompare(b.label),
            selectedOptions,
            ["system.type"]
        )
    }

    _getDocuments(pack, subtype, selectedOptions) {
        if (subtype === "subclass") {
            return this._getSubclasses(pack, selectedOptions)
        }
        if (subtype === "feature") {
            return this._getFeats(pack, selectedOptions);
        }
        if (subtype === "spells") {
            return this._getSpellLists(pack, selectedOptions);
        }

        return this._fetch(pack, 
            (d) => d.type === subtype,
            (d) => {},
            (a,b) => a.label.localeCompare(b.label),
            selectedOptions
        )
    }

    async _getContentOptions(subtype, sourceCompendia, selectedOptions) {
        return await Promise.all(sourceCompendia.map(async (c) => {
            const pack = game.packs.get(c);
            const source = this._getSourceName(pack.metadata.packageType, pack.metadata.packageName);
            const entries = await this._getDocuments(pack, subtype, selectedOptions)

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

    _reGroup(itemtype, compendia_options) {
        const newGroups = new Map();
        let group_categories = this.group_category[itemtype].map(
            (gc,index) => {
                const group = SETTINGS[itemtype].groups[gc];
                return {
                    index: index,
                    valuePath: group.valuePath,
                    itemLabelPath: group.itemLabelPath || group.valuePath
                }
            }
        );
        group_categories = new Array(...group_categories)

        if (group_categories.length === 0) {
            const entries = compendia_options.map(o => o.entries).flat()
            
            const n_checked = entries.filter(e => e.checked).length;
            return [{
                id: "all",
                entries,
                label: "All",
                source: null,
                category: itemtype,
                metadataLabel: SETTINGS[itemtype].metadataLabel,
                checked: n_checked === entries.length,
                indeterminate: n_checked > 0 && n_checked.length < entries.length
            }]
        }

        console.warn(group_categories);
        compendia_options.forEach(
            o => {
                o.entries.forEach( e => {
                    const opt = group_categories.map(gc => e[gc.valuePath]).join(" | ").trim();
                    const label = group_categories.map(gc => e[gc.itemLabelPath]).join(" | ").trim();
                    if (!newGroups[opt]) {
                        newGroups[opt] = {
                            label: label,
                            entries: new Array()
                        }
                    } 
                    newGroups[opt].entries.push(e);
                })
            }
        )

        return Object.keys(newGroups).map(
            k => {
                const entries = newGroups[k].entries;
                const n_checked = entries.filter(e => e.checked).length;
                return {
                    id: k.slugify(),
                    entries: entries.sort((a,b) => a.label.localeCompare(b.label) 
                        || a.compendium.localeCompare(b.compendium)),
                    label: newGroups[k].label,
                    source: null,
                    category: itemtype,
                    checked: n_checked === entries.length,
                    metadataLabel: SETTINGS[itemtype].metadataLabel,
                    indeterminate: n_checked > 0 && n_checked.length < entries.length
                }
            }
        )
    }
  
    _onChangeTab(event, tabs, active) {
        super._onChangeTab(event, tabs, active);
    }

    _prepareGroups(itemtype) {
        return SETTINGS[itemtype].groups.map(
            (g, index) => {
                return {
                    label: g.groupLabel,
                    id: index,
                    itemtype: itemtype,
                    checked: this.group_category[itemtype].has(index)
                }
            }
        )
    }

    async _prepareContext(options) {
        // Get current selections from settings
        const context = await super._prepareContext(options);
        const settings = SETTINGS[this.tabGroups.primary];        
        const selectedCompendia = game.settings.get(MODULE_NAME, settings.sources);
        const selectedContent = new Set(game.settings.get(MODULE_NAME, settings.content));

        context.entries = await this._getContentOptions(settings.subtype, selectedCompendia, selectedContent);
        context.entries = this._reGroup(this.tabGroups.primary, context.entries)

        context.categories = SETTINGS.itemtypes.map(i => {
            const setting = SETTINGS[i];
            const active = this.tabGroups.primary === i;

            return {id: i, label:setting.label, svg: setting.icon,
                    group: "primary",
                    active,
                    cssClass: active ? "active" : "",
            }
        })

        context.groups = this._prepareGroups(this.tabGroups.primary)

        console.log(context);
        return context;
    }
}