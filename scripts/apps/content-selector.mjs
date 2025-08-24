import { getFeatType } from "../enrich-feats.mjs";
import { getSetting, SETTINGS, MODULE_NAME } from "../settings.mjs";
import { getClassDetailsFromIdent } from "../enrich-class.mjs";
import { enrichSource } from "../enrich-source.mjs";
import { getOrdinalSuffix, log, warn } from "../lib.mjs";
import { SourceSelector } from "./source-selector.mjs";
import { forceSpotlightRebuild } from "../integrations/spotlight.mjs";
import { addContent, removeContent } from "../content-management.mjs";
import { getMonsterType } from "../enrich-monsters.mjs.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class ContentSelector extends HandlebarsApplicationMixin(ApplicationV2) {
    //Allow a GM to select approved content for their game
    constructor() {
        super();

        //Starting tab
        this.tabGroups.primary = "class";

        //Keep track of which groups are currently selected
        this.selected_groups = Object.fromEntries(SETTINGS.itemtypes.map(i => [i, new Set([0])]))
        
        //Filters applied to the current content
        this.currentFilters = {
            name: null,
            minItems: 0,
            unique: false
        }

        //Set if we want to ask the user to reload when closing the app
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
    /**
     * Creates a sidebar button for the content selector.
     *
     * This button is styled with the class "content-selector-button" and includes an icon and text.
     * When clicked, it opens the Content Selector application.
     *
     * @returns {HTMLButtonElement} The created button element.
     */
    static createSidebarButton() {
        const button = document.createElement("button");
        button.classList.add("content-selector-button")
        button.type = "button";
        button.setAttribute("data-tooltip", "Open Content Selector")
        button.innerHTML = `
          <i class="fas fa-ballot" inert></i>Configure Player Content`;
        button.addEventListener("click", event => (new ContentSelector()).render({ force: true }));
        return button;
      }

    /**
     * Intercepts the frame rendering and adds a settings button to the header.
     * 
     * @param {Object} options - The options to render the frame with.
     * @returns {Promise<HTMLElement>} The rendered HTML element.
     * @override
     */
    async _renderFrame(options) {
        const html = await super._renderFrame(options);

        //Add button to open SourceSelector
        const settingsButton = document.createElement("button");
        settingsButton.classList.add("header-control");
        settingsButton.classList.add("fas", "fa-cog", "icon")
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
                width: 900,
                height: 800,
              },
            actions: {
                selectPack: ContentSelector.#onSelectPack,
                selectAll: ContentSelector.#onSelectAll,
                selectGrouping: ContentSelector.#onSelectGroup,
                clearSearch: ContentSelector.#onClearSearch,
                changeTab: ContentSelector.#onChangeTab,
                openItem: ContentSelector.#onOpenItem,
                togglePackContent: ContentSelector.#onTogglePackContent,
                openCompendiumConfig: () => {}
              },
    }
    
    /*********************************************************************
     *                      Action Functions
     *********************************************************************/

    /**
     * Toggles the visibility of the pack content in the compendium.
     *
     * @param {Event} event - The event object triggered by the user interaction.
     * @param {HTMLElement} target - The target element that was interacted with.
     * @private
     * @async
     */
    static async #onTogglePackContent(event, target) {
        const pack = target.closest(".packs-list").querySelector(".compendium-content");
        const icon = target.querySelector("i");
        if (pack) {
            if (pack.style.display === "none") {
                pack.style.display = "block";
                pack.style.height = pack.scrollHeight + "px";
                icon.classList.remove("fa-arrow-down");
                icon.classList.add("fa-arrow-up");
            } else {
                pack.style.height = pack.scrollHeight + "px";
                setTimeout(() => {
                    pack.style.height = "0px";
                }, 5);
                setTimeout(() => {
                    pack.style.display = "none";
                }, 300);
                icon.classList.remove("fa-arrow-up");
                icon.classList.add("fa-arrow-down");
            }
        }
    }

    /**
     * Handles the event when an item is opened.
     *
     * @param {Event} event - The event object triggered by the user action.
     * @param {HTMLElement} target - The target HTML element that contains the data-id attribute.
     * @private
     */
    static async #onOpenItem(event, target) {
        const item = await fromUuid(target.getAttribute("data-id"))
        if (item) {
            item.sheet.render(true)
        }
    }

    /**
     * Handles the selection or deselection of all items within a category.
     * 
     * @param {Event} event - The event object triggered by the user action.
     * @param {HTMLElement} target - The target element that triggered the event.
     * @private
     * @async
     */
    static async #onSelectAll(event, target) {
        //Add/remove all members of this group

        const category = target.getAttribute("category")
        const checked = target.checked;
        const packsList = target.closest(".packs-list")
        const packs = packsList.querySelectorAll("dcm-checkbox[data-action=selectPack]")
        const count = packsList.querySelector(".selected-count")

        // Handle updating count
        const [n_selected, n_total] = count.textContent.split(" ")[0]
            .split("/").map(Number);
        count.textContent = checked ? `${n_total}/${n_total} Selected` : `0/${n_total} Selected`;

        target.indeterminate = false;

        const sc = getSetting(SETTINGS[category].content);
        const changedContent = new Array();

        for (const p of packs) {
            p.checked = checked || p.disabled;
            changedContent.push(p.name)

            if (p.checked && !checked) {
                target.indeterminate = true;
            }
        } 

        if (checked) {
            addContent(category, changedContent)
        } else {
            removeContent(category, changedContent);
        }
        
        if (category === "spelllist") {
            this.reloadRequired = true
        }
    }

    /**
     * Handles the selection of a content pack.
     * 
     * @param {Event} event - The event object triggered by the selection.
     * @param {HTMLElement} target - The target element that was selected.
     * @private
     * @async
     */
    static async #onSelectPack(event, target) {
        //Set pack 'All' box to correct state
        const pack_list = target.closest(".packs-list")
        const all_box = pack_list.querySelector("dcm-checkbox[data-action=selectAll]")
        const siblings = pack_list.querySelectorAll("dcm-checkbox[data-action=selectPack]")
        
        // Handle updating count
        const count = pack_list.querySelector(".selected-count")
        if (count !== null && count !== undefined) {
            const [n_selected, n_total] = count.textContent.split(" ")[0]
                .split("/").map(Number);
            count.textContent = target.checked ? `${n_selected + 1}/${n_total} Selected` 
                : `${n_selected - 1}/${n_total} Selected`;
        }

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

        if (target.checked) {
            addContent(category, [target.name]);
        } else {
            removeContent(category, [target.name])
        }

        if (category === "spelllist") {
            this.reloadRequired = true
        }
    }

    /**
     * Handles the selection of a group based on the target element's attributes and state.
     *
     * @param {Event} event - The event object triggered by the selection action.
     * @param {HTMLElement} target - The target element that triggered the event.
     * @private
     */
    static #onSelectGroup(event, target) {

        const category = target.getAttribute("category");

        if (target.name === "duplicates") {
            this.currentFilters.unique = false;
            this.currentFilters.minItems = this.currentFilters.minItems === 0 ? 2 : 0

        } else if (target.name === "unique") {
            this.currentFilters.unique = !this.currentFilters.unique;
            this.currentFilters.minItems = 0;

        } else {
            const index = parseInt(target.name);
    
            if (target.checked) {
                this.selected_groups[category].add(index);
            } else {
                this.selected_groups[category].delete(index);
            }
        }

        this.render(false);
    }

    /**
     * Handles the change of tabs in the content selector.
     * 
     * @param {Event} event - The event object triggered by the tab change.
     * @param {HTMLElement} target - The target element representing the new tab.
     * @private
     */
    static #onChangeTab(event, target) {
        this.tabGroups.primary = target.getAttribute("category")

        //Reset filters
        this.currentFilters = {
            name: null,
            minItems: 0,
            unique: false
        }

        //Keep duplicate selection between tabs
        // if (this.duplicates) {
        //     this.selected_groups[this.tabGroups.primary] = new Set();
        // }
        this.render(false);
    }

    /**
     * Clears the search input field and resets the current filter's name to null.
     * Then re-renders the content.
     *
     * @param {Event} event - The event object triggered by the clear search action.
     * @param {HTMLElement} target - The target element that initiated the clear search action.
     * @private
     * @async
     */
    static async #onClearSearch(event, target) {
        const input = target.closest("search").querySelector(":scope > input");
        input.value = this.currentFilters.name = null;
        this.render({ parts: ["content"] });
    }

    /**
     * Handles the search input event to filter content by name.
     *
     * @param {Event} event - The input event triggered by the search field.
     */
    _onSearchName(event) {
        if ( !event.target.matches("search > input[type='text']") ) return;
        this.currentFilters.name = event.target.value.toLowerCase();
        this.render({ parts: ["content"] });
      }
    
    //Debounce search input
    _debouncedSearch = foundry.utils.debounce(this._onSearchName.bind(this), ContentSelector.SEARCH_DELAY);

    /**
     * Attaches event listeners to the frame element.
     * 
     * This method overrides the parent class's _attachFrameListeners method
     * to add a keydown event listener to the element. The event listener
     * triggers a debounced search function.
     * 
     * @override
     * @private
     */
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

    /*********************************************************************
    *                      Content Loading
    *********************************************************************/


    /**
     * Get the name of the source based on its type and ID, handling needed special case
     * for world and system compendia.
     *
     * @param {string} sourceType - The type of the source (e.g., "world", "system", "module").
     * @param {string} sourceId - The ID of the source.
     * @returns {string} The name of the source.
     */
    _getSourceName(sourceType, sourceId) {
        if (sourceType === "world") {
            return "World";
        };
        if (sourceType === "system") {
            return "D&D 5E Core";
        };
        return game.modules.get(sourceId).title;
    }

    /**
     * Retrieve the module information based on the package type.
     *
     * @param {Object} pack - The package object.
     * @param {Object} pack.metadata - Metadata of the package.
     * @param {string} pack.metadata.packageType - The type of the package (e.g., "world", "system").
     * @param {string} pack.metadata.packageName - The name of the package.
     * @returns {Object} The module information. If the package type is "world", returns an object with id and title.
     *                   If the package type is "system", returns the game system object.
     *                   Otherwise, returns the module from the game modules collection.
     */
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

    _applyPerItemFilters(doc) {
        if (this.currentFilters.name) {
            return doc.name.toLowerCase().includes(this.currentFilters.name)
        }
        return true;
    }

    //
    /**
     * Retrieve a fast index and enrich it with source information after the fetch
     *
     * @param {Object} pack - The compendium pack to fetch data from.
     * @param {Function} filter_fn - A function to filter the data.
     * @param {Function} data_fn - A function to transform the data.
     * @param {Function} sort_fn - A function to sort the data.
     * @param {Set} selectedOptions - A set of selected options.
     * @param {Array} [fields=[]] - Additional fields to include in the fetch.
     * @returns {Promise<Array>} A promise that resolves to an array of processed data objects.
     */
    async _fetch(pack, filter_fn, data_fn, sort_fn, selectedOptions, fields = []) {
        const module = this._getModule(pack)
        return pack.getIndex(
            {fields: new Set(["uuid", "type", "name", "img", "system.source"].concat(fields))}
        )
        .then(
            index =>  index.filter(d => filter_fn(d) && this._applyPerItemFilters(d))
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

    /**
     * Retrieves and enriches the source information for a given document.
     * 
     * This method ensures that the `doc.system.source` property is properly initialized
     * and formatted as an object. If `doc.system.source` is a string, it converts it to
     * an object with a `book` property. It then calls the `enrichSource` function to
     * further process the source data.
     * 
     * @param {Object} doc - The document object containing the source information.
     * @param {Object} doc.system - The system-specific data of the document.
     * @param {Object|string} doc.system.source - The source information, which can be a string or an object.
     * @param {string} doc.uuid - The unique identifier of the document.
     * @returns {Object} The document object with enriched source information.
     */
    _getSource(doc) {
        if (!doc.system.source) {
            doc.system.source = {}
        }
        if (typeof doc.system.source === 'string') {
          doc.system.source = {
            book: doc.system.source
          }
        }
        enrichSource(doc.system.source, doc.uuid);
        return doc;
    }

    /**
     * Fetches and returns a list of subclasses from a specified pack.
     *
     * @param {string} pack - The identifier of the pack to fetch subclasses from.
     * @param {Object} selectedOptions - Options to filter the fetched subclasses.
     * @returns {Promise<Array>} A promise that resolves to an array of subclass objects.
     */
    _getSubclasses(pack, selectedOptions) {
        return this._fetch(pack, 
            (d) => d.type === "subclass", 
            (d) => {return {metadata: getClassDetailsFromIdent(d.system.classIdentifier).name}},
            (a,b) => a.metadata?.localeCompare(b.metadata) || a.label.localeCompare(b.label),
            selectedOptions,
            ["system.classIdentifier"]
        )
    }

    /**
     * Fetches and filters spells from a given compendium pack.
     *
     * @param {string} pack - The identifier of the compendium pack to fetch spells from.
     * @param {Object} selectedOptions - The options selected by the user for filtering.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of spell objects.
     *
     * @private
     */
    _getSpells(pack, selectedOptions) {
        return this._fetch(pack, 
            (d) => d.type === "spell", 
            (d) => {
                const levelInt = d.system.level;
                const level = levelInt === 0 ? "Cantrip" : `${getOrdinalSuffix(levelInt)} level`
                const school = CONFIG.DND5E.spellSchools[d.system.school]?.label ?? "Unknown";
                return {metadata: `${level} | ${school}`, levelInt: levelInt, level: level, school: school}},
            (a,b) => a.label.localeCompare(b.label),
            selectedOptions,
            ["system.school", "system.level"]
        )
    }

    /**
     * Retrieves a list of spell lists from a given compendium pack.
     *
     * @param {Object} pack - The compendium pack to retrieve spell lists from.
     * @param {Set} selectedOptions - A set of selected options to determine which spell lists are checked.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of spell list objects.
     */
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
                        ident = `${ident.charAt(0).toUpperCase()}${ident.slice(1, ident.length)}`
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

    /**
     * Fetches and filters feats from a specified compendium pack.
     *
     * @param {string} pack - The identifier of the compendium pack to fetch data from.
     * @param {Object} selectedOptions - The options selected by the user.
     * @returns {Promise<Array>} A promise that resolves to an array of filtered and sorted feats.
     */
    _getFeats(pack, selectedOptions) {
        return this._fetch(pack,
            d => d.type === "feat" && d.system.type?.value === "feat",
            d => {return {metadata: getFeatType(d.system.type?.subtype)}},
            (a,b) => a.metadata?.localeCompare(b.metadata) || a.label.localeCompare(b.label),
            selectedOptions,
            ["system.type"]
        )
    }

    /**
     * Fetches and filters items from a given pack based on specified criteria.
     *
     * @param {string} pack - The identifier of the pack to fetch items from.
     * @param {Array} selectedOptions - An array of selected options to filter the items.
     * @returns {Promise<Array>} A promise that resolves to an array of filtered items.
     */
    _getItems(pack, selectedOptions) {
        return this._fetch(pack,
            d => SETTINGS.items.item_subtypes.includes(d.type) && !d.system.container,
            d => {return {metadata: `${d.type.slice(0, 1).toUpperCase()}${d.type.slice(1, d.type.length)}`}},
            (a,b) => a.metadata?.localeCompare(b.metadata) || a.label.localeCompare(b.label),
            selectedOptions,
            ["system.type", "system.container"]
        )
    }

    /**
     * Fetches and filters Monsters from a given pack based on specified criteria.
     *
     * @param {string} pack - The identifier of the pack to fetch items from.
     * @param {Array} selectedOptions - An array of selected options to filter the items.
     * @returns {Promise<Array>} A promise that resolves to an array of filtered items.
     */
    _getMonsters(pack, selectedOptions) {
        return this._fetch(pack,
            d => d.type === "npc",
            d => {return {
                metadata: getMonsterType(d.system.details.type.value),
                typeName: getMonsterType(d.system.details.type.value),
            }},
            (a,b) => a.metadata?.localeCompare(b.metadata) || a.label.localeCompare(b.label),
            selectedOptions,
            ["system.type", "system.details.type"]
        )
    }

    /**
     * Retrieves documents from a specified pack based on the given subtype and selected options.
     * Applies all filters as part of retrieval
     *
     * @param {Object} pack - The data pack from which to retrieve documents.
     * @param {string} subtype - The subtype of documents to retrieve.
     * @param {Object} selectedOptions - Additional options to filter the documents.
     * @returns {Promise<Array>} A promise that resolves to an array of documents matching the criteria.
     */
    _getDocuments(pack, subtype, selectedOptions) {
        // Get the documents
        let documents = [];
        if (subtype === SETTINGS.subclass.subtype) {
            documents = this._getSubclasses(pack, selectedOptions)
        }
        else if (subtype === SETTINGS.feat.subtype) {
            documents = this._getFeats(pack, selectedOptions);
        }
        else if (subtype === SETTINGS.spelllist.subtype) {
            documents = this._getSpellLists(pack, selectedOptions);
        }
        else if (subtype === SETTINGS.spell.subtype) {
            documents = this._getSpells(pack, selectedOptions);
        }
        else if (subtype === SETTINGS.items.subtype) {
            documents = this._getItems(pack, selectedOptions);
        }
        else if (subtype === SETTINGS.monster.subtype) {
            documents = this._getMonsters(pack, selectedOptions)
        }
        else {
            documents = this._fetch(pack, 
                (d) => d.type === subtype,
                (d) => {},
                (a,b) => a.label.localeCompare(b.label),
                selectedOptions
            )
        }

        return documents
    }

    /**
     * Retrieves content options based on the provided subtype, source compendia, and selected options.
     *
     * @param {string} subtype - The subtype of content to retrieve.
     * @param {Array<string>} sourceCompendia - An array of compendium identifiers to source content from.
     * @param {Array<Object>} selectedOptions - An array of selected options to filter the content.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of content options.
     */
    async _getContentOptions(subtype, sourceCompendia, selectedOptions) {

        const grouped_options = await Promise.all(sourceCompendia?.map(async (c) => {
            const pack = game.packs.get(c);

            //Filter out registered packs which are not currently present
            if (pack === null || pack === undefined) {
                warn(`Pack ${c} not found`)
                return null;
            }

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
                indeterminate: n_checked > 0 && n_checked !== entries.length,
                selected: n_checked
            }
        })).then(results => results.filter(r => r !== null))

        //Apply the unique/duplicate filters if selected
        if (this.currentFilters.minItems > 0 || this.currentFilters.unique) {
            const labels = new Map();
            grouped_options.forEach(group => {
                group.entries.forEach(option => {
                    const label = option.label.toLowerCase()
                    if (labels.has(label)) {
                        labels.set(label, labels.get(label) + 1)
                    } else {
                        labels.set(label, 1)
                    }
                })
            })

            if (this.currentFilters.minItems > 0) {
                grouped_options.forEach(group => {
                    group.entries = group.entries
                        .filter(e => labels.get(e.label.toLowerCase()) >= this.currentFilters.minItems)
                })
            }

            if (this.currentFilters.unique) {
                grouped_options.forEach(group => {
                    group.entries = group.entries
                        .filter(e => labels.get(e.label.toLowerCase()) === 1)
                })
            }
        }

        return grouped_options
    }

    /**
     * Regroups the given compendia options based on the specified item type and group categories.
     * 
     * This function is designed to categorize and sort entries from compendia options into groups
     * based on the provided item type and its associated group categories. It handles cases where
     * no filtering is applied and ensures that entries are properly grouped, sorted, and labeled.
     * 
     * @param {string} itemtype - The type of item to group (e.g., "spell", "item").
     * @param {Array} group_details - An array of groups to categorise entities by
     * @param {Array} compendia_options - An array of compendia options, each containing entries to be grouped.
     * @returns {Array} - An array of grouped entries, each with metadata such as label, category, and checked status.
     */
    _reGroup(itemtype, group_details, compendia_options) {

        const selected_groups = new Array(...this.selected_groups[itemtype].map(g => group_details[g]))

        // Handle case of no filtering
        if (selected_groups.length === 0) {
            const entries = compendia_options.map(o => o.entries).flat()
            
            const n_checked = entries.filter(e => e.checked).length;
            return [{
                id: "all",
                entries: entries.sort((a,b) => a.label.localeCompare(b.label) 
                    || a.compendium.localeCompare(b.compendium)),
                label: "All",
                source: null,
                category: itemtype,
                checked: n_checked === entries.length,
                indeterminate: n_checked > 0 && n_checked.length < entries.length,
                selected: n_checked
            }]
        }

        // Create new groups
        const grouped_entries = new Map();
        compendia_options.forEach(
            o => {
                o.entries.forEach( e => {
                    const group_key = selected_groups.map(gc => e[gc.valuePath].trim().toLowerCase()).join(" | ");
                    const group_label = selected_groups.map(gc => e[gc.itemLabelPath].trim()).join(" | ");

                    if (!grouped_entries[group_key]) {
                        grouped_entries[group_key] = {
                            label: group_label,
                            entries: new Array()
                        }
                    } 

                    grouped_entries[group_key].entries.push(e);
                })
            }
        )

        // Create metadata and sort groups
        return Object.keys(grouped_entries).map(
            k => {
                const entries = grouped_entries[k].entries;
                const n_checked = entries.filter(e => e.checked).length;

                return {
                    id: k.slugify(),
                    entries: entries.sort((a,b) => a.label.localeCompare(b.label) 
                        || a.compendium.localeCompare(b.compendium)),
                    label: grouped_entries[k].label,
                    source: null,
                    category: itemtype,
                    checked: n_checked > 0,
                    metadataLabel: SETTINGS[itemtype].metadataLabel,
                    indeterminate: n_checked > 0 && n_checked < entries.length,
                    selected: n_checked
                }
            }
        ).sort((a,b) => a.label.localeCompare(b.label))
    }
  
    _onChangeTab(event, tabs, active) {
        super._onChangeTab(event, tabs, active);
    }

    /**
     * Prepares groups for a given item type.
     *
     * @param {string} itemtype - The type of item for which to prepare groups.
     * @returns {Array<Object>} An array of group objects, each containing:
     *   - {string} label: The label of the group.
     *   - {number} id: The index of the group.
     *   - {string} itemtype: The type of item.
     *   - {boolean} checked: Whether the group is checked.
     *   - {string} valuePath: The path to the value to group by.
     *   - {string} itemLabelPath: The path to the item label to display.
     */
    _prepareGroups(itemtype) {
        return SETTINGS[itemtype].groups.map(
            (g, index) => {
                return {
                    label: g.groupLabel,
                    id: index,
                    itemtype: itemtype,
                    checked: this.selected_groups[itemtype].has(index),
                    valuePath: g.valuePath,
                    itemLabelPath: g.itemLabelPath || g.valuePath,
                }
            }
        )
    }

    /**
     * Prepares the context for the content selector.
     *
     * @param {Object} options - The options for preparing the context.
     * @returns {Promise<Object>} The prepared context.
     */
    async _prepareContext(options) {
        // Get current selections from settings
        const context = await super._prepareContext(options);
        const settings = SETTINGS[this.tabGroups.primary];        
        const selectedCompendia = [...new Set(getSetting(settings.sources).concat( 
            ...CONFIG.dndContentManager.fixed.get(this.tabGroups.primary).compendia)
        )];
        const selectedContent = new Set(getSetting(settings.content));


        //Get the entries we want users to be able to sort between with any filtering applied
        context.entries = await this._getContentOptions(settings.subtype, selectedCompendia, selectedContent);

        //Regroup the entries based on user selections
        context.groups = this._prepareGroups(this.tabGroups.primary)
        context.entries = this._reGroup(this.tabGroups.primary, context.groups, context.entries)

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
        context.isV3 = CONFIG.dndContentManager.systemV3;
        context.itemtype = this.tabGroups.primary
        context.duplicates = this.currentFilters.minItems > 0
        context.unique = this.currentFilters.unique
        context.numSources = selectedCompendia.length

        return context;
    }
}