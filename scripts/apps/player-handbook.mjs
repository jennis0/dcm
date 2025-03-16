import { MODULE_NAME, getSetting, setSetting, SETTINGS } from "../settings.mjs";
import { log } from "../lib.mjs";
import { createHandbooks } from "../presentation/create-handbook.mjs";
import { CheckboxElement } from "../elements/checkbox.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

/**
 * A FoundryVTT application for creating Player Handbooks containing allowed content.
 * Extends ApplicationV2 with Handlebars mixing for template support.
 */
export class PlayerHandbookMenu extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
            tag: "form",
            window: {
                title: "Create Player Handbook",
                icon: null,
                resizeable: true
            },
            form: {
                handler: PlayerHandbookMenu.submitHandler,
                submitOnChange: false,
                closeOnSubmit: true
            },
            position: {
                width: 350,
                height: "auto"
              },
            id: 'dcm-player-handbook',
            classes: ["dcm dnd5e2 handbook-config"],
            resizable: false,
    }

    /**
     * Creates a button for the Compendium Sidebar that opens the handbook creator
     * @static
     * @returns {HTMLButtonElement} The created button element
     */
    static createSidebarButton() {
        const button = document.createElement("button", {
            caption: "Create Player Option Journals"
        });
        
        button.classList.add("player-handbook-button");
        button.setAttribute("data-tooltip", "Create Player Option Journals");
        button.type = "button";
        button.innerHTML = '<i class="fas fa-book-sparkles" inert></i>';
        
        button.addEventListener("click", event => {
            (new PlayerHandbookMenu()).render({ force: true });
        });
        
        return button;
    }


    static PARTS = {
        enable: {
            template: `modules/${MODULE_NAME}/templates/ph.html`
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
          }
    }

    /**
     * Handles form submission and creates handbooks based on selected options
     * @static
     * @param {Event} event - The form submission event
     * @param {HTMLFormElement} form - The form element
     * @param {FormData} formData - The processed form data
     */
    static async submitHandler(event, form, formData) {
        const options = formData.object;

        if (!options.folderTitle) {
            options.folderTitle = getSetting(SETTINGS.playerHandbookOptions).folderTitle;

        }

        setSetting(SETTINGS.playerHandbookOptions, options)
        createHandbooks(options)
    }

    /**
     * Prepares the context data used to render the template
     * @param {Object} options - Application options
     * @returns {Object} The prepared context object
     * @override
     */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        
        // Configure submit button
        context.buttons = [{
            type: "submit",
            icon: "fas fa-write",
            label: "Create Handbook"
        }];

        // Set default options for handbook content
        context.options = getSetting(SETTINGS.playerHandbookOptions)
        // Prepare journal style options
        context.styleOptions = [
            { value: null, label: "Default Style", selected: true },
            ...Object.keys(CONFIG.JournalEntry.sheetClasses.base).map(k => ({
                value: k,
                label: CONFIG.JournalEntry.sheetClasses.base[k].label,
                selected: k === context.options.styleOption
            }))
        ];

        return context;
    }
}
