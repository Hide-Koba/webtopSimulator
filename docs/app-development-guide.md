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
Inside `apps/MyApp/`, create `myApp.js`. This file contains your application's logic.
It **must** define an initialization function (e.g., `initializeMyApp`). This function will receive two arguments from `script.js`:
1.  `appConfig`: The application's configuration object from `config.json`.
2.  `appWindowElement`: The DOM element for the application's main window.

Key tasks for this script:
- Get references to the icon (e.g., `document.getElementById('my-app-icon')`).
- Use `appWindowElement` to find elements within the window (e.g., close button, header, resize handle).
- Implement open/close logic.
- Implement draggable, resizable, and maximizable behaviors based on `appConfig.resizable` and `appConfig.maximizable`.

Example (`apps/MyApp/myApp.js`):
```javascript
function initializeMyApp(appConfig, appWindowElement) {
    // appConfig: { name, script, ..., defaultWidth, defaultHeight, resizable, maximizable }
    // appWindowElement: The main DOM element for this app's window

    const appIcon = document.getElementById('my-app-icon'); // Make sure this ID matches your icon.html

    if (!appIcon || !appWindowElement) {
        console.warn(`'${appConfig.name}' elements not found. Icon: ${appIcon}, Window: ${appWindowElement}`);
        return;
    }

    const closeButton = appWindowElement.querySelector('.close-button');
    // Minimize button is added by script.js if appConfig.minimizable is true
    const minimizeButton = appWindowElement.querySelector('.minimize-button'); 
    const windowHeader = appWindowElement.querySelector('.window-header');
    // Resize handle is added by script.js if appConfig.resizable is true
    const resizeHandle = appWindowElement.querySelector('.window-resize-handle'); 
    let taskbarButton = null; // To store reference to this app's taskbar button

    let originalDimensions = { /* Store for restore from maximize */
        width: appWindowElement.style.width, height: appWindowElement.style.height,
        top: appWindowElement.style.top, left: appWindowElement.style.left
    };
    let isMaximized = false;

    // Open window
    appIcon.addEventListener('click', () => {
        appWindowElement.style.display = 'flex';
        // Create or get taskbar button and set as active
        if (!taskbarButton && window.manageTaskbar) {
            taskbarButton = window.manageTaskbar.add(appConfig, appWindowElement);
        }
        if (window.manageTaskbar) {
            window.manageTaskbar.setActive(appWindowElement.id);
        }

        if (!isMaximized) {
            // Apply default or stored dimensions/position
            appWindowElement.style.width = originalDimensions.width || appConfig.defaultWidth;
            appWindowElement.style.height = originalDimensions.height || appConfig.defaultHeight;
            if (!originalDimensions.left || originalDimensions.left === "50%") {
                 appWindowElement.style.left = '50%'; appWindowElement.style.top = '50%';
                 appWindowElement.style.transform = 'translate(-50%, -50%)';
            } else {
                 appWindowElement.style.left = originalDimensions.left; appWindowElement.style.top = originalDimensions.top;
                 appWindowElement.style.transform = 'none';
            }
        }
        // Bring to front is handled by the window's mousedown listener, but also good to do on explicit open/restore
        if (window.manageTaskbar) window.manageTaskbar.bringToFront(appWindowElement.id);
    });

    // Add mousedown listener to the window to bring it to front
    appWindowElement.addEventListener('mousedown', () => {
        if (window.manageTaskbar) {
            window.manageTaskbar.bringToFront(appWindowElement.id);
        }
    }, true); // Use capture phase

    // Close window
    closeButton.addEventListener('click', () => {
        appWindowElement.style.display = 'none';
        if (window.manageTaskbar) {
            window.manageTaskbar.remove(appWindowElement.id); // Remove from taskbar
        }
        taskbarButton = null; // Reset reference
    });

    // Minimize window
    if (appConfig.minimizable && minimizeButton) {
        minimizeButton.addEventListener('click', () => {
            appWindowElement.style.display = 'none';
            if (window.manageTaskbar) {
                window.manageTaskbar.setInactive(appWindowElement.id);
            }
            // The taskbar button itself (created in script.js) will handle restoring the window.
        });
    }

    // Maximize/Restore on header double-click
    if (appConfig.maximizable && windowHeader) {
        windowHeader.addEventListener('dblclick', (e) => {
            // Avoid triggering on buttons within header
            if (e.target.closest('button') || (resizeHandle && e.target === resizeHandle)) return;

            if (isMaximized) { // Restore
                appWindowElement.classList.remove('maximized');
                appWindowElement.style.width = originalDimensions.width;
                appWindowElement.style.height = originalDimensions.height;
                appWindowElement.style.top = originalDimensions.top;
                appWindowElement.style.left = originalDimensions.left;
                appWindowElement.style.transform = (originalDimensions.left === '50%') ? 'translate(-50%, -50%)' : 'none';
                isMaximized = false;
            } else { // Maximize
                originalDimensions = { /* Save current state */
                    width: appWindowElement.style.width, height: appWindowElement.style.height,
                    top: appWindowElement.style.top, left: appWindowElement.style.left
                };
                appWindowElement.classList.add('maximized');
                appWindowElement.style.transform = 'none'; // Remove any transform
                isMaximized = true;
            }
        });
    }

    // Draggable window
    if (windowHeader) {
        let isDragging = false, dragOffsetX, dragOffsetY;
        windowHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button') || (resizeHandle && e.target === resizeHandle) || isMaximized) return;
            isDragging = true;
            appWindowElement.style.transform = 'none'; // Crucial for correct offset calculation
            dragOffsetX = e.clientX - appWindowElement.offsetLeft;
            dragOffsetY = e.clientY - appWindowElement.offsetTop;
            appWindowElement.style.cursor = 'grabbing';
            // Bring to front is handled by the window's mousedown listener
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newX = e.clientX - dragOffsetX;
            let newY = e.clientY - dragOffsetY;
            const desktop = document.getElementById('desktop');
            // Basic boundary collision
            newX = Math.max(0, Math.min(newX, desktop.offsetWidth - appWindowElement.offsetWidth));
            newY = Math.max(0, Math.min(newY, desktop.offsetHeight - appWindowElement.offsetHeight));
            appWindowElement.style.left = `${newX}px`;
            appWindowElement.style.top = `${newY}px`;
        });
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                appWindowElement.style.cursor = 'move';
                // Store new position for restore if not maximized
                if(!isMaximized) {
                    originalDimensions.left = appWindowElement.style.left;
                    originalDimensions.top = appWindowElement.style.top;
                }
            }
        });
    }

    // Resizable window (if enabled and handle exists)
    if (appConfig.resizable && resizeHandle) {
        let isResizing = false, resizeInitialX, resizeInitialY, initialWidth, initialHeight;
        resizeHandle.addEventListener('mousedown', (e) => {
            if (isMaximized) return;
            e.stopPropagation(); // Prevent drag
            isResizing = true;
            resizeInitialX = e.clientX; resizeInitialY = e.clientY;
            initialWidth = appWindowElement.offsetWidth; initialHeight = appWindowElement.offsetHeight;
            appWindowElement.style.transform = 'none'; // Ensure direct sizing
            // Convert 50%/50% to pixel values if needed
            if (appWindowElement.style.left === '50%') {
                appWindowElement.style.left = `${appWindowElement.offsetLeft}px`;
                appWindowElement.style.top = `${appWindowElement.offsetTop}px`;
            }
            document.body.style.cursor = 'nwse-resize';
            appWindowElement.style.userSelect = 'none'; // Prevent text selection during resize
        });
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const dx = e.clientX - resizeInitialX; const dy = e.clientY - resizeInitialY;
            let newWidth = initialWidth + dx; let newHeight = initialHeight + dy;
            const minWidth = parseInt(getComputedStyle(appWindowElement).minWidth, 10) || 150;
            const minHeight = parseInt(getComputedStyle(appWindowElement).minHeight, 10) || 100;
            newWidth = Math.max(minWidth, newWidth); newHeight = Math.max(minHeight, newHeight);
            appWindowElement.style.width = `${newWidth}px`;
            appWindowElement.style.height = `${newHeight}px`;
        });
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
                appWindowElement.style.userSelect = '';
                 // Store new dimensions for restore if not maximized
                if(!isMaximized) {
                    originalDimensions.width = appWindowElement.style.width;
                    originalDimensions.height = appWindowElement.style.height;
                }
            }
        });
    }
}
```
*(Note: The z-index management for bringing windows to the front is a common enhancement and should be implemented for better UX with multiple windows. This example focuses on the resize/maximize logic.)*

## 3. Update `config.json`
Add a new entry for your application in the `apps` array within `config.json`. Include the new window behavior properties:
- `defaultWidth` (string, e.g., "400px")
- `defaultHeight` (string, e.g., "300px")
- `resizable` (boolean, `true` or `false`)
- `maximizable` (boolean, `true` or `false`)
- `minimizable` (boolean, `true` or `false`)

Example entry for "MyApp":
```json
{
  "name": "MyApp",
  "script": "apps/MyApp/myApp.js",
  "initFunction": "initializeMyApp",
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
