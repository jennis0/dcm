import { MODULE_LABEL } from "./settings.mjs";

export function debug(text) {
    console.debug(`${MODULE_LABEL} | ${text}`)
}

export function log(text) {
    console.log(`${MODULE_LABEL} | ${text}`)
}

export function warn(text) {
    console.warn(`${MODULE_LABEL} | ${text}`)
}

export function error(text) {
    console.error(`${MODULE_LABEL} | ${text}`)
}

export function isV3() {
    return game.system.version.startsWith("v3.")
}