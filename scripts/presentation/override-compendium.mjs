import { registerCompendiumOverrideSetting } from "../register-settings.mjs";
import { getSetting, MODULE_NAME, setSetting, SETTINGS } from "../settings.mjs";


/**
 * Creates a new override compendium named "DCM Overrides" of type "JournalEntry".
 * The compendium is added to the "world" package and associated with the "dnd5e" system.
 * Predefined journal entries ("Classes", "Subclasses", "Backgrounds", "Species") are created
 * within the new compendium.
 * Displays a notification upon successful creation.
 *
 * @async
 * @function createOverrideCompendium
 * @returns {Promise<void>} Resolves when the compendium and journal entries are created.
 */
export async function createOverrideCompendium() {
    const newCompendium = await CompendiumCollection.createCompendium(
        {
            name: "dcm-overrides",
            label: "DCM Overrides",
            type: "JournalEntry",
            ownership: {ASSISTANT: 'OWNER'},
            package: "world",
            system: "dnd5e",

        }
    )
    console.log(newCompendium)

    for (const journalName of ["Class", "Background", "Species"]) {
        await JournalEntry.create({name: journalName}, {pack:newCompendium.metadata.id})
    }

    ui.notifications.info("Created DCM Overrides Compendium")
}

/**
 * Retrieves the override compendium based on the configured setting.
 *
 * @returns {Compendium|null} The override compendium if configured, or `null` if none is set.
 * - If the setting is "default", it returns the "world.dcm-overrides" compendium.
 * - If the setting is not "none" and not "default", it returns the compendium specified by the setting.
 * - If the setting is "none", it returns `null`.
 */
export function getOverrideCompendium() {
    const overrideCompendium = getSetting(SETTINGS.overrideCompendium);
    if (overrideCompendium === "default") {
        return game.packs.get("world.dcm-overrides")
    } else if (overrideCompendium !== "none") {
        return game.packs.get(overrideCompendium)
    } else {
        return null
    }
}

/**
 * Handles changes to the override compendium setting.
 * Ensures the "world.dcm-overrides" compendium exists and updates the setting if needed.
 */
export function handleOverrideSettingChange() {
    const overrideCompendium = getSetting(SETTINGS.overrideCompendium);

    if (overrideCompendium !== "world.dcm-overrides" && 
        overrideCompendium === "default"
    ) {
        if (!game.packs.get("world.dcm-overrides")) {
            createOverrideCompendium()
        }
        setSetting(SETTINGS.overrideCompendium, "world.dcm-overrides")
    }
    registerCompendiumOverrideSetting()
}

/**
 * Generates a set of JournalEntry compendium options for selecting an override compendium.
 *
 * @returns {Object} An object where keys are compendium identifiers and values are their display labels.
 */
export function getOverrideCompendiumOptions() {
    const options = [["none", "<No Override Compendium>"]];

    if (game.packs.get("world.dcm-overrides")) {
        options.push(["world.dcm-overrides", "<Default | DCM Overrides>"])
    } else {
        options.push(["default", "<Create Default Compendium>"])
    }

    return Object.fromEntries(
            options.concat(
            game.packs.filter(p => p.metadata.type == "JournalEntry")
                .map(p => [p.metadata.name, `${p.metadata.label} (${p.metadata.id})`])
        )
    )
}

/**
 * Registers hooks to override compendium settings in the Foundry VTT settings configuration.
 * 
 * - Listens for the "closeSettingsConfig" hook to handle changes to override settings.
 * - Listens for the "renderSettingsConfig" hook to dynamically update override compendium options.
 */
export function addCompendiumOverrideHooks() {
    Hooks.on("closeSettingsConfig", (app, data) => {
        handleOverrideSettingChange()
    })
}