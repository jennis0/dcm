import { describe, it, expect, beforeEach } from "vitest";
import { setupFoundryMocks } from "../mocks/foundry.mjs";
import { SETTINGS } from "../../scripts/settings.mjs";
import {
    getSources,
    addSources,
    removeSources,
} from "../../scripts/source-management.mjs";

const TYPE = "class";

function seedSettings(settingsStore, { sources = [], content = [], previousContentSelections = {} } = {}) {
    settingsStore.set(SETTINGS[TYPE].sources, sources);
    settingsStore.set(SETTINGS[TYPE].content, content);
    settingsStore.set(SETTINGS[TYPE].previousContentSelections, previousContentSelections);
}

describe("getSources", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("returns the stored sources array", () => {
        seedSettings(settingsStore, { sources: ["pack-a", "pack-b"] });
        expect(getSources(TYPE)).toEqual(["pack-a", "pack-b"]);
    });
});

describe("addSources", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("adds a new source and sets forceRebuild", () => {
        seedSettings(settingsStore, { sources: ["pack-a"] });
        addSources(TYPE, ["pack-b"]);

        const stored = settingsStore.get(SETTINGS[TYPE].sources);
        expect(stored).toContain("pack-a");
        expect(stored).toContain("pack-b");
        expect(CONFIG.dndContentManager.forceRebuild).toBe(true);
    });

    it("does not set forceRebuild when adding duplicate source", () => {
        seedSettings(settingsStore, { sources: ["pack-a"] });
        addSources(TYPE, ["pack-a"]);

        expect(CONFIG.dndContentManager.forceRebuild).toBe(false);
    });

    it("restores previous content selections for newly added source only", () => {
        seedSettings(settingsStore, {
            sources: ["pack-a"],
            content: ["Compendium.mod.pack-a.item1"],
            previousContentSelections: {
                "pack-a": ["Compendium.mod.pack-a.item1", "Compendium.mod.pack-a.stale-item"],
                "pack-b": ["Compendium.mod.pack-b.itemX"],
            },
        });

        addSources(TYPE, ["pack-b"]);

        const content = settingsStore.get(SETTINGS[TYPE].content);
        expect(content).toContain("Compendium.mod.pack-a.item1");
        expect(content).toContain("Compendium.mod.pack-b.itemX");
        // Must NOT restore stale previous selections for pack-a
        expect(content).not.toContain("Compendium.mod.pack-a.stale-item");
    });

    it("does not modify content when no previous selections exist", () => {
        seedSettings(settingsStore, {
            sources: [],
            content: ["existing"],
            previousContentSelections: {},
        });

        addSources(TYPE, ["pack-new"]);

        const content = settingsStore.get(SETTINGS[TYPE].content);
        expect(content).toEqual(["existing"]);
    });
});

describe("removeSources", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("removes source and its content, sets forceRebuild", () => {
        seedSettings(settingsStore, {
            sources: ["pack-a", "pack-b"],
            content: [
                "Compendium.mod.pack-a.item1",
                "Compendium.mod.pack-b.item2",
            ],
        });

        removeSources(TYPE, ["pack-a"]);

        const sources = settingsStore.get(SETTINGS[TYPE].sources);
        expect(sources).toEqual(["pack-b"]);

        const content = settingsStore.get(SETTINGS[TYPE].content);
        expect(content).toEqual(["Compendium.mod.pack-b.item2"]);

        expect(CONFIG.dndContentManager.forceRebuild).toBe(true);
    });

    it("archives removed content to previousContentSelections", () => {
        seedSettings(settingsStore, {
            sources: ["pack-a"],
            content: ["Compendium.mod.pack-a.item1", "Compendium.mod.pack-a.item2"],
        });

        removeSources(TYPE, ["pack-a"]);

        const prev = settingsStore.get(SETTINGS[TYPE].previousContentSelections);
        expect(prev["pack-a"]).toContain("Compendium.mod.pack-a.item1");
        expect(prev["pack-a"]).toContain("Compendium.mod.pack-a.item2");
    });

    it("does not remove content from sources with similar names", () => {
        seedSettings(settingsStore, {
            sources: ["classes", "subclasses"],
            content: [
                "Compendium.dnd5e.classes.fighter",
                "Compendium.dnd5e.subclasses.champion",
            ],
        });

        removeSources(TYPE, ["classes"]);

        const content = settingsStore.get(SETTINGS[TYPE].content);
        expect(content).toEqual(["Compendium.dnd5e.subclasses.champion"]);
    });

    it("does not set forceRebuild when removing non-existent source", () => {
        seedSettings(settingsStore, {
            sources: ["pack-a"],
            content: ["Compendium.mod.pack-a.item1"],
        });

        removeSources(TYPE, ["pack-z"]);

        expect(CONFIG.dndContentManager.forceRebuild).toBe(false);
    });

    it("round-trips: remove then re-add restores content", () => {
        seedSettings(settingsStore, {
            sources: ["pack-a"],
            content: ["Compendium.mod.pack-a.item1"],
        });

        removeSources(TYPE, ["pack-a"]);
        expect(settingsStore.get(SETTINGS[TYPE].content)).toEqual([]);

        addSources(TYPE, ["pack-a"]);
        const content = settingsStore.get(SETTINGS[TYPE].content);
        expect(content).toContain("Compendium.mod.pack-a.item1");
    });
});
