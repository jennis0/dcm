/**
 * Element is recreated from the core DND5E system so we can re-use the ApplicationV2 instance in 3.3.1
 * Sourced from https://github.com/foundryvtt/dnd5e/blob/10e96a0dd704aa461fc346b26fc9e4aeafc7e9e1/module/applications/components/
 * Code will be removed once 3.3.1 support is dropped
 */


import { CheckboxElement } from "./checkbox.mjs";

/**
 * A custom HTML element that represents a checkbox-like input that is displayed as a slide toggle.
 * @fires change
 */
export class SlideToggleElement extends CheckboxElement {
  /** @inheritDoc */
  constructor() {
    super();
    this._internals.role = "switch";
  }

  /* -------------------------------------------- */

  /** @override */
  static tagName = "dcm-slide-toggle";

  /* -------------------------------------------- */

  /** @override */
  static useShadowRoot = false;

  /* -------------------------------------------- */
  /*  Element Lifecycle                           */
  /* -------------------------------------------- */

  /**
   * Activate the element when it is attached to the DOM.
   * @inheritDoc
   */
  connectedCallback() {
    this.replaceChildren(...this._buildElements());
    this._refresh();
    this._activateListeners();
  }

  /* -------------------------------------------- */

  /**
   * Create the constituent components of this element.
   * @returns {HTMLElement[]}
   * @protected
   */
  _buildElements() {
    const track = document.createElement("div");
    track.classList.add("slide-toggle-track");
    const thumb = document.createElement("div");
    thumb.classList.add("slide-toggle-thumb");
    track.append(thumb);
    return [track];
  }
}

window.customElements.define("dcm-slide-toggle", SlideToggleElement)