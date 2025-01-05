import { MODULE_NAME, SETTINGS } from "../settings.mjs";
import { log } from "../lib.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class ClearSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    //Basic app to allow users to clear the current settings or selected content
    constructor() {
        super();
    }

    static DEFAULT_OPTIONS = {
            tag: "form",
            window: {
                title: "Clear Content",
                icon: "fas fa-trash",
                resizeable: true
            },
            form: {
                handler: ClearSettings.submitHandler,
                submitOnChange: false,
                closeOnSubmit: true
            },
            position: {
                width: 350,
                height: "auto"
              },
            id: 'compendium-clear',
            title: 'Clear',
            classes: ["dcm dnd5e2"],
            resizable: false,
    }

    static PARTS = {
        clear: {
            template: `modules/${MODULE_NAME}/templates/clear.html`
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
          }
    }

    static async submitHandler(event, form, formData) {
        this._clearSettings(formData.object);
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.buttons = [{ type: "submit", icon: "fas fa-trash", label: "Delete" }];
        return context;
    }

    async _clearSettings(options) {
        SETTINGS.itemtypes.forEach(async (i) => {
            const s = SETTINGS[i];
            if (options['clear-sources']) {
                log(`Clearing source configuration for ${s.label}`)
                setSetting(s.sources, null);
                setSetting(s.enabled, null);
            }
            
            if (options['clear-selections']) {
                log(`Clearing character option configuration for ${s.label}`)
                setSetting(s.content, null);
            }
            log(`Finished clearing settings for ${s.label}`)
        });
        
    }

}