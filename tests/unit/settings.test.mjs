import { describe, it, expect, beforeEach } from "vitest";
import { setupFoundryMocks } from "../mocks/foundry.mjs";
import { getSetting, setSetting } from "../../scripts/settings.mjs";

describe("getSetting", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("reads a setting from the store", () => {
        settingsStore.set("myKey", [1, 2, 3]);
        expect(getSetting("myKey")).toEqual([1, 2, 3]);
    });

    it("returns undefined for missing settings", () => {
        expect(getSetting("missing")).toBeUndefined();
    });
});

describe("setSetting", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("writes a setting to the store", () => {
        setSetting("myKey", "hello");
        expect(settingsStore.get("myKey")).toBe("hello");
    });

    it("does nothing when user role is below min_role", () => {
        game.user.role = 1;
        setSetting("myKey", "should not write");
        expect(settingsStore.get("myKey")).toBeUndefined();
    });

    it("writes when user role equals min_role", () => {
        game.user.role = 4;
        setSetting("myKey", "written", 4);
        expect(settingsStore.get("myKey")).toBe("written");
    });

    it("respects custom min_role", () => {
        game.user.role = 2;
        setSetting("myKey", "nope", 3);
        expect(settingsStore.get("myKey")).toBeUndefined();

        setSetting("myKey", "yep", 2);
        expect(settingsStore.get("myKey")).toBe("yep");
    });
});
