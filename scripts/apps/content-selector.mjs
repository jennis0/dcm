import { getFeatType } from "../enrich-feats.mjs";
import { getSetting, setSetting, SETTINGS, MODULE_NAME } from "../settings.mjs";
import { getClassDetailsFromIdent } from "../enrich-class.mjs";
import { enrichSource } from "../enrich-source.mjs";
import { getOrdinalSuffix, log } from "../lib.mjs";
import { SourceSelector } from "./source-selector.mjs";
import { forceSpotlightRebuild } from "../integrations/spotlight.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class ContentSelector extends HandlebarsApplicationMixin(ApplicationV2) {
    //Allow a GM to select approved content for their game
    constructor() {
        super();
        this.tabGroups.primary = "class";
        this.group_category = Object.fromEntries(SETTINGS.itemtypes.map(i => [i, new Set([0])]))
        this.duplicates = false
        this.currentFilters = {
            name: null,
            minItems: 0
        }
        this.reloadRequired = false;
    }

    async _onClose() {
        if (CONFIG.dndContentManager.forceRebuild) {
            forceSpotlightRebuild()
        }

        if (this.reloadRequired) {
            foundry.applications.api.DialogV2.confirm({
                window: { title: "Reload Page?" },
                content: "<p>Changing spell lists only takes effect when Foundry is reloaded. Reload now?</p>",
                modal: true,
                submit: (result) => {if (result) {window.location.reload()}}
              })
        }
    }

    //Add a button to open the ContentSelector to the Compendium Sidebar
    static injectSidebarButton(html) {
        log("Injecting sidebar button")
        const button = document.createElement("button");
        button.type = "button";
        button.innerHTML = `
          <i class="fas fa-ballot" inert></i>Configure Player Content`;
        button.addEventListener("click", event => (new ContentSelector()).render({ force: true }));
    
        const headerActions = html.querySelector(".header-actions");
        headerActions.prepend(button);
      }

    async _renderFrame(options) {
        const html = await super._renderFrame(options);

        //Add button to open SourceSelector
        const settingsButton = document.createElement("button");
        settingsButton.classList.add("header-control");
        settingsButton.classList.add("fa-solid")
        settingsButton.classList.add("fa-gear")
        settingsButton.dataset.tooltip = "Open Source Config"
        settingsButton.setAttribute("aria-label", "Open Source Config");
        settingsButton.addEventListener("click", event => {
            event.stopPropagation();
            new SourceSelector(
                this.tabGroups.primary,
                () => {this.render()}
            ).render(true);
        })

        //Insert to left of close button
        const header = html.querySelector(".window-header");
        const button = header.querySelector(":not(.hidden).header-control");
        header.insertBefore(settingsButton, button);
        return html;
    }  
    
    SEARCH_DELAY = 200;

    static DEFAULT_OPTIONS = {
            tag: "form",
            window: {
                title: "Choose Available Content",
                icon: "fas fa-ballot",
                resizeable: true
            },
            id: 'content-selector',
            classes: ["dcm dnd5e2 dialog-lg compendium-browser selector"],
            position: {
                width: 880,
                height: 650,
              },
            actions: {
                selectPack: ContentSelector.#onSelectPack,
                selectAll: ContentSelector.#onSelectAll,
                selectGrouping: ContentSelector.#onSelectGroup,
                clearSearch: ContentSelector.#onClearSearch,
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

        target.indeterminate = false;

        const sc = getSetting(SETTINGS[category].content);
        let selectedContent = new Set(sc);

        for (const p of packs) {
            p.checked = checked || p.disabled;

            if (checked) {
                selectedContent.add(p.name)
                log(`Adding ${p.name} to ${category} filter list`)
            }
            else {
                selectedContent.delete(p.name)
                log(`Removing ${p.name} from ${category} filter list`)
            }

            if (p.checked && !checked) {
                target.indeterminate = true;
            }
        } 
        
        await setSetting(SETTINGS[category].content, Array.from(selectedContent))
        CONFIG.dndContentManager.forceRebuild = true

        if (category === "spelllist") {
            this.reloadRequired = true
        }
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

        let content = getSetting(SETTINGS[category].content) || [];
        if (target.checked) {
            log(`Adding ${target.name} to ${category} filter list`)
            content.push(target.name);
        } else {
            const index = content.indexOf(target.name);
            log(`Removing ${target.name} from ${category} filter list`)
            if (index !== -1) {
                content.splice(index, 1);
            }
        }
        await setSetting(SETTINGS[category].content, content);
        CONFIG.dndContentManager.forceRebuild = true

        if (category === "spelllist") {
            this.reloadRequired = true
        }
    }

    static #onSelectGroup(event, target) {

        const category = target.getAttribute("category");

        if (target.name =="duplicates") {
            this.group_category[category] =  new Set();
            this.duplicates = !this.duplicates;
            this.currentFilters.minItems = this.duplicates ? 2 : 0
        } else {
            const index = parseInt(target.name);
    
            if (target.checked) {
                this.group_category[category].add(index);
                this.duplicates = false;
            } else {
                this.group_category[category].delete(index);
            }
        }

        this.render(false);
    }

    static #onChangeTab(event, target) {
        this.tabGroups.primary = target.getAttribute("category")

        //Reset filters
        this.currentFilters = {
            name: null,
            minItems: this.duplicates ? 2 : 0
        }

        //Keep duplicate selection between tabs
        if (this.duplicates) {
            this.group_category[this.tabGroups.primary] = new Set();
        }
        this.render(false);
    }

    static async #onClearSearch(event, target) {
        const input = target.closest("search").querySelector(":scope > input");
        input.value = this.currentFilters.name = null;
        this.render({ parts: ["content"] });
    }

    _onSearchName(event) {
        if ( !event.target.matches("search > input[type='text']") ) return;
        this.currentFilters.name = event.target.value.toLowerCase();
        this.render({ parts: ["content"] });
      }
    _debouncedSearch = foundry.utils.debounce(this._onSearchName.bind(this), ContentSelector.SEARCH_DELAY);

    _attachFrameListeners() {
        super._attachFrameListeners();
        this.element.addEventListener("keydown", this._debouncedSearch, { passive: true });
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

    _applyFilters(doc) {
        if (this.currentFilters.name) {
            return doc.name.toLowerCase().includes(this.currentFilters.name)
        }
        return true;
    }

    //Retrieve a fast index and enrich it with source information after the fetch
    async _fetch(pack, filter_fn, data_fn, sort_fn, selectedOptions, fields = []) {
        const module = this._getModule(pack)
        return pack.getIndex(
            {fields: new Set(["uuid", "type", "name", "img", "system.source"].concat(fields))}
        )
        .then(
            index =>  index.filter(d => filter_fn(d) && this._applyFilters(d))
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

    _getSpells(pack, selectedOptions) {
        return this._fetch(pack, 
            (d) => d.type === "spell", 
            (d) => {
                const levelInt = d.system.level;
                const level = levelInt === 0 ? "Cantrip" : `${getOrdinalSuffix(levelInt)} level`
                const school = CONFIG.DND5E.spellSchools[d.system.school].label;
                return {metadata: `${level} | ${school}`, levelInt: levelInt, level: level, school: school}},
            (a,b) => a.label.localeCompare(b.label),
            selectedOptions,
            ["system.school", "system.level"]
        )
    }

    async _getSpellLists(pack, selectedOptions) {
        const index = await pack.getDocuments()
        const fixed = CONFIG.dndContentManager.fixed.get("spelllist").items;
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
                    checked: selectedOptions.has(p.uuid) || fixed.has(p.uuid),
                    metadata: ident,
                    module: module.id,
                    moduleName: module.title,
                    fixed: fixed.has(p.uuid),
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

    _getItems(pack, selectedOptions) {
        return this._fetch(pack,
            d => SETTINGS.items.item_subtypes.includes(d.type) && !d.system.container,
            d => {return {metadata: `${d.type.slice(0, 1).toUpperCase()}${d.type.slice(1, d.type.length)}`}},
            (a,b) => a.metadata?.localeCompare(b.metadata) || a.label.localeCompare(b.label),
            selectedOptions,
            ["system.type", "system.container"]
        )
    }

    _getDocuments(pack, subtype, selectedOptions) {
        if (subtype === SETTINGS.subclass.subtype) {
            return this._getSubclasses(pack, selectedOptions)
        }
        if (subtype === SETTINGS.feat.subtype) {
            return this._getFeats(pack, selectedOptions);
        }
        if (subtype === SETTINGS.spelllist.subtype) {
            return this._getSpellLists(pack, selectedOptions);
        }
        if (subtype === SETTINGS.spell.subtype) {
            return this._getSpells(pack, selectedOptions);
        }
        if (subtype === SETTINGS.items.subtype) {
            return this._getItems(pack, selectedOptions);
        }

        return this._fetch(pack, 
            (d) => d.type === subtype,
            (d) => {},
            (a,b) => a.label.localeCompare(b.label),
            selectedOptions
        )
    }

    async _getContentOptions(subtype, sourceCompendia, selectedOptions) {
        return await Promise.all(sourceCompendia?.map(async (c) => {
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
            (gc) => {
                const group = SETTINGS[itemtype].groups[gc];
                return {
                    valuePath: group.valuePath,
                    itemLabelPath: group.itemLabelPath || group.valuePath
                }
            } 
        );

        if (this.duplicates) {
            group_categories.add({valuePath: "label", itemLabelPath: "label"})
        }

        group_categories = new Array(...group_categories)

        //HAndle case of no filtering
        if (group_categories.length === 0) {
            const entries = compendia_options.map(o => o.entries).flat()
            
            const n_checked = entries.filter(e => e.checked).length;
            return [{
                id: "all",
                entries: entries.sort((a,b) => a.label.localeCompare(b.label) 
                    || a.compendium.localeCompare(b.compendium)),
                label: "All",
                source: null,
                category: itemtype,
                metadataLabel: SETTINGS[itemtype].metadataLabel,
                checked: n_checked === entries.length,
                indeterminate: n_checked > 0 && n_checked.length < entries.length
            }]
        }

        compendia_options.forEach(
            o => {
                o.entries.forEach( e => {
                    const opt = group_categories.map(gc => e[gc.valuePath].trim()).join(" | ");
                    const label = group_categories.map(gc => e[gc.itemLabelPath].trim()).join(" | ");
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
        ).filter(p => p.entries.length >= this.currentFilters.minItems)
            .sort((a,b) => a.label.localeCompare(b.label))
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
        const selectedCompendia = [...new Set(getSetting(settings.sources).concat( 
            ...CONFIG.dndContentManager.fixed.get(this.tabGroups.primary).compendia)
        )];
        const selectedContent = new Set(getSetting(settings.content));

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
    
        context.type = SETTINGS[this.tabGroups.primary].label
        context.enabled = getSetting(SETTINGS[this.tabGroups.primary].enabled);
        context.isSpelllist = this.tabGroups.primary === "spelllist";
        context.itemtype = this.tabGroups.primary
        context.groups = this._prepareGroups(this.tabGroups.primary)
        context.duplicates = this.duplicates
        context.numSources = selectedCompendia.length

        return context;
    }
}