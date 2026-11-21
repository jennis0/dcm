import { describe, it, expect, beforeEach, vi } from "vitest";

// export.mjs defines DialogV2 subclasses at load time, so the base class must
// exist before the module is imported
vi.hoisted(() => {
    globalThis.foundry = { applications: { api: { DialogV2: class {} } } };
});

import { setupFoundryMocks } from "../mocks/foundry.mjs";
import { exportSettings, importSettings } from "../../scripts/export.mjs";
import { MODULE_NAME, SETTINGS } from "../../scripts/settings.mjs";

const OPTIONAL_KEYS = [SETTINGS.filterQuickInsert, SETTINGS.filterSpotlight];

const ALWAYS_REGISTERED = [
    SETTINGS.lastLoadedVersion,
    SETTINGS.injectCompendiumButtons,
    SETTINGS.injectItemButton,
    SETTINGS.playerHandbookOptions,
    ...SETTINGS.itemtypes.flatMap(i => [SETTINGS[i].sources, SETTINGS[i].content, SETTINGS[i].enabled]),
];

/**
 * Replaces the default settings mock with one that, like Foundry, throws on
 * get and rejects on set for settings that aren't registered.
 */
function useRegisteredSettings(settingsStore, keys) {
    game.settings.settings = new Map(keys.map(k => [`${MODULE_NAME}.${k}`, {}]));
    game.settings.get = (_module, key) => {
        if (!game.settings.settings.has(`${MODULE_NAME}.${key}`)) {
            throw new Error(`"${MODULE_NAME}.${key}" is not a registered game setting`);
        }
        // Foundry returns the registered default for unset settings; null
        // stands in for it so the key survives JSON serialisation
        return settingsStore.has(key) ? settingsStore.get(key) : null;
    };
    game.settings.set = vi.fn(async (_module, key, value) => {
        if (!game.settings.settings.has(`${MODULE_NAME}.${key}`)) {
            throw new Error(`"${MODULE_NAME}.${key}" is not a registered game setting`);
        }
        settingsStore.set(key, value);
    });
}

describe("exportSettings", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("does not throw when optional module settings aren't registered", () => {
        useRegisteredSettings(settingsStore, ALWAYS_REGISTERED);

        const exported = JSON.parse(exportSettings());

        for (const key of OPTIONAL_KEYS) {
            expect(exported).not.toHaveProperty(key);
        }
        expect(exported).toHaveProperty(SETTINGS.injectItemButton);
    });

    it("includes optional module settings when registered", () => {
        useRegisteredSettings(settingsStore, [...ALWAYS_REGISTERED, ...OPTIONAL_KEYS]);
        settingsStore.set(SETTINGS.filterQuickInsert, true);

        const exported = JSON.parse(exportSettings());

        expect(exported[SETTINGS.filterQuickInsert]).toBe(true);
        expect(exported).toHaveProperty(SETTINGS.filterSpotlight);
    });
});

describe("importSettings", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
        CONFIG.dndContentManager.forceRebuild = false;
    });

    it("round-trips an export on a world without optional modules", () => {
        useRegisteredSettings(settingsStore, ALWAYS_REGISTERED);
        settingsStore.set(SETTINGS.class.sources, ["dnd5e.classes"]);
        settingsStore.set(SETTINGS.class.content, ["Compendium.dnd5e.classes.Item.abc"]);
        settingsStore.set(SETTINGS.class.enabled, true);
        settingsStore.set(SETTINGS.injectItemButton, false);
        const file = exportSettings();

        settingsStore.clear();
        importSettings(file);

        expect(settingsStore.get(SETTINGS.class.sources)).toEqual(["dnd5e.classes"]);
        expect(settingsStore.get(SETTINGS.class.content)).toEqual(["Compendium.dnd5e.classes.Item.abc"]);
        expect(settingsStore.get(SETTINGS.class.enabled)).toBe(true);
        expect(settingsStore.get(SETTINGS.injectItemButton)).toBe(false);
        expect(CONFIG.dndContentManager.forceRebuild).toBe(true);
    });

    it("skips settings for modules that aren't installed", () => {
        // v1.6.0 export from a world with every optional module installed
        useRegisteredSettings(settingsStore, [...ALWAYS_REGISTERED, ...OPTIONAL_KEYS]);
        const file = exportSettings();

        useRegisteredSettings(settingsStore, ALWAYS_REGISTERED);
        importSettings(file);

        const writtenKeys = game.settings.set.mock.calls.map(c => c[1]);
        for (const key of OPTIONAL_KEYS) {
            expect(writtenKeys).not.toContain(key);
        }
        expect(writtenKeys).toContain(SETTINGS.injectItemButton);
        expect(writtenKeys).toContain(SETTINGS.class.sources);
    });

    it("leaves settings missing from the file untouched", () => {
        // v1.3.0-v1.4.1 format: item types only, plus a 'version' field
        useRegisteredSettings(settingsStore, [...ALWAYS_REGISTERED, ...OPTIONAL_KEYS]);
        settingsStore.set(SETTINGS.injectItemButton, false);
        settingsStore.set(SETTINGS.filterQuickInsert, true);
        const legacy = {
            itemtypes: ["class", "subclass", "race", "background", "feat", "items", "spell", "spelllist"],
            version: "v1.3.0",
        };
        for (const item of legacy.itemtypes) {
            legacy[item] = { sources: ["dnd5e.classes"], content: [], enabled: true };
        }

        importSettings(JSON.stringify(legacy));

        expect(settingsStore.get(SETTINGS.class.sources)).toEqual(["dnd5e.classes"]);
        expect(settingsStore.get(SETTINGS.injectItemButton)).toBe(false);
        expect(settingsStore.get(SETTINGS.filterQuickInsert)).toBe(true);
        const writtenKeys = game.settings.set.mock.calls.map(c => c[1]);
        expect(writtenKeys).not.toContain(SETTINGS.playerHandbookOptions);
    });
});
