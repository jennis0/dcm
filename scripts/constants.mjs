export const MODULE_NAME = "dcm"
export const MODULE_LABEL = "DnD Content Manager"

export const SETTINGS = {

    itemtypes: [
        "class",
        "subclass",
        "race",
        "background",
        "feat",
        "spelllist"
    ],

    spelllist: {
        label: "Spell Lists",
        icon: "systems/dnd5e/icons/svg/items/spell.svg",
        sources: "spellListSources",
        content: "spellLists",
        type: "JournalEntry",
        subtype: "spells"
    },

    class: {
        label: "Classes",
        icon: "systems/dnd5e/icons/svg/items/class.svg",
        sources: "classSources",
        content: "classes",
        type: "Item",
        subtype: "class",
        compendium: `${MODULE_NAME}-classes`
    },

    subclass: {
        label: "Subclasses",
        icon: "systems/dnd5e/icons/svg/items/subclass.svg",
        sources: "subclassSources",
        content: "subclasses",
        type: "Item",
        subtype: "subclass",
        compendium: `${MODULE_NAME}-subclasses`
    },

    feat: {
        label: "Feats",
        icon: "systems/dnd5e/icons/svg/items/feature.svg",
        sources: "featSources",
        content: "feats",
        type: "Item",
        subtype: "feature",
        compendium: `${MODULE_NAME}-feats`
        
    },

    race: {
        label: "Species",
        icon: "systems/dnd5e/icons/svg/items/race.svg",
        sources: "speciesSources",
        content: "species",
        type: "Item",
        subtype: "race",
        compendium: `${MODULE_NAME}-species`
    },

    background: {
        label: "Backgrounds",
        icon: "systems/dnd5e/icons/svg/items/background.svg",
        sources: "backgroundSources",
        content: "backgrounds",
        type: "Item",
        subtype: "background",
        compendium: `${MODULE_NAME}-backgrounds`
    }
}