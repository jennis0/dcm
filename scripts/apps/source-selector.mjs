import { MODULE_NAME, SETTINGS } from "../constants.mjs";
import { log } from "../lib.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

// Sourceelector.js
export class SourceSelector extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super();
        this.tabGroups.primary = "class";
        log("Creating Source Selection window")
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
            classes: ["dcm dnd5e2 dialog-lg compendium-browser"],
            position: {
                width: 650,
                height: 650
              },
            actions: {
                selectPack: SourceSelector.#onSelectPack,
                selectAll: SourceSelector.#onSelectAll,
                changeTab: SourceSelector.#onChangeTab
              },
    }

    
    static PARTS = {
        sidebar: {
            template: 'modules/dandd-content-manager/templates/parts/tab-selector.html'
        },
        packs: {
            template: 'modules/dandd-content-manager/templates/parts/pack-selector.html'
        },
    }

    static async #onSelectAll(event, target) {
        const category = target.getAttribute("category")
        const checked = target.checked;
        const packs = target.closest(".packs-list").querySelectorAll("dnd5e-checkbox[data-action=selectPack]")

        if (!checked) {
            target.indeterminate = false;
        }

        let newSources = []
        for (const p of packs) {
            p.checked = checked;

            if (checked) {
                newSources.push(p.name)
            }
        } 
        await game.settings.set(MODULE_NAME, SETTINGS[category].sources, newSources)
    }

    static async #onSelectPack(event, target) {

        //Set pack 'All' box to correct state
        const pack_list = target.closest(".packs-list")
        const all_box = pack_list.querySelector("dnd5e-checkbox[data-action=selectAll]")
        const siblings = pack_list.querySelectorAll("dnd5e-checkbox[data-action=selectPack]")
        
        //Check number of siblings currently turned on
        let n_on = 0;
        for (const cb of siblings) {
            if (cb.checked) {
                n_on += 1;
            }
        }
        all_box.checked = n_on > 0;
        all_box.indeterminate = all_box.checked & n_on < siblings.length;

        //Update setting
        const category = target.getAttribute("category")
        let sources = game.settings.get(MODULE_NAME, SETTINGS[category].sources) || [];
        if (target.checked) {
            sources.push(target.name);
        } else {
            const index = sources.indexOf(target.name);
            if (index !== -1) {
                sources.splice(index, 1);
            }
        }
        await game.settings.set(MODULE_NAME, SETTINGS[category].sources, sources);
    }

    static #onChangeTab(event, target) {
        this.tabGroups.primary = target.getAttribute("category")
        this.render(false);
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

    _getCompendiumOptions(documentType, selectedCompendia) {
        return game.packs
            .filter(p => (p.metadata.type === documentType) & p.metadata.packageName !== MODULE_NAME)
            .map(p => { 
            
                return {
                    uuid: p.metadata.id, 
                    checked: selectedCompendia.has(p.metadata.id),
                    label: p.metadata.label,
                    source: this._getSourceName(p.metadata.packageType, p.metadata.packageName)
                }
            })
    }

    async _getAllDataOptions() {

        const options = {}
        for (const itemType of SETTINGS.itemtypes) {
            const setting = SETTINGS[itemType];
            const sources = await game.settings.get(MODULE_NAME, setting.sources);
            const entries = this._getCompendiumOptions(setting.type, new Set(sources));
            const n_checked = entries.filter(e => e.checked).length
            const all = n_checked === entries.length;
            const indeterminate = n_checked > 0 && !all;
            options[itemType] = {
                label: setting.label,
                category: itemType, 
                type: setting.type,
                indeterminate,                
                checked: all || indeterminate,
                entries
            };
        }
        console.log(options)
        return options;
 
    }
  

    _onChangeTab(event, tabs, active) {
        super._onChangeTab(event, tabs, active);
    }

    async _prepareContext(options) {
        // Get current selections from settings
        const context = await super._prepareContext(options);
        context.tabs = await this._getAllDataOptions()
        context.categories = SETTINGS.itemtypes.map(i => {
            const setting = SETTINGS[i];
            const active = this.tabGroups["primary"] === i;

            return {id: i, label:setting.label, svg: setting.icon,
                    group: "primary",
                    active,
                    cssClass: active ? "active" : "",
            }
        })
        context.tab = context.tabs[this.tabGroups.primary]
        return context;
    }
}