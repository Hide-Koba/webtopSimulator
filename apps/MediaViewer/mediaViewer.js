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
    const mainImage = document.getElementById('media-viewer-main-image'); // Ensure this ID is unique or scoped if multiple viewers
    let taskbarButton = null;
    const thumbnailStrip = appWindowElement.querySelector('.media-viewer-thumbnail-strip');
    const initialMessage = thumbnailStrip.querySelector('.media-viewer-message'); // This might be an issue if thumbnailStrip is cleared.
    let imageFiles = []; // To store File objects

    let originalDimensions = {
        width: appWindowElement.style.width,
        height: appWindowElement.style.height,
        top: appWindowElement.style.top,
        left: appWindowElement.style.left
    };
    let isMaximized = false;

    async function handleFolderSelection() {
        try {
            const dirHandle = await window.showDirectoryPicker();
            imageFiles = []; // Reset the list
            thumbnailStrip.innerHTML = ''; // Clear previous thumbnails or message
            mainImage.src = '';
            mainImage.alt = 'Select an image';

            let foundImages = false;
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file' && (entry.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i))) {
                    const file = await entry.getFile();
                    imageFiles.push(file);
                    foundImages = true;
                }
            }

            if (foundImages) {
                populateThumbnails();
                if (imageFiles.length > 0) {
                    displayImage(0);
                }
            } else {
                thumbnailStrip.innerHTML = '<p class="media-viewer-message">No supported image files found in the selected folder.</p>';
            }

        } catch (err) {
            if (err.name !== 'AbortError') { // User cancelled the picker
                console.error("Error selecting folder or reading files:", err);
                thumbnailStrip.innerHTML = `<p class="media-viewer-message">Error: ${err.message}</p>`;
            } else {
                 thumbnailStrip.innerHTML = '<p class="media-viewer-message">Folder selection cancelled.</p>';
            }
        }
    }

    function populateThumbnails() {
        thumbnailStrip.innerHTML = ''; // Clear existing thumbnails or message
        imageFiles.forEach((file, index) => {
            const thumbImg = document.createElement('img');
            thumbImg.src = URL.createObjectURL(file); // Create object URL for display
            thumbImg.alt = file.name;
            thumbImg.title = file.name;
            thumbImg.dataset.index = index;
            thumbImg.addEventListener('click', () => {
                displayImage(index);
            });
            // Revoke object URL when no longer needed (e.g., when window closes or new folder selected)
            // For simplicity, not revoking immediately here, but important for long-running apps.
            thumbnailStrip.appendChild(thumbImg);
        });
    }

    function displayImage(index) {
        if (index >= 0 && index < imageFiles.length) {
            const file = imageFiles[index];
            mainImage.src = URL.createObjectURL(file);
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
    
    // Event listener for the select folder button
    selectFolderButton.addEventListener('click', handleFolderSelection);

    // Open window
    appIcon.addEventListener('click', () => {
        appWindowElement.style.display = 'flex';
        if (!taskbarButton && window.manageTaskbar) {
            taskbarButton = window.manageTaskbar.add(appConfig, appWindowElement);
        }
        if (window.manageTaskbar) window.manageTaskbar.setActive(appWindowElement.id);

        if (!isMaximized) {
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
        if (imageFiles.length === 0 && thumbnailStrip.querySelector('.media-viewer-message') === null) {
             thumbnailStrip.innerHTML = '<p class="media-viewer-message">Select a folder to view images.</p>';
        }
        // TODO: Bring to front
    });

    // Close window
    closeButton.addEventListener('click', () => {
        appWindowElement.style.display = 'none';
        if (window.manageTaskbar) window.manageTaskbar.remove(appWindowElement.id);
        taskbarButton = null;
    });

    // Minimize window
    if (appConfig.minimizable && minimizeButton) {
        minimizeButton.addEventListener('click', () => {
            appWindowElement.style.display = 'none';
            if (window.manageTaskbar) window.manageTaskbar.setInactive(appWindowElement.id);
        });
    }

    // Maximize/Restore
    if (appConfig.maximizable && windowHeader) {
        windowHeader.addEventListener('dblclick', (e) => {
            if (e.target === closeButton || e.target === selectFolderButton || (resizeHandle && e.target === resizeHandle)) return;
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

    // Draggable window logic
    if (windowHeader) {
        let isDragging = false;
        let dragOffsetX, dragOffsetY;
        windowHeader.addEventListener('mousedown', (e) => {
            if (e.target === closeButton || e.target === selectFolderButton || (resizeHandle && e.target === resizeHandle) || isMaximized) return;
            isDragging = true;
            dragOffsetX = e.clientX - appWindowElement.offsetLeft;
            dragOffsetY = e.clientY - appWindowElement.offsetTop;
            appWindowElement.style.cursor = 'grabbing';
            appWindowElement.style.transform = 'none';
            // TODO: Bring to front
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

    // Resizable window
    if (appConfig.resizable && resizeHandle) {
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
