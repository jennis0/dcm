import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupFoundryMocks } from "../mocks/foundry.mjs";
import { mutateSettingSet, inPlaceFilter, getOrdinalSuffix } from "../../scripts/lib.mjs";

describe("mutateSettingSet", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("applies the mutation and saves the result", () => {
        settingsStore.set("myKey", ["a", "b"]);
        mutateSettingSet("myKey", (set) => set.add("c"));

        expect(settingsStore.get("myKey")).toEqual(["a", "b", "c"]);
    });

    it("returns the mutated set", () => {
        settingsStore.set("myKey", ["a"]);
        const result = mutateSettingSet("myKey", (set) => set.add("b"));

        expect(result).toBeInstanceOf(Set);
        expect([...result]).toEqual(["a", "b"]);
    });

    it("flags forceRebuild when an item is added", () => {
        settingsStore.set("myKey", ["a"]);
        mutateSettingSet("myKey", (set) => set.add("b"));

        expect(CONFIG.dndContentManager.forceRebuild).toBe(true);
    });

    it("flags forceRebuild when an item is deleted", () => {
        settingsStore.set("myKey", ["a", "b"]);
        mutateSettingSet("myKey", (set) => set.delete("b"));

        expect(CONFIG.dndContentManager.forceRebuild).toBe(true);
    });

    it("does not flag forceRebuild when nothing changes", () => {
        settingsStore.set("myKey", ["a", "b"]);
        mutateSettingSet("myKey", () => {});

        expect(CONFIG.dndContentManager.forceRebuild).toBe(false);
    });

    it("does not flag forceRebuild when adding a duplicate", () => {
        settingsStore.set("myKey", ["a"]);
        mutateSettingSet("myKey", (set) => set.add("a"));

        expect(CONFIG.dndContentManager.forceRebuild).toBe(false);
    });

    it("does not flag forceRebuild when deleting a non-existent item", () => {
        settingsStore.set("myKey", ["a"]);
        mutateSettingSet("myKey", (set) => set.delete("z"));

        expect(CONFIG.dndContentManager.forceRebuild).toBe(false);
    });

    it("skips change detection if forceRebuild is already true", () => {
        settingsStore.set("myKey", ["a"]);
        CONFIG.dndContentManager.forceRebuild = true;

        mutateSettingSet("myKey", () => {});

        expect(CONFIG.dndContentManager.forceRebuild).toBe(true);
    });

    it("handles an empty initial setting", () => {
        settingsStore.set("myKey", []);
        mutateSettingSet("myKey", (set) => set.add("a"));

        expect(settingsStore.get("myKey")).toEqual(["a"]);
        expect(CONFIG.dndContentManager.forceRebuild).toBe(true);
    });

    it("handles undefined initial setting", () => {
        // getSetting returns undefined for unset keys
        mutateSettingSet("unset", (set) => set.add("a"));

        expect(settingsStore.get("unset")).toEqual(["a"]);
        expect(CONFIG.dndContentManager.forceRebuild).toBe(true);
    });

    it("detects replacement even when size stays the same", () => {
        settingsStore.set("myKey", ["a", "b"]);
        mutateSettingSet("myKey", (set) => {
            set.delete("a");
            set.add("c");
        });

        expect(settingsStore.get("myKey")).toEqual(["b", "c"]);
        expect(CONFIG.dndContentManager.forceRebuild).toBe(true);
    });
});

describe("inPlaceFilter", () => {
    beforeEach(() => {
        setupFoundryMocks();
    });

    it("keeps items that pass the filter", () => {
        const arr = [1, 2, 3, 4, 5];
        inPlaceFilter(arr, (n) => n > 3);

        expect(arr).toEqual([4, 5]);
    });

    it("removes all items when none pass", () => {
        const arr = [1, 2, 3];
        inPlaceFilter(arr, () => false);

        expect(arr).toEqual([]);
    });

    it("keeps all items when all pass", () => {
        const arr = [1, 2, 3];
        inPlaceFilter(arr, () => true);

        expect(arr).toEqual([1, 2, 3]);
    });

    it("returns the new length", () => {
        const arr = [1, 2, 3, 4];
        const len = inPlaceFilter(arr, (n) => n % 2 === 0);

        expect(len).toBe(2);
    });

    it("handles an empty array", () => {
        const arr = [];
        const len = inPlaceFilter(arr, () => true);

        expect(arr).toEqual([]);
        expect(len).toBe(0);
    });

    it("keeps item and logs warning when filter throws", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const arr = [
            { uuid: "good", value: 1 },
            { uuid: "bad", value: 2 },
            { uuid: "good2", value: 3 },
        ];
        inPlaceFilter(
            arr,
            (item) => {
                if (item.uuid === "bad") throw new Error("parse failed");
                return item.value > 1;
            },
            "test item",
        );

        // "bad" is kept (safe fallback), "good" is filtered out, "good2" passes
        expect(arr).toEqual([
            { uuid: "bad", value: 2 },
            { uuid: "good2", value: 3 },
        ]);
        expect(warnSpy).toHaveBeenCalledOnce();
        expect(warnSpy.mock.calls[0][0]).toContain("bad");
        expect(warnSpy.mock.calls[0][0]).toContain("parse failed");

        warnSpy.mockRestore();
    });

    it("keeps all items when every filter call throws", () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});

        const arr = ["a", "b", "c"];
        inPlaceFilter(arr, () => { throw new Error("boom"); });

        expect(arr).toEqual(["a", "b", "c"]);

        console.warn.mockRestore();
    });

    it("uses custom describer in error messages", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const arr = [{ name: "Widget" }];
        inPlaceFilter(
            arr,
            () => { throw new Error("oops"); },
            "widget",
            (item) => item.name,
        );

        expect(warnSpy.mock.calls[0][0]).toContain("Widget");
        expect(warnSpy.mock.calls[0][0]).toContain("widget");

        warnSpy.mockRestore();
    });
});

describe("getOrdinalSuffix", () => {
    it("handles 1st, 2nd, 3rd", () => {
        expect(getOrdinalSuffix(1)).toBe("1st");
        expect(getOrdinalSuffix(2)).toBe("2nd");
        expect(getOrdinalSuffix(3)).toBe("3rd");
    });

    it("handles 4th-9th", () => {
        for (let i = 4; i <= 9; i++) {
            expect(getOrdinalSuffix(i)).toBe(`${i}th`);
        }
    });

    it("handles teens (11th, 12th, 13th)", () => {
        expect(getOrdinalSuffix(11)).toBe("11th");
        expect(getOrdinalSuffix(12)).toBe("12th");
        expect(getOrdinalSuffix(13)).toBe("13th");
    });

    it("handles 21st, 22nd, 23rd", () => {
        expect(getOrdinalSuffix(21)).toBe("21st");
        expect(getOrdinalSuffix(22)).toBe("22nd");
        expect(getOrdinalSuffix(23)).toBe("23rd");
    });

    it("handles 111th, 112th, 113th", () => {
        expect(getOrdinalSuffix(111)).toBe("111th");
        expect(getOrdinalSuffix(112)).toBe("112th");
        expect(getOrdinalSuffix(113)).toBe("113th");
    });
});
