import { isV3 } from "../lib.mjs";

export function getClassDetailsFromIdent(identifier) {
    if (!isV3() && game.system.registry.classes.get(identifier)) {
        return game.system.registry.classes.get(identifier)
    } else if (identifier && identifier.length > 1) {
        return {
            name: `${identifier.charAt(0).toUpperCase()}${identifier.slice(1, identifier.length)}`,
            img: "icons/svg/cowled.svg",
            identifier: identifier,
            sources: []
        }
    }
    return {name: "Unknown", img: "icons/svg/cowled.svg", identifier: identifier, source: []}
}
