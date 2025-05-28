# Web Desktop App Development Guide

This guide explains how to create and integrate new applications into the web desktop environment.

## 1. Project Structure Overview

The web desktop is organized as follows:

-   `index.html`: The main HTML file that hosts the desktop. It includes the taskbar (`id="taskbar"`) and the Start Menu panel (`id="start-menu-panel"`).
-   `style.css`: Global styles for the desktop, icons, windows, taskbar, Start Button, and Start Menu.
-   `WebDesktopLib.js`: A supporting library providing core functionalities like DOM manipulation (`WebDesktopLib.DOM`), taskbar management (`WebDesktopLib.Taskbar`), storage utilities (`WebDesktopLib.Storage`), and an event bus (`WebDesktopLib.EventBus`).
-   `script.js`: Core JavaScript logic for loading the library, apps, managing the desktop environment, taskbar interactions (via `WebDesktopLib.Taskbar`), Start Menu population and functionality, and window management.
-   `AppBase.js`: A base class (`AppBase`) that provides common window functionalities. Individual apps extend this class and use `WebDesktopLib` for core interactions.
-   `config.json`: Configuration file listing all available applications, their resources (HTML, CSS, JS file paths), window behavior settings (`defaultWidth`, `defaultHeight`, `resizable`, `maximizable`, `minimizable`), and how they appear in the Start Menu. The `initFunction` property here should be the class name of the app.
-   `apps/`: Directory containing all individual applications.
    -   `apps/YourAppName/`: Each application resides in its own subdirectory.
        -   `icon.html`: HTML snippet for the application's desktop icon. The ID of the main icon element should be specified in `config.json` via the `iconId` property if it doesn't follow the `appName.toLowerCase() + '-app-icon'` convention.
        -   `appbody.html`: HTML snippet for the application's main window structure. It's recommended to structure the header with a `.window-header-title` span and a `.window-header-buttons` div for consistency.
        -   `yourAppName.js`: JavaScript file defining the app's class (e.g., `class YourAppName extends AppBase { ... }`). This class name should match the `initFunction` in `config.json`.
        -   `style.css`: (Optional) CSS styles specific to this application.

## 2. Creating a New Application

(Steps 2.1, 2.2, 2.3 remain the same: Create directory, icon.html, appbody.html)

### Step 2.4: Create Application JavaScript (`myApp.js`)
Define a class extending `AppBase`.
Example (`apps/MyApp/myApp.js`):
```javascript
class MyApp extends AppBase {
    constructor(appConfig, appWindowElement) {
        super(appConfig, appWindowElement); // Calls AppBase constructor
    }
    onInit() { // Called by AppBase constructor
        if (!this.isValid) return;
        console.log(`${this.appConfig.name} initialized.`);
        // App-specific init logic, e.g., using WebDesktopLib.DOM:
        // this.myButton = WebDesktopLib.DOM.qs('.my-button', this.appWindowElement);
    }
    // Override other AppBase methods (onOpen, onClose, etc.) as needed
}
// window.MyApp = MyApp; // Usually not needed
```
`AppBase` now uses `WebDesktopLib.DOM` for querying elements and `WebDesktopLib.Taskbar` for taskbar interactions.

## 3. Update `config.json`
(This section remains the same: `initFunction` is class name, add `iconId` if needed, etc.)
```json
{
  "name": "MyApp",
  "iconId": "my-app-icon", 
  "script": "apps/MyApp/myApp.js",
  "initFunction": "MyApp", 
  "iconHtml": "apps/MyApp/icon.html",
  // ... other properties
}
```

## 4. Styling Your Application
(This section remains the same.)

## 5. App Launching
(This section remains the same.)

## 6. Running and Testing
(This section remains the same: Serve via HTTP server.)

## 7. Storing App-Specific Settings (Example: IndexedDB)
Applications can store their own settings using browser storage mechanisms. `WebDesktopLib.Storage` provides simplified wrappers for `localStorage` and IndexedDB.

-   **`WebDesktopLib.Storage.local.set(key, value)` / `.get(key, defaultValue)`**: For simple key-value string/JSON storage.
-   **`WebDesktopLib.Storage.indexedDB.set(dbName, version, storeName, key, value, onUpgradeNeededCallback)` / `.get(...)`**: For more complex storage, including objects like `FileSystemDirectoryHandle`.

The `onUpgradeNeededCallback` is crucial for IndexedDB to set up object stores. Example:
```javascript
// In your app class
_onUpgradeNeeded(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(this.MY_APP_STORE_NAME)) {
        db.createObjectStore(this.MY_APP_STORE_NAME);
    }
}

async saveMySetting(key, value) {
    await WebDesktopLib.Storage.indexedDB.set(
        'WebDesktopAppSettings', // Common DB Name
        1, // DB Version
        this.MY_APP_STORE_NAME, // Your app's specific store
        key,
        value,
        this._onUpgradeNeeded.bind(this) // Pass the upgrade callback
    );
}
```
Refer to `apps/MediaViewer/mediaViewer.js` for a complete implementation example of using `WebDesktopLib.Storage.indexedDB` to store a `DirectoryHandle`. Remember that permissions for directory handles need to be re-verified across sessions.

## 8. Inter-Component Communication (Event Bus)
`WebDesktopLib.EventBus` provides a simple publish/subscribe mechanism for decoupled communication between different parts of the application (e.g., between apps, or app and desktop).

-   **`WebDesktopLib.EventBus.subscribe(eventName, callback)`**: Registers a callback for an event.
-   **`WebDesktopLib.EventBus.unsubscribe(eventName, callback)`**: Removes a specific callback.
-   **`WebDesktopLib.EventBus.publish(eventName, data)`**: Dispatches an event with optional data to all subscribers.

Example usage:
```javascript
// Component A (e.g., an app)
WebDesktopLib.EventBus.publish('userLoggedIn', { userId: 123, username: 'Alice' });

// Component B (e.g., another app or a UI element in script.js)
function handleLogin(userData) {
    console.log(`User ${userData.username} logged in.`);
    // Update UI or state
}
WebDesktopLib.EventBus.subscribe('userLoggedIn', handleLogin);

// To unsubscribe later:
// WebDesktopLib.EventBus.unsubscribe('userLoggedIn', handleLogin);
```
This helps in reducing direct dependencies between components.
