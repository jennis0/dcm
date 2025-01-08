export const MODULE_NAME = "dnd5e-content-manager"
export const MODULE_LABEL = "DnD Content Manager"

export const SETTINGS = {

    itemtypes: [
        "class",
        "subclass",
        "race",
        "background",
        "feat",
        "items",
        "spell",
        "spelllist"
    ],

    items : {
        label: "Items",
        metadataLabel: "Type",
        icon: "systems/dnd5e/icons/svg/items/container.svg",
        sources: "itemSources",
        content: "items",
        enabled: "filterItems",
        type: "Item",
        subtype: "items",
        item_subtypes: ["container", "consumable", "equipment", "loot", "tattoo", "tool", "weapon"],
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "Type", valuePath: "metadata"},
        ]
    },

    spell : {
        label: "Spells",
        metadataLabel: "Level | School",
        icon: "systems/dnd5e/icons/svg/items/spell.svg",
        sources: "spellSources",
        content: "spells",
        enabled: "filterSpells",
        type: "Item",
        subtype: "spell",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "School", valuePath: "school"},
            {groupLabel: "Spell Level", valuePath: "levelInt", itemLabelPath: "level"},
        ]
    },

    spelllist: {
        label: "Spell Lists",
        metadataLabel: "Class",
        icon: "systems/dnd5e/icons/svg/item-grant.svg",
        sources: "spellListSources",
        content: "spellLists",
        enabled: "filterSpellLists",
        type: "JournalEntry",
        subtype: "spells",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Journal", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "Class", valuePath: "metadata"},
        ]
    },

    class: {
        label: "Classes",
        metadataLabel: "",
        icon: "systems/dnd5e/icons/svg/items/class.svg",
        sources: "classSources",
        content: "classes",
        enabled: "filterClasses",
        type: "Item",
        subtype: "class",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"}
        ]
    },

    subclass: {
        label: "Subclasses",
        metadataLabel: "Class",
        icon: "systems/dnd5e/icons/svg/items/subclass.svg",
        sources: "subclassSources",
        content: "subclasses",
        enabled: "filtersubClasses",
        type: "Item",
        subtype: "subclass",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "Class", valuePath: "metadata"},
        ]
    },

    feat: {
        label: "Feats",
        metadataLabel: "Feat Type",
        icon: "systems/dnd5e/icons/svg/items/feature.svg",
        sources: "featSources",
        content: "feats",
        enabled: "filterFeats",
        type: "Item",
        subtype: "feat",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "Feat Type", valuePath: "metadata"},
        ]
    },

    race: {
        label: "Species",
        metadataLabel: "",
        icon: "systems/dnd5e/icons/svg/items/race.svg",
        sources: "speciesSources",
        content: "species",
        enabled: "filterSpecies",
        type: "Item",
        subtype: "race",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"}
        ]
    },

    background: {
        label: "Backgrounds",
        metadataLabel: "",
        icon: "systems/dnd5e/icons/svg/items/background.svg",
        sources: "backgroundSources",
        content: "backgrounds",
        enabled: "filterBackgrounds",
        type: "Item",
        subtype: "background",
        groups: [
            {groupLabel: "Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "Source", valuePath: "source", itemLabelPath: "sourceName"}
        ]
    },

    lastLoadedVersion: "lastLoadedVersion",
    filterQuickInsert: "filterQuickInsert"
}

export function getSetting(path) {
    return game.settings.get(MODULE_NAME, path);
}

export function setSetting(path, value, min_role=4) {
    if (game.user.role < min_role) {
        return
    }
    game.settings.set(MODULE_NAME, path, value);
}