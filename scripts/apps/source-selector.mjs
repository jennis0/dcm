import { setSetting, getSetting, SETTINGS, MODULE_NAME } from "../settings.mjs";
import { log } from "../lib.mjs";
import { addSources, removeSources } from "../source-management.mjs";
import { forceSpotlightRebuild } from "../integrations/spotlight.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

// Sourceelector.js
export class SourceSelector extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(startTab="class", 
        onClose=null
    ) {
        super();
        this.tabGroups.primary = startTab;
        this.currentFilters = {name: null}
        this.onCloseFunc = () => onClose && onClose();
        log("Creating Source Selection window")
    }

    _onClose() {
        
        if (CONFIG.dndContentManager.forceRebuild) {
            forceSpotlightRebuild();
        }

        this.onCloseFunc()
    }


    static DEFAULT_OPTIONS = {
            tag: "form",
            window: {
                title: "Compendium Source Selector",
                icon: "fas fa-book-open-reader",
                resizeable: true
            },
            id: 'compendium-selector',
            title: 'Select Compendia',
            classes: ["dcm dnd5e2 dialog-lg compendium-browser selector"],
            position: {
                width: 800,
                height: 650
              },
            actions: {
                selectPack: SourceSelector.#onSelectPack,
                selectAll: SourceSelector.#onSelectAll,
                clearSearch: SourceSelector.#onClearSearch,
                changeTab: SourceSelector.#onChangeTab,
                toggleEnabled: SourceSelector.#onToggleEnable
              },
    }

    
    static PARTS = {
        sidebar: {
            template: `modules/${MODULE_NAME}/templates/parts/tab-selector.html`
        },
        content: {
            template: `modules/${MODULE_NAME}/templates/parts/pack-selector.html`
        },
    }

    static async #onSelectAll(event, target) {
        const category = target.getAttribute("category")
        const checked = target.checked;
        const packs = target.closest(".packs-list").querySelectorAll("dnd5e-checkbox[data-action=selectPack]")

        target.indeterminate = false;
        const changedSources = new Array();

        for (const p of packs) {
            p.checked = checked || p.disabled;

            if (checked) {
                changedSources.push(p.name)
            }

            if (!checked && !p.disabled) {
                changedSources.push(p.name)
            }

            if (!checked && p.disabled) {
                target.indeterminate = true
            }
        } 

        if (checked) {
            addSources(category, changedSources)
        } else {
            removeSources(category, changedSources);
        }
    }

    static async #onSelectPack(event, target) {

        //Set pack 'All' box to correct state
        const pack_list = target.closest(".packs-list")
        const all_box = pack_list.querySelector("dnd5e-checkbox[data-action=selectAll]")
        const siblings = pack_list.querySelectorAll("dnd5e-checkbox[data-action=selectPack]")
        
        //Check number of siblings currently turned on
        if (all_box) {
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
        if (target.checked) {
            addSources(category, [target.name])
        } else {
            removeSources(category, [target.name])
        }
    }

    static #onChangeTab(event, target) {
        this.tabGroups.primary = target.getAttribute("category")
        this.render(false);
    }

    static async #onClearSearch(event, target) {
        const input = target.closest("search").querySelector(":scope > input");
        input.value = this.currentFilters.name = null;
        this.render({ parts: ["content"] });
    }

    static async #onToggleEnable(event, target) {
        event.stopPropagation();
        log(`Toggling ${target.name} filtering to ${target.checked}`)
        setSetting(SETTINGS[target.name].enabled, target.checked)
        //this.render(true)
    }

    _onSearchName(event) {
        if ( !event.target.matches("search > input[type='text']") ) return;
        this.currentFilters.name = event.target.value.toLowerCase();
        this.render({ parts: ["content"] });
      }
    _debouncedSearch = foundry.utils.debounce(this._onSearchName.bind(this), SourceSelector.SEARCH_DELAY);

    _attachFrameListeners() {
        super._attachFrameListeners();
        this.element.addEventListener("keydown", this._debouncedSearch, { passive: true });
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

    _getCompendiumOptions(itemType, documentType, selectedCompendia) {
        const module_packs = new Map();
        const fixed = CONFIG.dndContentManager.fixed.get(itemType).compendia;
        game.packs
            .filter(p => (p.metadata.type === documentType) & p.metadata.packageName !== MODULE_NAME)
            .filter(p => !this.currentFilters.name 
                || p.metadata.label.toLowerCase().includes(this.currentFilters.name) 
                || p.metadata.id.includes(this.currentFilters.name)
            )
            .forEach((p) => {
                if (!module_packs[p.metadata.packageName]) {
                    module_packs[p.metadata.packageName] = new Array()
                } 
                module_packs[p.metadata.packageName].push(p)
            })

        return Object.keys(module_packs)
            .filter(k => module_packs[k].length > 0)
            .map(k => 
                {
                    const source = this._getSourceName(
                        module_packs[k][0].metadata.packageType,
                        module_packs[k][0].metadata.packageName
                    );
                    const entries = module_packs[k].map(p => {             
                        return {
                            uuid: p.metadata.id, 
                            checked: selectedCompendia.has(p.metadata.id) || fixed.has(p.metadata.id),
                            fixed: fixed.has(p.metadata.id),
                            label: p.metadata.label,
                            name: `${p.metadata.id}`
                        }
                    })
                    const n_checked = entries.filter(e => e.checked).length
                    const all = n_checked === entries.length;
                    const indeterminate = n_checked > 0 && !all;
                    return {
                        name: k,
                        label: source,
                        itemType: itemType,
                        indeterminate,
                        checked: all | indeterminate,
                        entries                
                    }
                }
            )
    }

    async _getAllDataOptions() {

        const options = {}
        for (const itemType of SETTINGS.itemtypes) {
            const setting = SETTINGS[itemType];
            const sources = await getSetting(setting.sources);
            const entries = this._getCompendiumOptions(itemType, setting.type, new Set(sources));
            options[itemType] = entries;
        }
        return options;
 
    }

    async _prepareContext(options) {
        // Get current selections from settings
        const context = await super._prepareContext(options);
        context.tabs = await this._getAllDataOptions()
        context.categories = SETTINGS.itemtypes.map(i => {
            const setting = SETTINGS[i];
            const active = this.tabGroups.primary === i;

            return {id: i, label:setting.label, svg: setting.icon,
                    group: "primary",
                    active,
                    cssClass: active ? "active" : "",
            }
        })
        context.type = this.tabGroups.primary
        context.enabled = getSetting(SETTINGS[this.tabGroups.primary].enabled)
        context.tab = context.tabs[this.tabGroups.primary]
        context.label = SETTINGS[this.tabGroups.primary].label;
        context.isSpellList = this.tabGroups.primary === "spelllist"
        return context;
    }
}