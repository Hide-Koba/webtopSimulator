class MediaViewerApp extends AppBase {
    constructor(appConfig, appWindowElement) {
        super(appConfig, appWindowElement);
        if (!this.isValid) return;

        this.selectFolderButton = WebDesktopLib.DOM.qs('.media-viewer-select-folder-button', this.appWindowElement);
        this.mainImage = WebDesktopLib.DOM.qs('#media-viewer-main-image', this.appWindowElement);
        this.thumbnailStrip = WebDesktopLib.DOM.qs('.media-viewer-thumbnail-strip', this.appWindowElement);
        
        this.imageFiles = [];
        this.directoryHandle = null;

        // IndexedDB constants for this app
        this.DB_NAME = 'WebDesktopAppSettings'; // Shared DB name across apps
        this.DB_VERSION = 1; // Global DB version
        this.STORE_NAME = 'mediaViewerSettings'; // App-specific store name
        this.DIR_HANDLE_KEY = `${this.appConfig.name}_lastDirectoryHandle`; // App-specific key

        this._bindMediaViewerEventListeners();
    }

    // onUpgradeNeeded callback for IndexedDB
    _onUpgradeNeeded(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            db.createObjectStore(this.STORE_NAME);
            console.log(`Object store ${this.STORE_NAME} created.`);
        }
    }

    async _getSetting(key) {
        try {
            return await WebDesktopLib.Storage.indexedDB.get(this.DB_NAME, this.DB_VERSION, this.STORE_NAME, key, this._onUpgradeNeeded.bind(this));
        } catch (e) {
            console.error(`MediaViewer: Error getting setting '${key}':`, e);
            return undefined;
        }
    }

    async _setSetting(key, value) {
        try {
            await WebDesktopLib.Storage.indexedDB.set(this.DB_NAME, this.DB_VERSION, this.STORE_NAME, key, value, this._onUpgradeNeeded.bind(this));
        } catch (e) {
            console.error(`MediaViewer: Error setting setting '${key}':`, e);
        }
    }
    
    onInit() {
        if (!this.isValid) return;
        if (this.thumbnailStrip && this.imageFiles.length === 0) {
            this.thumbnailStrip.innerHTML = '<p class="media-viewer-message">Select a folder to view images.</p>';
        }
    }
    
    async onOpen() {
        if (!this.isValid) return;
        if (this.imageFiles.length === 0) { 
            await this._tryLoadLastFolder();
        }
    }

    onClose() {
        if (!this.isValid) return;
        Array.from(this.thumbnailStrip.children).forEach(child => {
            if (child.tagName === 'IMG' && child.src.startsWith('blob:')) URL.revokeObjectURL(child.src);
        });
        if (this.mainImage.src.startsWith('blob:')) URL.revokeObjectURL(this.mainImage.src);
        
        this.imageFiles = [];
        if (this.thumbnailStrip) this.thumbnailStrip.innerHTML = '<p class="media-viewer-message">Select a folder to view images.</p>';
        if (this.mainImage) {
            this.mainImage.src = '';
            this.mainImage.alt = 'Selected Media';
        }
    }

    _bindMediaViewerEventListeners() {
        if (!this.isValid || !this.selectFolderButton) return;
        this.selectFolderButton.addEventListener('click', () => this._handleFolderSelection());
    }

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
            await this._setSetting(this.DIR_HANDLE_KEY, null);
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
            const thumbImg = WebDesktopLib.DOM.createElement('img', { // Use Lib
                src: URL.createObjectURL(file),
                alt: file.name,
                title: file.name,
                'data-index': index
            });
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
window.MediaViewerApp = MediaViewerApp;
