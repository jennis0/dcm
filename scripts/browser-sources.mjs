import { warn } from "./lib.mjs";

//Pack types the dnd5e Compendium Browser can search - other packs are never affected by its sources
const BROWSER_PACK_TYPES = new Set(["Actor", "Item"]);

/**
 * Gets the set of compendium packs currently searched by the dnd5e Compendium Browser,
 * as configured in its "Compendium Browser Sources" setting.
 * @returns {Set<string>|null} Pack collection IDs, or null if dnd5e doesn't expose them
 */
export function getCompendiumBrowserSources() {
    const config = globalThis.dnd5e?.applications?.settings?.CompendiumBrowserSettingsConfig;
    try {
        return config?.collateSources?.() ?? null;
    } catch (e) {
        warn(`Unable to read Compendium Browser sources: ${e.message}`);
        return null;
    }
}

/**
 * Whether a pack has been turned off in the dnd5e Compendium Browser sources.
 * @param {CompendiumCollection} pack - The compendium pack
 * @param {Set<string>|null} browserSources - Result of getCompendiumBrowserSources()
 * @returns {boolean} True if the Compendium Browser won't search this pack
 */
export function isBrowserDisabled(pack, browserSources) {
    if (!browserSources || !BROWSER_PACK_TYPES.has(pack.metadata.type)) {
        return false;
    }
    return !browserSources.has(pack.metadata.id);
}
