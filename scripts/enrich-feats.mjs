const FEAT_TYPES = new Map([
    ["epicBoon", "Epic Boon"],
    ["fightingStyle", "Fighting Style"],
    ["general", "General Feat"],
    ["origin", "Origin Feat"],
])

export function getFeatType(ident) {
    if (CONFIG.DND5E.featureTypes.feat.has(ident)) {
        return CONFIG.DND5E.featureTypes.feat.get(ident)
    }
    return "Feat"
}