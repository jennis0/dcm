import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupFoundryMocks } from "../mocks/foundry.mjs";
import { SETTINGS } from "../../scripts/settings.mjs";
import { DCMIndex } from "../../scripts/index.mjs";

/**
 * Seed the settings store with enabled types, sources, and content
 * so that rebuild() produces a usable index.
 */
function seedIndex(settingsStore, configs) {
    // Disable all types by default
    for (const type of SETTINGS.itemtypes) {
        settingsStore.set(SETTINGS[type].enabled, false);
        settingsStore.set(SETTINGS[type].content, []);
        settingsStore.set(SETTINGS[type].sources, []);
    }
    // Apply overrides
    for (const [type, { sources, content }] of Object.entries(configs)) {
        settingsStore.set(SETTINGS[type].enabled, true);
        settingsStore.set(SETTINGS[type].sources, sources);
        settingsStore.set(SETTINGS[type].content, content);
    }
}

describe("DCMIndex._buildIndexMap", () => {
    beforeEach(() => {
        setupFoundryMocks();
    });

    it("maps item subtypes to their settings keys", () => {
        const map = DCMIndex._buildIndexMap();

        expect(map["class"]).toBe("class");
        expect(map["subclass"]).toBe("subclass");
        expect(map["spell"]).toBe("spell");
        expect(map["race"]).toBe("race");
        expect(map["feat"]).toBe("feat");
        expect(map["background"]).toBe("background");
        expect(map["npc"]).toBe("monster");
    });

    it("expands items subtypes to all share the 'items' key", () => {
        const map = DCMIndex._buildIndexMap();

        for (const subtype of SETTINGS.items.item_subtypes) {
            expect(map[subtype]).toBe("items");
        }
    });

    it("excludes JournalEntry types", () => {
        const map = DCMIndex._buildIndexMap();

        // spelllist has type "JournalEntry" and subtype "spells"
        expect(map["spells"]).toBeUndefined();
    });
});

describe("DCMIndex._buildItemIndices", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("builds index for enabled types with content", () => {
        seedIndex(settingsStore, {
            class: {
                sources: ["pack-a"],
                content: ["Compendium.mod.pack-a.fighter"],
            },
        });

        const index = DCMIndex._buildItemIndices();

        expect(index["class"]).toBeDefined();
        expect(index["class"].items.has("Compendium.mod.pack-a.fighter")).toBe(true);
        expect(index["class"].sources.has("pack-a")).toBe(true);
    });

    it("skips disabled types", () => {
        seedIndex(settingsStore, {});
        // All types disabled by seedIndex defaults

        const index = DCMIndex._buildItemIndices();

        expect(index["class"]).toBeUndefined();
    });

    it("skips enabled types with empty content and shows warning", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        seedIndex(settingsStore, {
            class: { sources: ["pack-a"], content: [] },
        });

        const index = DCMIndex._buildItemIndices();

        expect(index["class"]).toBeUndefined();
        expect(warnSpy).toHaveBeenCalled();

        warnSpy.mockRestore();
    });

    it("does not skip JournalEntry types even with empty content", () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});

        seedIndex(settingsStore, {
            spelllist: { sources: ["pack-a"], content: [] },
        });

        const index = DCMIndex._buildItemIndices();

        expect(index["spelllist"]).toBeDefined();

        console.warn.mockRestore();
    });
});

describe("DCMIndex.rebuild", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("populates maps and clears forceRebuild", () => {
        seedIndex(settingsStore, {
            subclass: {
                sources: ["pack-a"],
                content: ["Compendium.mod.pack-a.champion"],
            },
        });

        CONFIG.dndContentManager.forceRebuild = true;
        const idx = new DCMIndex();
        idx.rebuild();

        expect(idx.itemTypeToIndexMap["subclass"]).toBe("subclass");
        expect(idx.permittedItemIndices["subclass"]).toBeDefined();
        expect(CONFIG.dndContentManager.forceRebuild).toBe(false);
    });
});

describe("DCMIndex.itemInIndex", () => {
    let settingsStore, idx;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());

        seedIndex(settingsStore, {
            subclass: {
                sources: ["pack-a"],
                content: ["Compendium.mod.pack-a.champion"],
            },
        });

        idx = new DCMIndex();
        idx.rebuild();
    });

    it("allows items that are in the index", () => {
        expect(idx.itemInIndex("Item", "subclass", "Compendium.mod.pack-a.champion")).toBe(true);
    });

    it("rejects items not in the index", () => {
        expect(idx.itemInIndex("Item", "subclass", "Compendium.mod.pack-a.berserker")).toBe(false);
    });

    it("rejects items from a non-enabled source", () => {
        expect(idx.itemInIndex("Item", "subclass", "Compendium.mod.pack-b.something")).toBe(false);
    });

    it("always allows JournalEntry documents", () => {
        expect(idx.itemInIndex("JournalEntry", "spells", "Compendium.mod.pack-z.anything")).toBe(true);
    });

    it("allows items of untracked subtypes (show everything fallback)", () => {
        expect(idx.itemInIndex("Item", "unknown-type", "Compendium.mod.pack-a.whatever")).toBe(true);
    });

    it("allows items when type is enabled but has no index entry (empty content fallback)", () => {
        // background is not seeded so has no index entry
        expect(idx.itemInIndex("Item", "background", "Compendium.mod.pack-a.noble")).toBe(true);
    });

    it("allows world items (no collection metadata)", () => {
        // Our mock returns no metadata for non-Compendium UUIDs
        expect(idx.itemInIndex("Item", "subclass", "World.items.some-id")).toBe(true);
    });

    it("returns true and logs warning on parseUuid error", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        // Force parseUuid to throw
        const origParseUuid = foundry.utils.parseUuid;
        foundry.utils.parseUuid = () => { throw new Error("bad uuid"); };

        expect(idx.itemInIndex("Item", "subclass", "garbage")).toBe(true);
        expect(warnSpy).toHaveBeenCalled();
        expect(warnSpy.mock.calls[0][0]).toContain("bad uuid");

        foundry.utils.parseUuid = origParseUuid;
        warnSpy.mockRestore();
    });

    it("returns true when collection is null (world item path)", () => {
        const origParseUuid = foundry.utils.parseUuid;
        foundry.utils.parseUuid = () => ({ uuid: "test", collection: null });

        expect(idx.itemInIndex("Item", "subclass", "test")).toBe(true);

        foundry.utils.parseUuid = origParseUuid;
    });
});

describe("DCMIndex.compendiumBrowserItemInIndex", () => {
    let settingsStore, idx;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());

        seedIndex(settingsStore, {
            monster: {
                sources: ["bestiary"],
                content: ["Compendium.mod.bestiary.goblin"],
            },
            feat: {
                sources: ["pack-a"],
                content: ["Compendium.mod.pack-a.alert"],
            },
        });

        idx = new DCMIndex();
        idx.rebuild();
    });

    it("routes npc items through Actor document type", () => {
        const goblin = { type: "npc", uuid: "Compendium.mod.bestiary.goblin" };
        expect(idx.compendiumBrowserItemInIndex(goblin)).toBe(true);

        const dragon = { type: "npc", uuid: "Compendium.mod.bestiary.dragon" };
        expect(idx.compendiumBrowserItemInIndex(dragon)).toBe(false);
    });

    it("allows non-feat feats (class features) without filtering", () => {
        const classFeature = {
            type: "feat",
            uuid: "Compendium.mod.pack-a.extra-attack",
            system: { type: { value: "class" } },
        };
        expect(idx.compendiumBrowserItemInIndex(classFeature)).toBe(true);
    });

    it("filters actual feats normally", () => {
        const alertFeat = {
            type: "feat",
            uuid: "Compendium.mod.pack-a.alert",
            system: { type: { value: "feat" } },
        };
        expect(idx.compendiumBrowserItemInIndex(alertFeat)).toBe(true);

        const unknownFeat = {
            type: "feat",
            uuid: "Compendium.mod.pack-a.unknown",
            system: { type: { value: "feat" } },
        };
        expect(idx.compendiumBrowserItemInIndex(unknownFeat)).toBe(false);
    });
});

describe("DCMIndex.itemTypeInIndex / itemSourceInIndex", () => {
    let settingsStore, idx;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());

        seedIndex(settingsStore, {
            class: {
                sources: ["pack-a"],
                content: ["Compendium.mod.pack-a.fighter"],
            },
        });

        idx = new DCMIndex();
        idx.rebuild();
    });

    it("itemTypeInIndex returns true for tracked types with an index", () => {
        expect(idx.itemTypeInIndex({ type: "class" })).toBe(true);
    });

    it("itemTypeInIndex returns false for untracked types", () => {
        expect(idx.itemTypeInIndex({ type: "unknown" })).toBe(false);
    });

    it("itemTypeInIndex returns false for tracked types without an index entry", () => {
        // subclass is tracked but not enabled/seeded
        expect(idx.itemTypeInIndex({ type: "subclass" })).toBe(false);
    });

    it("itemSourceInIndex returns true for enabled sources", () => {
        expect(idx.itemSourceInIndex({ type: "class", uuid: "Compendium.mod.pack-a.fighter" })).toBe(true);
    });

    it("itemSourceInIndex returns false for non-enabled sources", () => {
        expect(idx.itemSourceInIndex({ type: "class", uuid: "Compendium.mod.pack-b.wizard" })).toBe(false);
    });

    it("itemSourceInIndex returns false for untracked types", () => {
        expect(idx.itemSourceInIndex({ type: "unknown", uuid: "Compendium.mod.pack-a.x" })).toBe(false);
    });

    it("itemSourceInIndex returns false on error", () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});

        const origParseUuid = foundry.utils.parseUuid;
        foundry.utils.parseUuid = () => { throw new Error("bad"); };

        expect(idx.itemSourceInIndex({ type: "class", uuid: "bad" })).toBe(false);

        foundry.utils.parseUuid = origParseUuid;
        console.warn.mockRestore();
    });
});
