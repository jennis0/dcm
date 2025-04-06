const FEAT_TYPES = new Map([
    ["epicBoon", "Epic Boon"],
    ["fightingStyle", "Fighting Style"],
    ["general", "General Feat"],
    ["origin", "Origin Feat"],
])

function getFeatTypeV3(ident) {
    if (FEAT_TYPES.has(ident)) {
        return FEAT_TYPES.get(ident)
    }
    return "Feat"
}

function getFeatTypeV4(ident) {
    if (ident in CONFIG.DND5E.featureTypes.feat.subtypes) {
        return CONFIG.DND5E.featureTypes.feat.subtypes[ident]
    }
    return "Unspecified Feat Type"
}

export function getFeatType(ident) {
    if (CONFIG.dndContentManager.systemV3) {
        return getFeatTypeV3(ident)
    } else {
        return getFeatTypeV4(ident)
    }
}
