# Web Desktop App Development Guide

This guide explains how to create and integrate new applications into the web desktop environment.

## 1. Project Structure Overview

The web desktop is organized as follows:

-   `index.html`: The main HTML file that hosts the desktop.
-   `style.css`: Global styles for the desktop, icons, and windows.
-   `script.js`: Core JavaScript logic for loading apps and managing the desktop environment.
-   `config.json`: Configuration file listing all available applications and their resources.
-   `apps/`: Directory containing all individual applications.
    -   `apps/YourAppName/`: Each application resides in its own subdirectory.
        -   `icon.html`: HTML snippet for the application's desktop icon.
        -   `appbody.html`: HTML snippet for the application's main window structure.
        -   `yourAppName.js`: JavaScript logic specific to the application.
        -   `style.css`: (Optional) CSS styles specific to the application.

## 2. Creating a New Application

Follow these steps to create a new application (e.g., "MyApp"):

### Step 2.1: Create Application Directory
Create a new folder for your application within the `apps/` directory:
`apps/MyApp/`

### Step 2.2: Create Icon HTML (`icon.html`)
Inside `apps/MyApp/`, create `icon.html`. This file defines the HTML structure for your app's icon on the desktop.
**Important:** The root element must have a unique `id` that your app's JavaScript will use.

Example (`apps/MyApp/icon.html`):
```html
<div class="icon" id="my-app-icon">
    <!-- You can use an img tag or other elements for the icon visual -->
    <span>My App</span>
</div>
```

### Step 2.3: Create App Body HTML (`appbody.html`)
Inside `apps/MyApp/`, create `appbody.html`. This file defines the HTML structure for your app's window.
**Important:**
- The main window `div` must have the class `window` and a unique `id`.
- The window header `div` should have the class `window-header`.
- The close button should have the class `close-button`.
- The content area `div` should have the class `window-content`.

Example (`apps/MyApp/appbody.html`):
```html
<div class="window" id="my-app-window">
    <div class="window-header">
        <span>My App Title</span>
        <button class="close-button">X</button>
    </div>
    <div class="window-content">
        <!-- Your app's UI elements go here -->
        <p>Hello from My App!</p>
    </div>
</div>
```

### Step 2.4: Create Application JavaScript (`myApp.js`)
Inside `apps/MyApp/`, create `myApp.js`. This file should define a class that extends `AppBase`.
The `initFunction` property in `config.json` should be set to the name of this class.

Example (`apps/MyApp/myApp.js`):
```javascript
class MyApp extends AppBase {
    constructor(appConfig, appWindowElement) {
        super(appConfig, appWindowElement); // Call the AppBase constructor
        // AppBase constructor calls this.onInit() at the end.
    }

    onInit() {
        // This is called by the AppBase constructor.
        // Add any MyApp-specific initialization here.
        // For example, getting references to specific UI elements within this app's window:
        // this.myButton = this.appWindowElement.querySelector('.my-app-button');
        // if (this.myButton) {
        //     this.myButton.addEventListener('click', () => this.doSomething());
        // }
        if (!this.isValid) return; // Check if AppBase setup failed
        console.log(`${this.appConfig.name} initialized using AppBase.`);
    }

    onOpen() {
        // Called by AppBase when the window is opened/restored.
        // Add app-specific logic for when the window becomes visible.
        if (!this.isValid) return;
        console.log(`${this.appConfig.name} opened.`);
    }

    onClose() {
        // Called by AppBase when the window is closed (X button).
        // Reset any app-specific state here to ensure a "fresh" open next time.
        if (!this.isValid) return;
        console.log(`${this.appConfig.name} closed, specific state reset.`);
        // Example: if (this.myTextarea) this.myTextarea.value = '';
    }

    // You can override other AppBase lifecycle methods:
    // onMinimize() { ... }
    // onToggleMaximize(isNowMaximized) { ... }

    // Add app-specific methods:
    // doSomething() {
    //    console.log(`${this.appConfig.name} is doing something!`);
    // }
}

// Ensure the class is available globally for script.js to instantiate
// This is typically automatic for classes defined at the top level of a script.
// If using modules or bundlers, you might need: window.MyApp = MyApp;
```
The `AppBase` class handles common functionalities like opening, closing, minimizing, maximizing, dragging, resizing, and basic taskbar interaction. Your app-specific class can focus on its unique features and override `AppBase` methods if custom behavior is needed for those lifecycle events.

## 3. Update `config.json`
Add a new entry for your application. The `initFunction` should now be the **name of your app's class**.
Also, include an `iconId` property if your icon's HTML ID doesn't follow the convention `appName.toLowerCase() + '-app-icon'`.

Example entry for "MyApp":
```json
{
  "name": "MyApp",
  "iconId": "my-app-icon", // Specific ID of the icon in icon.html
  "script": "apps/MyApp/myApp.js",
  "initFunction": "MyApp", // This must match the class name
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
Ensure this new object is added as an element in the `apps` array, maintaining correct JSON syntax.
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
Ensure this new object is added as an element in the `apps` array, maintaining correct JSON syntax.

## 4. Styling Your Application
- **Global Styles**: General styles for icons (`.icon`), windows (`.window`), headers (`.window-header`), etc., are defined in the main `style.css`.
- **App-Specific Styles**: Each application can have its own `style.css` file within its directory (e.g., `apps/MyApp/style.css`).
    - Create this file and add any styles specific to your application.
    - These styles will be loaded automatically if the `css` path is correctly specified in `config.json` for your app.
    - This is the recommended way to manage styles unique to your application, keeping them separate from the global `style.css`.

## 5. Running and Testing
To correctly load `config.json` and the HTML snippets using the `fetch` API, you **must** serve the `index.html` file via an HTTP server. Opening `index.html` directly from the file system (`file:///`) will likely result in CORS errors.

You can use simple built-in servers:
- **Python**: Navigate to the project root in your terminal and run:
  `python -m http.server`
  Then open `http://localhost:8000` in your browser.
- **Node.js (with http-server)**: If you have Node.js, you can install `http-server` globally (`npm install -g http-server`) and then run from the project root:
  `http-server`
  Then open the URL provided (usually `http://localhost:8080`).

After making changes, refresh the page in your browser. Check the browser's developer console for any errors.

This structure allows for modular app development, keeping each app's concerns (HTML, JS) largely within its own directory.

## 6. Storing App-Specific Settings (Example: IndexedDB)

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
        // Inside your app's initializeMyApp or equivalent
        const lastHandle = await getSetting(YOUR_SETTING_KEY);
        if (lastHandle) {
            // Attempt to use/verify the handle
        }
        ```
    -   When a setting changes (e.g., user selects a folder):
        ```javascript
        // directoryHandle is the FileSystemDirectoryHandle
        await setSetting(YOUR_SETTING_KEY, directoryHandle);
        ```

Refer to `apps/MediaViewer/mediaViewer.js` for a complete implementation example of storing a `DirectoryHandle` in IndexedDB. Remember that permissions for directory handles need to be re-verified across sessions.
