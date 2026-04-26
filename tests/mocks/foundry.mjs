/**
 * Shared mock for FoundryVTT globals used across tests.
 *
 * Call `setupFoundryMocks()` in beforeEach to get a clean state.
 * The returned `settingsStore` Map gives direct access to the backing store
 * so tests can seed/inspect settings without going through game.settings.
 */
export function setupFoundryMocks() {
    const settingsStore = new Map();

    globalThis.game = {
        settings: {
            get(_module, path) {
                return settingsStore.get(path);
            },
            set(_module, path, value) {
                settingsStore.set(path, value);
            },
        },
        user: { role: 4 },
    };

    globalThis.CONFIG = {
        dndContentManager: {
            forceRebuild: false,
        },
    };

    globalThis.foundry = {
        utils: {
            /**
             * Minimal parseUuid mock.
             * Expects UUIDs like "Compendium.module-name.pack-id.item-id"
             */
            parseUuid(uuid) {
                const parts = uuid.split(".");
                if (parts[0] === "Compendium" && parts.length >= 4) {
                    return {
                        uuid,
                        collection: {
                            metadata: { id: parts[2] },
                        },
                    };
                }
                // World item — no collection metadata
                return { uuid, collection: {} };
            },
        },
    };

    globalThis.ui = {
        notifications: {
            warn() {},
            info() {},
            error() {},
        },
    };

    return { settingsStore };
}
