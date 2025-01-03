const FEAT_TYPES = new Map([
    ["epicBoon", "Epic Boon"],
    ["fightingStyle", "Fighting Style"],
    ["general", "General Feat"],
    ["origin", "Origin Feat"],
])

export function getFeatType(ident) {
    if (FEAT_TYPES.has(ident)) {
        return FEAT_TYPES.get(ident)
    }
    return "Feat"
}