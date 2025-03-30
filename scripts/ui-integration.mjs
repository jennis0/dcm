import { SourceSelector } from "./apps/source-selector.mjs";
import { ContentSelector } from "./apps/content-selector.mjs";
import { PlayerHandbookMenu } from "./apps/player-handbook.mjs";
import { addContent, removeContent } from "./content-management.mjs";
import { log } from "./lib.mjs";
import { getSetting, SETTINGS } from "./settings.mjs";

//Code for buttons which are injected into headers of Core DND5e apps

/** 
* Injects a button into the item sheet to toggle whether the item is included in the index.
* @param {ItemSheet5e} app - The item sheet application.
* @param {Array} buttons - The array of buttons to be displayed on the item sheet.
* @returns {ItemSheet5e, Array} The updated app and array of buttons.
*/
async function injectItemButton(app, buttons) {

    //Ensure index is up to date
    await CONFIG.dndContentManager.index.rebuild();

    const item = app.object

    //If item type not managed, don't add button
    const itemIndexType = CONFIG.dndContentManager.index.getItemIndexType(item)
    if (itemIndexType === null) {
        return
    }

    //Check whether filtering is currently enabled for this item
    const disabled = !CONFIG.dndContentManager.index.itemSourceInIndex(item)
    const itemSelected = CONFIG.dndContentManager.index.itemInIndex(
        "Item", item.type, item.uuid
    )

    let tooltip = `${itemSelected ? 'Disable' : 'Enable'} Item in DCM`;
    let icon = itemSelected ? "fa-eye" : "fa-eye-slash";
    if (disabled) {
        tooltip = "Item Source Disabled in DCM: Open Source Config"
        icon = "fa-ban"
    }

    const handleItemToggle = (event) => {
        if (!disabled) {
            if (event.target.classList.contains("fa-eye-slash")) {
                event.target.classList.remove("fa-eye-slash");
                event.target.classList.add("fa-eye");
                event.target.setAttribute("data-tooltip", "Disable Item in DCM");
                addContent(itemIndexType, [item.uuid])
            } else {
                event.target.classList.remove("fa-eye");
                event.target.classList.add("fa-eye-slash");
                event.target.setAttribute("data-tooltip", "Enable Item in DCM");
                removeContent(itemIndexType, [item.uuid])
            }
        } else {
            const source = new SourceSelector(itemIndexType);
            source.render(true)
        }
    }

    //Insert to left of close button
    buttons.unshift(
        {
            'class':'dcm-toggle',
            'icon': `fas ${icon} ${disabled ? 'disabled' : ''}`,
            'label': tooltip,
            "onclick":  handleItemToggle
        }
    )
    return (app, buttons)
}

/**
 * Injects buttons into the Compendiun sidebar of the Foundry VTT interface to open the configuration menu
 * and Player Handbook generator.
 * @param {HTMLElement} html - The HTML element representing the sidebar where the buttons will be injected.
 */
function injectCompendiumButtons(html) {
    log("Injecting sidebar buttons")

    const div = document.createElement("div")
    div.classList.add("dcm-button-row")
    div.appendChild(ContentSelector.createSidebarButton())
    div.appendChild(PlayerHandbookMenu.createSidebarButton())

    const headerActions = html.querySelector(".header-actions");
    headerActions.prepend(div);

    log(headerActions)
}

/**
 * Registers the Interface buttons - needs to be done pre-render step in init
 */
export function registerInterfaceButtons() {
    if (getSetting(SETTINGS.injectCompendiumButtons)) {
        Hooks.on("renderCompendiumDirectory", (app, html, data) => {
            if (game.user.role == 4) {
                log("Adding compendium sidebar buttons")
                injectCompendiumButtons(html)
            }
        })
    }
    log("Registered interface buttons");
}

/**
 * Registers the System buttons - needs to be done post system initialisation
 *  in ready step
 */
export function registerSystemButtons() {

    //If DM, don't do anything
    if (game.user.role != 4) {
        return
    }

    if (getSetting(SETTINGS.injectItemButton)) {
        Hooks.on("getItemSheet5e2HeaderButtons", (app, buttons) => {
            injectItemButton(app, buttons)
        })
    }

    log("Registered system buttons");
}