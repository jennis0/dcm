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

    it("does nothing without SETTINGS_MODIFY, regardless of role", () => {
        game.user.role = 4;
        game.user.permissions.SETTINGS_MODIFY = false;
        setSetting("myKey", "should not write");
        expect(settingsStore.get("myKey")).toBeUndefined();
    });

    it("writes for a non-GM user granted SETTINGS_MODIFY (#32)", () => {
        game.user.role = 1;
        game.user.permissions.SETTINGS_MODIFY = true;
        setSetting("myKey", "written");
        expect(settingsStore.get("myKey")).toBe("written");
    });
});
