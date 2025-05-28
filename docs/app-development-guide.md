# Web Desktop App Development Guide

This guide explains how to create and integrate new applications into the web desktop environment.

## 1. Project Structure Overview

The web desktop is organized as follows:

-   `index.html`: The main HTML file that hosts the desktop. It includes the taskbar (`id="taskbar"`) and the Start Menu panel (`id="start-menu-panel"`).
-   `style.css`: Global styles for the desktop, icons, windows, taskbar, Start Button, and Start Menu.
-   `script.js`: Core JavaScript logic for loading apps, managing the desktop environment, taskbar interactions, Start Menu population and functionality, and window management (drag, resize, maximize, minimize, z-index).
-   `AppBase.js`: A base class (`AppBase`) that provides common window functionalities. Individual apps extend this class.
-   `config.json`: Configuration file listing all available applications, their resources (HTML, CSS, JS file paths), window behavior settings (`defaultWidth`, `defaultHeight`, `resizable`, `maximizable`, `minimizable`), and how they appear in the Start Menu. The `initFunction` property here should be the class name of the app.
-   `apps/`: Directory containing all individual applications.
    -   `apps/YourAppName/`: Each application resides in its own subdirectory.
        -   `icon.html`: HTML snippet for the application's desktop icon. The ID of the main icon element should be specified in `config.json` via the `iconId` property if it doesn't follow the `appName.toLowerCase() + '-app-icon'` convention.
        -   `appbody.html`: HTML snippet for the application's main window structure. It's recommended to structure the header with a `.window-header-title` span and a `.window-header-buttons` div for consistency.
        -   `yourAppName.js`: JavaScript file defining the app's class (e.g., `class YourAppName extends AppBase { ... }`). This class name should match the `initFunction` in `config.json`.
        -   `style.css`: (Optional) CSS styles specific to this application.

## 2. Creating a New Application

Follow these steps to create a new application (e.g., "MyApp"):

### Step 2.1: Create Application Directory
Create `apps/MyApp/`.

### Step 2.2: Create Icon HTML (`icon.html`)
Example (`apps/MyApp/icon.html`):
```html
<div class="icon" id="my-app-icon">
    <span>My App</span>
</div>
```
*(Ensure `my-app-icon` is unique or use the `iconId` property in `config.json`.)*

### Step 2.3: Create App Body HTML (`appbody.html`)
Example (`apps/MyApp/appbody.html`):
```html
<div class="window" id="my-app-window"> <!-- Unique ID for the window -->
    <div class="window-header">
        <span class="window-header-title">My App Title</span>
        <div class="window-header-buttons">
            <!-- Minimize button added by script.js if minimizable -->
            <button class="close-button window-header-button">X</button>
        </div>
    </div>
    <div class="window-content">
        <p>Hello from My App!</p>
    </div>
</div>
```

### Step 2.4: Create Application JavaScript (`myApp.js`)
Define a class extending `AppBase`.
Example (`apps/MyApp/myApp.js`):
```javascript
class MyApp extends AppBase {
    constructor(appConfig, appWindowElement) {
        super(appConfig, appWindowElement);
    }
    onInit() {
        if (!this.isValid) return;
        console.log(`${this.appConfig.name} initialized.`);
        // Add app-specific init logic here
    }
    onOpen() { /* App-specific logic on open */ }
    onClose() { /* App-specific cleanup on close */ }
    // Override other AppBase methods or add new ones as needed
}
// window.MyApp = MyApp; // Usually not needed if class name matches initFunction
```

## 3. Update `config.json`
Add an entry for "MyApp". `initFunction` must be "MyApp" (the class name).
```json
{
  "name": "MyApp",
  "iconId": "my-app-icon", 
  "script": "apps/MyApp/myApp.js",
  "initFunction": "MyApp", 
  "iconHtml": "apps/MyApp/icon.html",
  "bodyHtml": "apps/MyApp/appbody.html",
  "css": "apps/MyApp/style.css",
  "defaultWidth": "400px",
  "defaultHeight": "300px",
  "resizable": true,
  "maximizable": true,
  "minimizable": true
}
```

## 4. Styling Your Application
Use the app-specific `style.css` file (e.g., `apps/MyApp/style.css`). Scope selectors using the window ID (e.g., `#my-app-window .my-class`).

## 5. App Launching
- Apps are listed in the Start Menu by their `name` from `config.json`.
- Clicking an app in the Start Menu will attempt to call the `open()` method of its instance. If not yet instantiated (e.g., desktop icon not clicked first), `script.js` will simulate a click on its desktop icon to trigger the standard instantiation and opening process.
- Desktop icons also launch apps as before.

## 6. Running and Testing
Serve `index.html` via an HTTP server (e.g., `python -m http.server`).

## 7. Storing App-Specific Settings (Example: IndexedDB)
(This section remains the same as previously updated, explaining IndexedDB usage for settings like Media Viewer's last folder.)

Applications can store their own settings (like the last used folder for Media Viewer) using browser storage mechanisms. IndexedDB is recommended for storing complex objects like `DirectoryHandle`s.

### Example: Using IndexedDB in an App

1.  **Define DB constants**:
    ```javascript
    const DB_NAME = 'WebDesktopAppSettings'; // Shared DB name
    const DB_VERSION = 1; // Increment if schema changes
    const STORE_NAME = 'yourAppNameSettings'; // App-specific store name
    const YOUR_SETTING_KEY = 'yourSettingKey';
    ```

2.  **Helper functions for DB operations** (can be part of your app's JS or a shared utility):
    ```javascript
    function openDB() { /* ... see MediaViewer for example ... */ }
    async function getSetting(key) { /* ... see MediaViewer for example ... */ }
    async function setSetting(key, value) { /* ... see MediaViewer for example ... */ }
    ```

3.  **Usage**:
    -   On app load, try to retrieve settings:
        ```javascript
        // Inside your app's onInit or onOpen method
        const lastHandle = await this._getSetting(this.YOUR_SETTING_KEY); // Assuming helpers are part of class
        if (lastHandle) {
            // Attempt to use/verify the handle
        }
        ```
    -   When a setting changes (e.g., user selects a folder):
        ```javascript
        // directoryHandle is the FileSystemDirectoryHandle
        await this._setSetting(this.YOUR_SETTING_KEY, directoryHandle);
        ```

Refer to `apps/MediaViewer/mediaViewer.js` for a complete implementation example of storing a `DirectoryHandle` in IndexedDB. Remember that permissions for directory handles need to be re-verified across sessions.
