import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setupFoundryMocks } from "../mocks/foundry.mjs";
import { getCompendiumBrowserSources, isBrowserDisabled } from "../../scripts/browser-sources.mjs";

const pack = (id, type = "Item") => ({ metadata: { id, type } });

describe("isBrowserDisabled", () => {
    const sources = new Set(["dnd5e.classes24", "dnd5e.actors24"]);

    it("is false when browser sources are unavailable", () => {
        expect(isBrowserDisabled(pack("dnd5e.classes"), null)).toBe(false);
    });

    it("is false for pack types the browser doesn't search", () => {
        expect(isBrowserDisabled(pack("dnd5e.rules", "JournalEntry"), sources)).toBe(false);
    });

    it("is true for Item and Actor packs the browser doesn't search", () => {
        expect(isBrowserDisabled(pack("dnd5e.classes"), sources)).toBe(true);
        expect(isBrowserDisabled(pack("dnd5e.monsters", "Actor"), sources)).toBe(true);
    });

    it("is false for packs the browser searches", () => {
        expect(isBrowserDisabled(pack("dnd5e.classes24"), sources)).toBe(false);
        expect(isBrowserDisabled(pack("dnd5e.actors24", "Actor"), sources)).toBe(false);
    });
});

describe("getCompendiumBrowserSources", () => {
    beforeEach(() => {
        setupFoundryMocks();
    });

    afterEach(() => {
        delete globalThis.dnd5e;
        vi.restoreAllMocks();
    });

    it("returns the sources collated by dnd5e", () => {
        const sources = new Set(["dnd5e.classes24"]);
        // dnd5e 6.1 collateSources relies on `this`, so it must be called on the class
        globalThis.dnd5e = { applications: { settings: { CompendiumBrowserSettingsConfig: {
            sources,
            collateSources() { return this.sources; }
        } } } };

        expect(getCompendiumBrowserSources()).toBe(sources);
    });

    it("returns null when dnd5e doesn't expose browser sources", () => {
        globalThis.dnd5e = { applications: {} };
        expect(getCompendiumBrowserSources()).toBeNull();

        delete globalThis.dnd5e;
        expect(getCompendiumBrowserSources()).toBeNull();
    });

    it("returns null and warns if collating sources fails", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        globalThis.dnd5e = { applications: { settings: { CompendiumBrowserSettingsConfig: {
            collateSources: () => { throw new Error("boom"); }
        } } } };

        expect(getCompendiumBrowserSources()).toBeNull();
        expect(warnSpy).toHaveBeenCalled();
    });
});
