import { MODULE_LABEL } from "./constants.mjs";

export function debug(text) {
    console.debug(`${MODULE_LABEL} | ${text}`)
}

export function log(text) {
    console.log(`${MODULE_LABEL} | ${text}`)
}

export function warn(text) {
    console.log(`${MODULE_LABEL} | ${text}`)
}

export function error(text) {
    console.log(`${MODULE_LABEL} | ${text}`)
}