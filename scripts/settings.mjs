export const MODULE_NAME = "dnd5e-content-manager"
export const MODULE_LABEL = "DnD Content Manager"

/**
 * A global settings object for the module
 */
export const SETTINGS = {

    /**
     * The list of item types that can be managed by the module
     */
    itemtypes: [
        "class",
        "subclass",
        "race",
        "background",
        "feat",
        "items",
        "spell",
        "spelllist",
        "monster",
    ],

    /**
     * Configuration of the 'item' type management
     */
    items : {
        label: "Items",
        metadataLabel: "Type",
        icon: "systems/dnd5e/icons/svg/items/container.svg",
        sources: "itemSources",
        content: "items",
        previousContentSelections: "previousItemSelections",
        enabled: "filterItems",
        type: "Item",
        subtype: "items",
        item_subtypes: ["container", "consumable", "equipment", "loot", "tattoo", "tool", "weapon"],
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "Type", valuePath: "metadata"},
            {groupLabel: "Name", valuePath: "label"}
        ]
    },

    spell : {
        label: "Spells",
        metadataLabel: "Level | School",
        icon: "systems/dnd5e/icons/svg/items/spell.svg",
        sources: "spellSources",
        content: "spells",
        previousContentSelections: "previousSpellSelections",
        enabled: "filterSpells",
        type: "Item",
        subtype: "spell",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "School", valuePath: "school"},
            {groupLabel: "Spell Level", valuePath: "levelInt", itemLabelPath: "level"},
            {groupLabel: "Name", valuePath: "label"}
        ]
    },

    spelllist: {
        label: "Spell Lists",
        metadataLabel: "Class",
        icon: "systems/dnd5e/icons/svg/item-grant.svg",
        sources: "spellListSources",
        content: "spellLists",
        previousContentSelections: "previousSpellListSelections",
        enabled: "filterSpellLists",
        type: "JournalEntry",
        subtype: "spells",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Journal", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "Class", valuePath: "metadata"},
            {groupLabel: "Name", valuePath: "label"}
        ]
    },

    class: {
        label: "Classes",
        metadataLabel: "",
        icon: "systems/dnd5e/icons/svg/items/class.svg",
        sources: "classSources",
        content: "classes",
        previousContentSelections: "previousClassSelections",
        enabled: "filterClasses",
        type: "Item",
        subtype: "class",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "Name", valuePath: "label"}
        ]
    },

    subclass: {
        label: "Subclasses",
        metadataLabel: "Class",
        icon: "systems/dnd5e/icons/svg/items/subclass.svg",
        sources: "subclassSources",
        content: "subclasses",
        previousContentSelections: "previousSubclassSelections",
        enabled: "filtersubClasses", // Persisted setting key — do not rename without migration
        type: "Item",
        subtype: "subclass",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "Class", valuePath: "metadata"},
            {groupLabel: "Name", valuePath: "label"}
        ]
    },

    feat: {
        label: "Feats",
        metadataLabel: "Feat Type",
        icon: "systems/dnd5e/icons/svg/items/feature.svg",
        sources: "featSources",
        content: "feats",
        previousContentSelections: "previousFeatSelections",
        enabled: "filterFeats",
        type: "Item",
        subtype: "feat",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "Feat Type", valuePath: "metadata"},
            {groupLabel: "Name", valuePath: "label"}
        ]
    },

    race: {
        label: "Species",
        metadataLabel: "",
        icon: "systems/dnd5e/icons/svg/items/race.svg",
        sources: "speciesSources",
        content: "species",
        previousContentSelections: "previousSpeciesSelections",
        enabled: "filterSpecies",
        type: "Item",
        subtype: "race",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "Name", valuePath: "label"}
        ]
    },

    background: {
        label: "Backgrounds",
        metadataLabel: "",
        icon: "systems/dnd5e/icons/svg/items/background.svg",
        sources: "backgroundSources",
        content: "backgrounds",
        previousContentSelections: "previousBackgroundSelections",
        enabled: "filterBackgrounds",
        type: "Item",
        subtype: "background",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "Name", valuePath: "label"}
        ]
    },

    monster: {
        label: "Monsters",
        metadataLabel: "",
        icon: "systems/dnd5e/icons/svg/monster.svg",
        sources: "monsterSources",
        content: "monsters",
        previousContentSelections: "previousMonsterSelections",
        enabled: "filterMonsters",
        type: "Actor",
        subtype: "npc",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "Type", valuePath: "typeName"},
            {groupLabel: "Name", valuePath: "label"}
        ]
    },

    lastLoadedVersion: "lastLoadedVersion",
    filterQuickInsert: "filterQuickInsert",
    filterSpotlight: "filterSpotlight",
    filterHeromancer: "filterHeromancer",
    injectCompendiumButtons: "injectCompendiumButtons",
    injectItemButton: "injectItemButton",
    playerHandbookOptions: "playerHandbookOptions",
    overrideCompendium: "overrideCompendium"
}

/**
 * Wrapper for game.settings.get that includes the module name
 * @param {string} path - The path of the setting
 * @returns {*} The value of the setting
 */
export function getSetting(path) {
    return game.settings.get(MODULE_NAME, path);
}

/**
 * Sets a game setting if the user has permission to modify settings.
 * Mirrors Foundry's own rule for world settings (SETTINGS_MODIFY), which
 * Assistant GMs hold by default and can be granted to players.
 * @param {string} path - The path of the setting
 * @param {*} value - The value of the setting
 * @returns
 */
export function setSetting(path, value) {
    if (!game.user.can("SETTINGS_MODIFY")) {
        return
    }
    game.settings.set(MODULE_NAME, path, value);
}