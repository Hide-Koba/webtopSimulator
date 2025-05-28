class MediaViewerApp extends AppBase {
    constructor(appConfig, appWindowElement) {
        super(appConfig, appWindowElement);
        if (!this.isValid) return;

        this.selectFolderButton = this.appWindowElement.querySelector('.media-viewer-select-folder-button');
        this.mainImage = this.appWindowElement.querySelector('#media-viewer-main-image'); // ID is within its own appbody.html
        this.thumbnailStrip = this.appWindowElement.querySelector('.media-viewer-thumbnail-strip');
        
        this.imageFiles = [];
        this.directoryHandle = null;

        // IndexedDB constants (could be static properties if preferred)
        this.DB_NAME = 'WebDesktopAppSettings';
        this.DB_VERSION = 1;
        this.STORE_NAME = 'mediaViewerSettings'; // App-specific store
        this.DIR_HANDLE_KEY = `${this.appConfig.name}_lastDirectoryHandle`; // Unique key per app instance if needed, or global for type

        this._bindMediaViewerEventListeners();
    }

    onInit() {
        if (!this.isValid) return;
        // console.log(`${this.appConfig.name} initialized.`);
        // Initial message if no folder loaded yet
        if (this.thumbnailStrip && this.imageFiles.length === 0) {
            this.thumbnailStrip.innerHTML = '<p class="media-viewer-message">Select a folder to view images.</p>';
        }
    }
    
    async onOpen() {
        if (!this.isValid) return;
        // console.log(`${this.appConfig.name} opened.`);
        // Try to load last folder only if no images are currently loaded (e.g., first open or after close)
        if (this.imageFiles.length === 0) { 
            await this._tryLoadLastFolder();
        }
    }

    onClose() {
        // Called by AppBase's close method
        if (!this.isValid) return;
        // Revoke object URLs
        Array.from(this.thumbnailStrip.children).forEach(child => {
            if (child.tagName === 'IMG' && child.src.startsWith('blob:')) URL.revokeObjectURL(child.src);
        });
        if (this.mainImage.src.startsWith('blob:')) URL.revokeObjectURL(this.mainImage.src);
        
        this.imageFiles = [];
        // directoryHandle is persisted, so we don't clear it here.
        // It will be re-verified on next open.
        if (this.thumbnailStrip) this.thumbnailStrip.innerHTML = '<p class="media-viewer-message">Select a folder to view images.</p>';
        if (this.mainImage) {
            this.mainImage.src = '';
            this.mainImage.alt = 'Selected Media';
        }
        // console.log(`${this.appConfig.name} closed, view cleared.`);
    }

    _bindMediaViewerEventListeners() {
        if (!this.isValid || !this.selectFolderButton) return;
        this.selectFolderButton.addEventListener('click', () => this._handleFolderSelection());
    }

    // --- IndexedDB Methods ---
    _openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            request.onerror = (event) => reject("DB Error: " + event.target.errorCode);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };
        });
    }
    async _getSetting(key) {
        const db = await this._openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get(key);
            request.onerror = (event) => reject("DB Get Error: " + event.target.errorCode);
            request.onsuccess = (event) => resolve(event.target.result);
        });
    }
    async _setSetting(key, value) {
        const db = await this._openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.put(value, key);
            request.onerror = (event) => reject("DB Set Error: " + event.target.errorCode);
            request.onsuccess = (event) => resolve(event.target.result);
        });
    }

    // --- File System Access Logic ---
    async _loadFilesFromHandle(handle) {
        this.imageFiles = [];
        this.thumbnailStrip.innerHTML = '';
        this.mainImage.src = '';
        this.mainImage.alt = 'Loading images...';
        let foundImages = false;
        try {
            for await (const entry of handle.values()) {
                if (entry.kind === 'file' && (entry.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i))) {
                    const file = await entry.getFile();
                    this.imageFiles.push(file);
                    foundImages = true;
                }
            }
            if (foundImages) {
                this._populateThumbnails();
                if (this.imageFiles.length > 0) this._displayImage(0);
            } else {
                this.thumbnailStrip.innerHTML = '<p class="media-viewer-message">No supported image files found.</p>';
                this.mainImage.alt = 'No images';
            }
        } catch (err) {
            console.error("Error reading files from handle:", err);
            this.thumbnailStrip.innerHTML = `<p class="media-viewer-message">Error: ${err.message}</p>`;
            this.mainImage.alt = 'Error loading';
            this.directoryHandle = null;
            await this._setSetting(this.DIR_HANDLE_KEY, null).catch(e => console.error("Error clearing handle", e));
        }
    }
    async _verifyAndRequestPermission(handle) {
        if (await handle.queryPermission({ mode: 'read' }) === 'granted') return true;
        return await handle.requestPermission({ mode: 'read' }) === 'granted';
    }
    async _handleFolderSelection() {
        try {
            const handle = await window.showDirectoryPicker();
            if (handle) {
                this.directoryHandle = handle;
                await this._setSetting(this.DIR_HANDLE_KEY, this.directoryHandle);
                await this._loadFilesFromHandle(this.directoryHandle);
            }
        } catch (err) {
            if (err.name !== 'AbortError') console.error("Folder selection error:", err);
            else this.thumbnailStrip.innerHTML = '<p class="media-viewer-message">Folder selection cancelled.</p>';
        }
    }
    _populateThumbnails() {
        this.thumbnailStrip.innerHTML = '';
        this.imageFiles.forEach((file, index) => {
            const thumbImg = document.createElement('img');
            thumbImg.src = URL.createObjectURL(file);
            thumbImg.alt = file.name;
            thumbImg.title = file.name;
            thumbImg.dataset.index = index;
            thumbImg.addEventListener('click', () => this._displayImage(index));
            this.thumbnailStrip.appendChild(thumbImg);
        });
    }
    _displayImage(index) {
        if (index >= 0 && index < this.imageFiles.length) {
            const file = this.imageFiles[index];
            if (this.mainImage.src.startsWith('blob:')) URL.revokeObjectURL(this.mainImage.src);
            this.mainImage.src = URL.createObjectURL(file);
            this.mainImage.alt = file.name;
            this._updateActiveThumbnail(this.thumbnailStrip.children[index]);
        }
    }
    _updateActiveThumbnail(activeThumbElement) {
        Array.from(this.thumbnailStrip.children).forEach(child => {
            if (child.tagName === 'IMG') child.classList.remove('active-thumbnail');
        });
        if (activeThumbElement && activeThumbElement.tagName === 'IMG') {
            activeThumbElement.classList.add('active-thumbnail');
        }
    }
    async _tryLoadLastFolder() {
        try {
            const handle = await this._getSetting(this.DIR_HANDLE_KEY);
            if (handle) {
                if (await this._verifyAndRequestPermission(handle)) {
                    this.directoryHandle = handle;
                    await this._loadFilesFromHandle(this.directoryHandle);
                } else {
                    this.thumbnailStrip.innerHTML = '<p class="media-viewer-message">Permission denied for last folder.</p>';
                    this.directoryHandle = null;
                    await this._setSetting(this.DIR_HANDLE_KEY, null);
                }
            } else {
                this.thumbnailStrip.innerHTML = '<p class="media-viewer-message">Select a folder to view images.</p>';
            }
        } catch (err) {
            console.error("Error loading last folder:", err);
            this.thumbnailStrip.innerHTML = '<p class="media-viewer-message">Select a folder to view images.</p>';
        }
    }
}

// Explicitly assign the class to the window object
window.MediaViewerApp = MediaViewerApp;
