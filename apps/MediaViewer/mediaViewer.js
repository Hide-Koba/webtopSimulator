function initializeMediaViewer(appConfig, appWindowElement) {
    const appIcon = document.getElementById('media-viewer-icon');
    
    if (!appIcon || !appWindowElement) {
        console.warn(`${appConfig.name || 'App'} elements not found. App will not initialize.`);
        return;
    }

    const closeButton = appWindowElement.querySelector('.close-button');
    const minimizeButton = appWindowElement.querySelector('.minimize-button');
    const windowHeader = appWindowElement.querySelector('.window-header');
    const resizeHandle = appWindowElement.querySelector('.window-resize-handle');
    const selectFolderButton = appWindowElement.querySelector('.media-viewer-select-folder-button');
    const mainImage = document.getElementById('media-viewer-main-image');
    let taskbarButton = null;
    const thumbnailStrip = appWindowElement.querySelector('.media-viewer-thumbnail-strip');
    let imageFiles = [];
    let directoryHandle = null; // To store the selected directory handle

    // IndexedDB Helper Functions
    const DB_NAME = 'WebDesktopAppSettings';
    const DB_VERSION = 1;
    const STORE_NAME = 'mediaViewerSettings';
    const DIR_HANDLE_KEY = 'lastDirectoryHandle';

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (event) => reject("Error opening DB: " + event.target.errorCode);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    async function getSetting(key) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            request.onerror = (event) => reject("Error getting setting: " + event.target.errorCode);
            request.onsuccess = (event) => resolve(event.target.result);
        });
    }

    async function setSetting(key, value) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, key);
            request.onerror = (event) => reject("Error setting setting: " + event.target.errorCode);
            request.onsuccess = (event) => resolve(event.target.result);
        });
    }

    // --- End IndexedDB Helpers ---

    let originalDimensions = {
        width: appWindowElement.style.width,
        height: appWindowElement.style.height,
        top: appWindowElement.style.top,
        left: appWindowElement.style.left
    };
    let isMaximized = false;

    async function loadFilesFromHandle(handle) {
        imageFiles = [];
        thumbnailStrip.innerHTML = '';
        mainImage.src = '';
        mainImage.alt = 'Loading images...';
        let foundImages = false;

        try {
            for await (const entry of handle.values()) {
                if (entry.kind === 'file' && (entry.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i))) {
                    const file = await entry.getFile();
                    imageFiles.push(file);
                    foundImages = true;
                }
            }

            if (foundImages) {
                populateThumbnails();
                if (imageFiles.length > 0) displayImage(0);
            } else {
                thumbnailStrip.innerHTML = '<p class="media-viewer-message">No supported image files found in the folder.</p>';
                mainImage.alt = 'No images found';
            }
        } catch (err) {
            console.error("Error reading files from directory handle:", err);
            thumbnailStrip.innerHTML = `<p class="media-viewer-message">Error reading folder: ${err.message}</p>`;
            mainImage.alt = 'Error loading images';
            directoryHandle = null; // Invalidate handle on error
            await setSetting(DIR_HANDLE_KEY, null).catch(e => console.error("Error clearing handle", e));
        }
    }
    
    async function verifyAndRequestPermission(handle) {
        const options = { mode: 'read' };
        if (await handle.queryPermission(options) === 'granted') {
            return true;
        }
        if (await handle.requestPermission(options) === 'granted') {
            return true;
        }
        return false; // Permission denied
    }


    async function handleFolderSelection() {
        try {
            const handle = await window.showDirectoryPicker();
            if (handle) {
                directoryHandle = handle;
                await setSetting(DIR_HANDLE_KEY, directoryHandle);
                await loadFilesFromHandle(directoryHandle);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error("Error selecting folder:", err);
                thumbnailStrip.innerHTML = `<p class="media-viewer-message">Error selecting folder: ${err.message}</p>`;
            } else {
                 thumbnailStrip.innerHTML = '<p class="media-viewer-message">Folder selection cancelled.</p>';
            }
        }
    }

    function populateThumbnails() {
        thumbnailStrip.innerHTML = '';
        imageFiles.forEach((file, index) => {
            const thumbImg = document.createElement('img');
            thumbImg.src = URL.createObjectURL(file);
            thumbImg.alt = file.name;
            thumbImg.title = file.name;
            thumbImg.dataset.index = index;
            thumbImg.addEventListener('click', () => {
                displayImage(index);
            });
            thumbnailStrip.appendChild(thumbImg);
        });
    }

    function displayImage(index) {
        if (index >= 0 && index < imageFiles.length) {
            const file = imageFiles[index];
            mainImage.src = URL.createObjectURL(file); // Remember to revoke this URL later
            mainImage.alt = file.name;
            updateActiveThumbnail(thumbnailStrip.children[index]);
        }
    }

    function updateActiveThumbnail(activeThumbElement) {
        Array.from(thumbnailStrip.children).forEach(child => {
            if (child.tagName === 'IMG') child.classList.remove('active-thumbnail');
        });
        if (activeThumbElement && activeThumbElement.tagName === 'IMG') {
            activeThumbElement.classList.add('active-thumbnail');
        }
    }
    
    selectFolderButton.addEventListener('click', handleFolderSelection);

    async function tryLoadLastFolder() {
        try {
            const handle = await getSetting(DIR_HANDLE_KEY);
            if (handle) {
                if (await verifyAndRequestPermission(handle)) {
                    directoryHandle = handle;
                    await loadFilesFromHandle(directoryHandle);
                } else {
                    thumbnailStrip.innerHTML = '<p class="media-viewer-message">Permission denied for the last folder. Please select a folder.</p>';
                    directoryHandle = null; // Clear stale handle
                    await setSetting(DIR_HANDLE_KEY, null);
                }
            } else {
                 thumbnailStrip.innerHTML = '<p class="media-viewer-message">Select a folder to view images.</p>';
            }
        } catch (err) {
            console.error("Error trying to load last folder:", err);
            thumbnailStrip.innerHTML = '<p class="media-viewer-message">Select a folder to view images.</p>';
        }
    }

    appIcon.addEventListener('click', async () => {
        appWindowElement.style.display = 'flex';
        if (!taskbarButton && window.manageTaskbar) {
            taskbarButton = window.manageTaskbar.add(appConfig, appWindowElement);
        }
        if (window.manageTaskbar) window.manageTaskbar.bringToFront(appWindowElement.id);

        if (!isMaximized) {
            // ... (existing size/position logic)
            appWindowElement.style.width = originalDimensions.width || appConfig.defaultWidth;
            appWindowElement.style.height = originalDimensions.height || appConfig.defaultHeight;
             if (!originalDimensions.left || originalDimensions.left === "50%") {
                 appWindowElement.style.left = '50%';
                 appWindowElement.style.top = '50%';
                 appWindowElement.style.transform = 'translate(-50%, -50%)';
            } else {
                 appWindowElement.style.left = originalDimensions.left;
                 appWindowElement.style.top = originalDimensions.top;
                 appWindowElement.style.transform = 'none';
            }
        }
        
        if (!directoryHandle && imageFiles.length === 0) { // Only try to load if not already loaded
            await tryLoadLastFolder();
        } else if (imageFiles.length === 0) { // If handle was cleared due to error/denial
             thumbnailStrip.innerHTML = '<p class="media-viewer-message">Select a folder to view images.</p>';
        }
    });

    appWindowElement.addEventListener('mousedown', () => {
        if (window.manageTaskbar) {
            window.manageTaskbar.bringToFront(appWindowElement.id);
        }
    }, true);

    closeButton.addEventListener('click', () => {
        appWindowElement.style.display = 'none';
        // Revoke object URLs for thumbnails and main image to free memory
        Array.from(thumbnailStrip.children).forEach(child => {
            if (child.tagName === 'IMG' && child.src.startsWith('blob:')) URL.revokeObjectURL(child.src);
        });
        if (mainImage.src.startsWith('blob:')) URL.revokeObjectURL(mainImage.src);
        
        // Don't remove from taskbar, just set inactive if you want to keep state
        // if (window.manageTaskbar) window.manageTaskbar.remove(appWindowElement.id);
        // taskbarButton = null;
        if (window.manageTaskbar) window.manageTaskbar.setInactive(appWindowElement.id);
    });

    if (appConfig.minimizable && minimizeButton) {
        minimizeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            appWindowElement.style.display = 'none';
            if (window.manageTaskbar) window.manageTaskbar.setInactive(appWindowElement.id);
        });
    }

    if (appConfig.maximizable && windowHeader) {
        // ... (existing maximize/restore logic)
        windowHeader.addEventListener('dblclick', (e) => {
            if (e.target.closest('button') || (resizeHandle && e.target === resizeHandle)) return;
            if (isMaximized) {
                appWindowElement.classList.remove('maximized');
                appWindowElement.style.width = originalDimensions.width;
                appWindowElement.style.height = originalDimensions.height;
                appWindowElement.style.top = originalDimensions.top;
                appWindowElement.style.left = originalDimensions.left;
                if (originalDimensions.left === '50%') {
                    appWindowElement.style.transform = 'translate(-50%, -50%)';
                } else {
                    appWindowElement.style.transform = 'none';
                }
                isMaximized = false;
            } else {
                originalDimensions = {
                    width: appWindowElement.style.width,
                    height: appWindowElement.style.height,
                    top: appWindowElement.style.top,
                    left: appWindowElement.style.left
                };
                appWindowElement.classList.add('maximized');
                appWindowElement.style.transform = 'none';
                isMaximized = true;
            }
        });
    }

    if (windowHeader) {
        // ... (existing draggable logic)
        let isDragging = false;
        let dragOffsetX, dragOffsetY;
        windowHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button') || (resizeHandle && e.target === resizeHandle) || isMaximized) return;
            isDragging = true;
            if (appWindowElement.style.transform.includes('translate')) {
                const rect = appWindowElement.getBoundingClientRect();
                const parentRect = appWindowElement.parentElement.getBoundingClientRect();
                appWindowElement.style.left = `${rect.left - parentRect.left}px`;
                appWindowElement.style.top = `${rect.top - parentRect.top}px`;
                appWindowElement.style.transform = 'none';
            }
            dragOffsetX = e.clientX - appWindowElement.offsetLeft;
            dragOffsetY = e.clientY - appWindowElement.offsetTop;
            appWindowElement.style.cursor = 'grabbing';
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newX = e.clientX - dragOffsetX;
            let newY = e.clientY - dragOffsetY;
            const desktop = document.getElementById('desktop');
            const maxX = desktop.offsetWidth - appWindowElement.offsetWidth;
            const maxY = desktop.offsetHeight - appWindowElement.offsetHeight;
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            appWindowElement.style.left = `${newX}px`;
            appWindowElement.style.top = `${newY}px`;
        });
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                appWindowElement.style.cursor = 'move';
                originalDimensions.left = appWindowElement.style.left;
                originalDimensions.top = appWindowElement.style.top;
            }
        });
    }

    if (appConfig.resizable && resizeHandle) {
        // ... (existing resizable logic)
        let isResizing = false;
        let resizeInitialX, resizeInitialY, initialWidth, initialHeight;
        resizeHandle.addEventListener('mousedown', (e) => {
            if (isMaximized) return;
            e.stopPropagation();
            isResizing = true;
            resizeInitialX = e.clientX;
            resizeInitialY = e.clientY;
            initialWidth = appWindowElement.offsetWidth;
            initialHeight = appWindowElement.offsetHeight;
            appWindowElement.style.transform = 'none';
            if (appWindowElement.style.left === '50%') {
                appWindowElement.style.left = `${appWindowElement.offsetLeft}px`;
                appWindowElement.style.top = `${appWindowElement.offsetTop}px`;
            }
            document.body.style.cursor = 'nwse-resize';
            appWindowElement.style.userSelect = 'none';
        });
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const dx = e.clientX - resizeInitialX;
            const dy = e.clientY - resizeInitialY;
            let newWidth = initialWidth + dx;
            let newHeight = initialHeight + dy;
            const minWidth = parseInt(getComputedStyle(appWindowElement).minWidth, 10) || 150;
            const minHeight = parseInt(getComputedStyle(appWindowElement).minHeight, 10) || 100;
            newWidth = Math.max(minWidth, newWidth);
            newHeight = Math.max(minHeight, newHeight);
            appWindowElement.style.width = `${newWidth}px`;
            appWindowElement.style.height = `${newHeight}px`;
        });
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
                appWindowElement.style.userSelect = '';
                originalDimensions.width = appWindowElement.style.width;
                originalDimensions.height = appWindowElement.style.height;
            }
        });
    }
}
