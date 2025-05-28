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
Inside `apps/MyApp/`, create `myApp.js` (or `yourAppName.js`). This file contains the JavaScript logic for your application.
It **must** define an initialization function (e.g., `initializeMyApp`) that will be called by the main `script.js` after the app's HTML and script are loaded.

Key tasks for this script:
- Get references to the icon and window elements using their IDs.
- Add event listeners for opening the window (on icon click) and closing the window (on close button click).
- Implement draggable functionality for the window.

Example (`apps/MyApp/myApp.js`):
```javascript
function initializeMyApp() {
    const appIcon = document.getElementById('my-app-icon');
    const appWindow = document.getElementById('my-app-window');

    // Ensure elements exist
    if (!appIcon || !appWindow) {
        console.warn("MyApp elements not found. App will not initialize.");
        return;
    }

    const closeButton = appWindow.querySelector('.close-button');
    const windowHeader = appWindow.querySelector('.window-header');

    // Open window
    appIcon.addEventListener('click', () => {
        appWindow.style.display = 'flex'; // Or 'block', depending on your CSS for .window
    });

    // Close window
    closeButton.addEventListener('click', () => {
        appWindow.style.display = 'none';
    });

    // Draggable window logic (copy from existing apps like sampleApp.js or notepadApp.js)
    let isDragging = false;
    let offsetX, offsetY;

    windowHeader.addEventListener('mousedown', (e) => {
        // Prevent dragging if the click is on the close button itself
        if (e.target === closeButton) return;
        isDragging = true;
        offsetX = e.clientX - appWindow.offsetLeft;
        offsetY = e.clientY - appWindow.offsetTop;
        appWindow.style.cursor = 'grabbing';
        // Bring window to front (optional, requires z-index management)
        // document.querySelectorAll('.window').forEach(win => win.style.zIndex = '10');
        // appWindow.style.zIndex = '11';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        const desktop = document.getElementById('desktop');
        const maxX = desktop.offsetWidth - appWindow.offsetWidth;
        const maxY = desktop.offsetHeight - appWindow.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        appWindow.style.left = `${newX}px`;
        appWindow.style.top = `${newY}px`;
        appWindow.style.transform = 'none'; // Clear transform if set by initial centering
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            appWindow.style.cursor = 'move';
        }
    });
}
```
*(Note: The z-index management for bringing windows to the front is a common enhancement but is not fully implemented in the base draggable logic provided. You might need to expand on this if multiple windows overlapping is a concern.)*

## 3. Update `config.json`
Add a new entry for your application in the `apps` array within `config.json`.

Example entry for "MyApp":
```json
{
  "name": "MyApp",
  "script": "apps/MyApp/myApp.js",
  "initFunction": "initializeMyApp",
  "iconHtml": "apps/MyApp/icon.html",
  "bodyHtml": "apps/MyApp/appbody.html"
}
```
Ensure this new object is added as an element in the `apps` array, maintaining correct JSON syntax (e.g., add a comma after the preceding app object if it's not the last one).

## 4. Styling Your Application
- **Global Styles**: General styles for icons (`.icon`), windows (`.window`), headers (`.window-header`), etc., are defined in the main `style.css`.
- **App-Specific Styles**: If your app requires unique styles for its content, you can:
    - Add them to the main `style.css` file, perhaps prefixed with a class specific to your app's window (e.g., `#my-app-window .my-custom-class`).
    - For more complex apps, you might consider loading a dedicated CSS file for your app, though this is not currently handled by `script.js`.

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
