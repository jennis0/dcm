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
    return game.system.version.startsWith("3.")
}

export function getOrdinalSuffix(i) {
    let j = i % 10,
        k = i % 100;
    if (j === 1 && k !== 11) {
        return i + "st";
    }
    if (j === 2 && k !== 12) {
        return i + "nd";
    }
    if (j === 3 && k !== 13) {
        return i + "rd";
    }
    return i + "th";
}