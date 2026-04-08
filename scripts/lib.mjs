import { MODULE_LABEL, getSetting, setSetting } from "./settings.mjs";

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

/**
 * Filters an array in-place, modifying it to only contain elements that pass the filter.
 * On error, the element is kept (safe fallback) and a warning is logged.
 *
 * @param {Array} array - The array to filter in-place.
 * @param {Function} filterFn - Predicate function; return true to keep the element.
 * @param {string} [context="item"] - Label for warning messages (e.g., "heromancer item").
 * @param {Function} [describer] - Extracts an identifier from an element for error logging.
 * @returns {number} The new length of the array.
 */
export function inPlaceFilter(array, filterFn, context = "item", describer = (item) => item?.uuid ?? "unknown") {
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < array.length; readIndex++) {
        try {
            if (filterFn(array[readIndex])) {
                array[writeIndex] = array[readIndex];
                writeIndex++;
            }
        } catch (e) {
            warn(`Failed to filter ${context} ${describer(array[readIndex])}: ${e.message}`);
            array[writeIndex] = array[readIndex];
            writeIndex++;
        }
    }
    array.length = writeIndex;
    return array.length;
}

/**
 * Loads a Foundry setting as a Set, applies a mutation, saves it back, and flags a rebuild.
 *
 * @param {string} settingKey - The Foundry setting key to load/save.
 * @param {Function} mutationFn - Receives the Set; mutate it in place (add/delete).
 * @returns {Set} The mutated Set.
 */
export function mutateSettingSet(settingKey, mutationFn) {
    const original = new Set(getSetting(settingKey));
    const set = new Set(original);
    mutationFn(set);
    setSetting(settingKey, [...set]);
    const changed = set.size !== original.size || [...original].some(item => !set.has(item));
    if (changed) {
        CONFIG.dndContentManager.forceRebuild = true;
    }
    return set;
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