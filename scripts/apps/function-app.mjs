import { MODULE_NAME, setSetting, SETTINGS } from "../settings.mjs";
import { log } from "../lib.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class FunctionApp extends HandlebarsApplicationMixin(ApplicationV2) {
    //Basic app to allow users to clear the current settings or selected content
    constructor(fn) {
        super();
        fn();
        this.close();
    }

    static DEFAULT_OPTIONS = {
            tag: "div",
            window: {
                title: "",
            },
            position: {
                width: 1,
                height: "auto"
              },
            id: 'function-form',
            title: '',
            classes: ["dcm hidden"],
            resizable: false,
    }

    static PARTS = {
    }
}