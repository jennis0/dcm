import { describe, it, expect, beforeEach } from "vitest";
import { setupFoundryMocks } from "../mocks/foundry.mjs";
import { SETTINGS } from "../../scripts/settings.mjs";
import {
    getContent,
    addContent,
    removeContent,
    removeContentBySource,
} from "../../scripts/content-management.mjs";

// Use "class" as a representative item type for testing
const TYPE = "class";

function seedContent(settingsStore, items) {
    settingsStore.set(SETTINGS[TYPE].content, items);
}

describe("getContent", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("returns the stored content array", () => {
        seedContent(settingsStore, ["a", "b"]);
        expect(getContent(TYPE)).toEqual(["a", "b"]);
    });
});

describe("addContent", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("adds new items and sets forceRebuild", () => {
        seedContent(settingsStore, ["a"]);
        addContent(TYPE, ["b", "c"]);

        const stored = settingsStore.get(SETTINGS[TYPE].content);
        expect(stored).toContain("a");
        expect(stored).toContain("b");
        expect(stored).toContain("c");
        expect(CONFIG.dndContentManager.forceRebuild).toBe(true);
    });

    it("deduplicates when adding existing items", () => {
        seedContent(settingsStore, ["a", "b"]);
        addContent(TYPE, ["b"]);

        const stored = settingsStore.get(SETTINGS[TYPE].content);
        expect(stored).toEqual(["a", "b"]);
    });
});

describe("removeContent", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("removes items and sets forceRebuild", () => {
        seedContent(settingsStore, ["a", "b", "c"]);
        removeContent(TYPE, ["b"]);

        const stored = settingsStore.get(SETTINGS[TYPE].content);
        expect(stored).toEqual(["a", "c"]);
        expect(CONFIG.dndContentManager.forceRebuild).toBe(true);
    });

    it("handles removing non-existent items", () => {
        seedContent(settingsStore, ["a"]);
        removeContent(TYPE, ["z"]);

        const stored = settingsStore.get(SETTINGS[TYPE].content);
        expect(stored).toEqual(["a"]);
    });
});

describe("removeContentBySource", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("removes content matching the source and sets forceRebuild", () => {
        seedContent(settingsStore, [
            "Compendium.mod.pack-a.item1",
            "Compendium.mod.pack-b.item2",
        ]);
        removeContentBySource(TYPE, ["pack-a"]);

        const stored = settingsStore.get(SETTINGS[TYPE].content);
        expect(stored).toEqual(["Compendium.mod.pack-b.item2"]);
        expect(CONFIG.dndContentManager.forceRebuild).toBe(true);
    });

    it("does not remove content from unrelated sources with similar names", () => {
        seedContent(settingsStore, [
            "Compendium.mod.classes.item1",
            "Compendium.mod.subclasses.item2",
        ]);
        removeContentBySource(TYPE, ["classes"]);

        const stored = settingsStore.get(SETTINGS[TYPE].content);
        expect(stored).toEqual(["Compendium.mod.subclasses.item2"]);
    });

    it("does not set forceRebuild when nothing is removed", () => {
        seedContent(settingsStore, ["Compendium.mod.pack-a.item1"]);
        removeContentBySource(TYPE, ["pack-z"]);

        expect(CONFIG.dndContentManager.forceRebuild).toBe(false);
    });
});
