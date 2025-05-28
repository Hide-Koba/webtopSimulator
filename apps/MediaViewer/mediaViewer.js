function initializeMediaViewer() {
    const appIcon = document.getElementById('media-viewer-icon');
    const appWindow = document.getElementById('media-viewer-window');

    if (!appIcon || !appWindow) {
        console.warn("MediaViewer elements not found. App will not initialize.");
        return;
    }

    const closeButton = appWindow.querySelector('.close-button');
    const windowHeader = appWindow.querySelector('.window-header');
    const selectFolderButton = appWindow.querySelector('.media-viewer-select-folder-button');
    const mainImage = document.getElementById('media-viewer-main-image');
    const thumbnailStrip = appWindow.querySelector('.media-viewer-thumbnail-strip');
    const initialMessage = thumbnailStrip.querySelector('.media-viewer-message');
    let imageFiles = []; // To store File objects

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
        appWindow.style.display = 'flex';
        // Optionally, clear previous state if desired when re-opening
        // if (imageFiles.length === 0 && initialMessage) {
        //     thumbnailStrip.innerHTML = '';
        //     thumbnailStrip.appendChild(initialMessage.cloneNode(true));
        // }
    });

    // Close window
    closeButton.addEventListener('click', () => {
        appWindow.style.display = 'none';
    });

    // Draggable window logic
    let isDragging = false;
    let offsetX, offsetY;
    windowHeader.addEventListener('mousedown', (e) => {
        if (e.target === closeButton) return;
        isDragging = true;
        offsetX = e.clientX - appWindow.offsetLeft;
        offsetY = e.clientY - appWindow.offsetTop;
        appWindow.style.cursor = 'grabbing';
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
        appWindow.style.transform = 'none';
    });
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            appWindow.style.cursor = 'move';
        }
    });
}
