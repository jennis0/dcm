import { MODULE_NAME, getSetting, setSetting, SETTINGS } from "../settings.mjs";
import { log } from "../lib.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class EnableMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    //Basic app to allow users to clear the current settings or selected content
    constructor() {
        super();
    }

    static DEFAULT_OPTIONS = {
            tag: "form",
            window: {
                title: "Choose Filtered Types",
                icon: null,
                resizeable: true
            },
            form: {
                handler: EnableMenu.submitHandler,
                submitOnChange: false,
                closeOnSubmit: true
            },
            position: {
                width: 350,
                height: "auto"
              },
            id: 'compendium-enable',
            classes: ["dcm dnd5e2"],
            actions: {
                toggleSetting: EnableMenu.#onToggleSetting
            },
            resizable: false,
    }

    static PARTS = {
        enable: {
            template: `modules/${MODULE_NAME}/templates/enable.html`
        }
    }

    static async #onToggleSetting(event, target) {
        const itemtype = SETTINGS[target.name]
        setSetting(itemtype.enabled, target.checked);
        log(`Set ${target.name} to ${target.checked ? "Filtered": "Not Filtered"}`)
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.itemtypes = SETTINGS.itemtypes.map(
            type => {
                const settings = SETTINGS[type]
                return {
                    type: type,
                    label: settings.label,
                    checked: getSetting(settings.enabled),
                    icon: settings.icon
                }
            }
        )

        return context;
    }
}