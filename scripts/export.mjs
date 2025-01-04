import { MODULE_NAME, SETTINGS } from "./settings.mjs"


export function export_settings() {
    const settings_obj = {
        itemtypes: SETTINGS.itemtypes
    }

    for (const item of SETTINGS.itemtypes) {
        settings_obj[item] = {
            sources: game.settings.get(MODULE_NAME, SETTINGS[item].sources),
            content: game.settings.get(MODULE_NAME, SETTINGS[item].content),
            enabled: game.settings.get(MODULE_NAME, SETTINGS[item].enabled)
        }
    }   
    settings_obj.version = game.settings.get(MODULE_NAME, SETTINGS.lastLoadedVersion)

    return JSON.stringify(settings_obj)
}

export function import_settings(json) {
    const settings_obj = JSON.parse(json)

    for (const item of settings_obj.itemtypes) {
        game.settings.set(MODULE_NAME, SETTINGS[item].sources, settings_obj[item].sources)
        game.settings.set(MODULE_NAME, SETTINGS[item].content, settings_obj[item].content)
        game.settings.set(MODULE_NAME, SETTINGS[item].enabled, settings_obj[item].enabled)
    }
}