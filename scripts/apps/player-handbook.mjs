import { MODULE_NAME, getSetting, setSetting, SETTINGS } from "../settings.mjs";
import { log } from "../lib.mjs";
import { createHandbooks } from "../presentation/create-handbook.mjs";
import { CheckboxElement } from "../elements/checkbox.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class PlayerHandbookMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    //App to create a "Player's Handbook" containing allowed content

    constructor() {
        super();
    }

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

    static PARTS = {
        enable: {
            template: `modules/${MODULE_NAME}/templates/ph.html`
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
          }
    }

    static async submitHandler(event, form, formData) {
        const options = formData.object;

        if (!options.folderTitle) {
            options.folderTitle = "Player Handbook"
        }

        console.log(formData)

        createHandbooks(options)
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.buttons = [{ type: "submit", icon: "fas fa-write", label: "Create Handbook" }];
        context.options = {
            class: true,
            races: true,
            backgrounds: true,
            feats: true,
            spells: true,
            existingPages: true,
            folderTitle: null,
            journalStyle: null
        }

        context.styleOptions = [
            {value: null, label: "Default Style", selected: true},    
            ...Object.keys(CONFIG.JournalEntry.sheetClasses.base).map(
                k => {return {
                    value: k, label: CONFIG.JournalEntry.sheetClasses.base[k].label
                }}
            )
        ]

        return context;
    }
}
