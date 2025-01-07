import { error, log } from "./lib.mjs"
import { SETTINGS } from "./settings.mjs"
import { setSetting, getSetting } from "./settings.mjs"


export function exportSettings() {
    const settings_obj = {
        itemtypes: SETTINGS.itemtypes
    }

    for (const item of SETTINGS.itemtypes) {
        settings_obj[item] = {
            sources: getSetting(SETTINGS[item].sources),
            content: getSetting(SETTINGS[item].content),
            enabled: getSetting(SETTINGS[item].enabled)
        }
    }   
    settings_obj.version = getSetting(SETTINGS.lastLoadedVersion)

    return JSON.stringify(settings_obj)
}

export function importSettings(json) {
    const settings_obj = JSON.parse(json)

    for (const item of settings_obj.itemtypes) {
        log(`Updating settings for ${item}`)
        setSetting(SETTINGS[item].sources, settings_obj[item].sources)
        setSetting(SETTINGS[item].content, settings_obj[item].content)
        setSetting(SETTINGS[item].enabled, settings_obj[item].enabled)
    }
}


export class ExportDialog extends foundry.applications.api.DialogV2 {
    constructor() {
        super({
            window: { title: "Export Settings" },
            content: `
              <p>Download DnD Content Manager settings?
            `,
            buttons: [{
              action: "submit",
              label: "Download",
              default: true,
              callback: (event, button, dialog) => this.downloadFile(exportSettings())
            }, {
              action: "cancel",
              label: "Cancel"
            }]
        })
    }

    downloadFile(file) {
        const blob = new Blob([JSON.stringify(file)], { type: "application/json" });

        const element = document.createElement('a');
        element.setAttribute('href', window.URL.createObjectURL(blob));
        element.setAttribute('download', "dcm-settins.json");
    
        element.dispatchEvent(
            new MouseEvent("click", { bubbles: !0, cancelable: !0, view: window })
        )
        
        setTimeout(() => window.URL.revokeObjectURL(element.href), 5000);
    }
}


export class ImportDialog extends foundry.applications.api.DialogV2 {
    constructor() {
        super({
            window: { title: "Import Settings" },
            content: `
              <p>Upload a DnD Content Manager settings file to import.</p>
              <input type="file" id="file-input" accept=".json" />
            `,
            buttons: [{
                action: "submit",
                label: "Import",
                default: true,
                callback: (event, button, dialog) => this.importFile()
            }, {
                action: "cancel",
                label: "Cancel"
            }],
        });
    }

    async importFile() {
        // Get the file input element
        const fileInput = document.querySelector('#file-input');
        if (!fileInput || !fileInput.files.length) {
            ui.notifications.warn("No file selected. Please choose a file to import.");
            return;
        }

        const file = fileInput.files[0];

        // Read the file content
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                // Parse the JSON content
                const data = JSON.parse(event.target.result);
                importSettings(data)
                log("Imported settings")

                // Process the data as needed (e.g., apply settings)
                ui.notifications.info("Settings imported successfully!");
            } catch (err) {
                ui.notifications.error("Failed to parse the file. Ensure it is valid JSON.");
                error("Error parsing file:", err);
            }
        };

        reader.onerror = () => {
            ui.notifications.error("Failed to read the file. Please try again.");
            error("FileReader Error:", reader.error);
        };

        // Read the file as text
        reader.readAsText(file);
    }
}