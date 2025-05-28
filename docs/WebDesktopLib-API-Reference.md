# WebDesktopLib.js - Technical Specification & API Reference

`WebDesktopLib.js` is a supporting JavaScript library for the Web Desktop environment. It provides centralized core functionalities and utilities for managing the desktop, applications, and their interactions.

## Overall Structure

`WebDesktopLib` is an IIFE (Immediately Invoked Function Expression) that returns an object exposing its public modules.

```javascript
const WebDesktopLib = (() => {
    // Private variables and functions for the library

    // --- DOM Utilities Module ---
    const DOM = { /* ... */ };

    // --- Taskbar Manager Module ---
    const Taskbar = { /* ... */ };

    // --- Storage Manager Module ---
    const Storage = { /* ... */ };

    // --- Event Bus Module ---
    const EventBus = { /* ... */ };

    // Public API
    return {
        DOM,
        Taskbar,
        Storage,
        EventBus
    };
})();
```

## Modules

### 1. `WebDesktopLib.DOM`

Provides utility functions for common DOM manipulations.

-   **`DOM.qs(selector, parent = document)`**
    -   Description: A shortcut for `parent.querySelector(selector)`.
    -   Parameters:
        -   `selector` (string): The CSS selector to match.
        -   `parent` (Element, optional): The parent element to search within. Defaults to `document`.
    -   Returns: (Element | null) The first matching element or `null`.

-   **`DOM.qsa(selector, parent = document)`**
    -   Description: A shortcut for `parent.querySelectorAll(selector)`.
    -   Parameters:
        -   `selector` (string): The CSS selector to match.
        -   `parent` (Element, optional): The parent element to search within. Defaults to `document`.
    -   Returns: (NodeList) A static NodeList containing all matching elements.

-   **`DOM.createElement(tagName, attributes = {}, children = [])`**
    -   Description: Creates a new DOM element with specified attributes and children.
    -   Parameters:
        -   `tagName` (string): The HTML tag name for the element.
        -   `attributes` (object, optional): An object of attributes to set. Special keys:
            -   `className`: Sets `element.className`.
            -   `textContent` or `innerHTML`: Sets the respective property.
            -   Other keys are set using `element.setAttribute(key, value)`.
        -   `children` (Array, optional): An array of child nodes (string or Element) to append.
    -   Returns: (Element) The newly created DOM element.

-   **`DOM.empty(element)`**
    -   Description: Removes all child nodes from the given element.
    -   Parameters:
        -   `element` (Element): The DOM element to empty.

### 2. `WebDesktopLib.Taskbar`

Manages the desktop taskbar, including app buttons and window z-index.

-   **`Taskbar.init(taskbarDomElement, appInstancesRef)`**
    -   Description: Initializes the Taskbar manager. Must be called once by `script.js`.
    -   Parameters:
        -   `taskbarDomElement` (Element): The DOM element representing the taskbar.
        -   `appInstancesRef` (Map): A reference to the `appInstances` Map (from `script.js`) which stores `appName -> appInstance`. Used by taskbar buttons to interact with app instances.

-   **`Taskbar.add(appConfig, appWindowElement)`**
    -   Description: Adds a button for an app to the taskbar. If a button already exists for the app, it ensures the window is visible and brings it to the front. Assigns an initial z-index to the `appWindowElement`.
    -   Parameters:
        -   `appConfig` (object): The application's configuration object.
        -   `appWindowElement` (Element): The DOM element for the app's main window.
    -   Returns: (Element) The created or existing taskbar button element.

-   **`Taskbar.remove(appWindowId)`**
    -   Description: Removes an app's button from the taskbar and its tracking.
    -   Parameters:
        -   `appWindowId` (string): The ID of the app window whose button should be removed.

-   **`Taskbar.setActive(appWindowId)`**
    -   Description: Sets the taskbar button corresponding to `appWindowId` as active (visually highlights it) and deactivates others.
    -   Parameters:
        -   `appWindowId` (string): The ID of the app window.

-   **`Taskbar.setInactive(appWindowId)`**
    -   Description: Sets the taskbar button corresponding to `appWindowId` as inactive.
    -   Parameters:
        -   `appWindowId` (string): The ID of the app window.

-   **`Taskbar.bringToFront(appWindowId)`**
    -   Description: Brings the specified app window to the front by assigning it the highest current `z-index` and increments the global `z-index` counter. Also sets its taskbar button to active.
    -   Parameters:
        -   `appWindowId` (string): The ID of the app window.

-   **`Taskbar.getHighestZIndex()`**
    -   Description: Returns the current highest z-index value used by the Taskbar manager.
    -   Returns: (number)

### 3. `WebDesktopLib.Storage`

Provides simplified wrappers for browser storage mechanisms.

-   **`Storage.local` (object):** For `localStorage` operations.
    -   `set(key, value)`: Stores `value` (JSON stringified) under `key`.
    -   `get(key, defaultValue = null)`: Retrieves and parses value for `key`. Returns `defaultValue` if not found or on error.
    -   `remove(key)`: Removes item by `key`.
    -   `clear()`: Clears all `localStorage`.

-   **`Storage.indexedDB` (object):** For IndexedDB operations.
    -   `_openDB(dbName, version, onUpgradeNeeded)`: (Private helper, but pattern is useful) Opens/creates an IndexedDB.
    -   `get(dbName, version, storeName, key, onUpgradeNeededCallback)`: Asynchronously gets a value by `key` from `storeName`.
    -   `set(dbName, version, storeName, key, value, onUpgradeNeededCallback)`: Asynchronously sets a `value` for `key` in `storeName`.
    -   `delete(dbName, version, storeName, key, onUpgradeNeededCallback)`: Asynchronously deletes an entry by `key`.
    -   `clear(dbName, version, storeName, onUpgradeNeededCallback)`: Asynchronously clears all entries in `storeName`.
    -   The `onUpgradeNeededCallback` function (e.g., `function(event) { event.target.result.createObjectStore(...); }`) is essential for creating object stores when the DB is first created or version is upgraded.

### 4. `WebDesktopLib.EventBus`

A simple publish/subscribe system for decoupled inter-component communication.

-   **`EventBus.subscribe(eventName, callback)`**
    -   Description: Subscribes a `callback` function to an `eventName`.
    -   Parameters:
        -   `eventName` (string): The name of the event to subscribe to.
        -   `callback` (function): The function to call when the event is published. It will receive any data passed during `publish`.

-   **`EventBus.unsubscribe(eventName, callback)`**
    -   Description: Unsubscribes a specific `callback` from an `eventName`.
    -   Parameters:
        -   `eventName` (string): The event name.
        -   `callback` (function): The exact callback function reference that was used to subscribe.

-   **`EventBus.publish(eventName, data)`**
    -   Description: Publishes an event, calling all subscribed callbacks with the provided `data`.
    -   Parameters:
        -   `eventName` (string): The name of the event to publish.
        -   `data` (any, optional): Data to pass to the subscribed callbacks.

## Future Considerations / Potential Modules

-   **UI Components:** Standardized modals, dialogs, notifications.
-   **Internationalization (i18n):** Utilities for multi-language support.
-   **Drag and Drop Utilities:** Generic drag-and-drop helpers.
-   **Configuration Manager:** More advanced config loading/management.

This document should be updated as `WebDesktopLib.js` evolves.
