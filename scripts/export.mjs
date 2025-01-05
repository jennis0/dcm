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
        setSetting(SETTINGS[item].sources, settings_obj[item].sources)
        setSetting(SETTINGS[item].content, settings_obj[item].content)
        setSetting(SETTINGS[item].enabled, settings_obj[item].enabled)
    }
}