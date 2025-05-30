class AppBase {
    constructor(appConfig, appWindowElement) {
        this.appConfig = appConfig;
        this.appWindowElement = appWindowElement;
        const iconId = this.appConfig.iconId || (this.appConfig.name.toLowerCase() + '-app-icon');
        this.appIcon = WebDesktopLib.DOM.qs(`#${iconId}`); // Use Lib

        if (!this.appIcon || !this.appWindowElement) {
            console.warn(`BaseApp: '${this.appConfig.name}' elements not found. Icon: ${this.appIcon}, Window: ${this.appWindowElement}`);
            this.isValid = false;
            return;
        }
        this.isValid = true;

        this.closeButton = WebDesktopLib.DOM.qs('.close-button', this.appWindowElement);
        this.minimizeButton = WebDesktopLib.DOM.qs('.minimize-button', this.appWindowElement);
        this.windowHeader = WebDesktopLib.DOM.qs('.window-header', this.appWindowElement);
        this.resizeHandle = WebDesktopLib.DOM.qs('.window-resize-handle', this.appWindowElement);
        
        this.taskbarButton = null;
        this.originalDimensions = {
            width: this.appWindowElement.style.width || this.appConfig.defaultWidth,
            height: this.appWindowElement.style.height || this.appConfig.defaultHeight,
            top: this.appWindowElement.style.top || '50%',
            left: this.appWindowElement.style.left || '50%'
        };
        this.isMaximized = false;

        this._bindCoreEventListeners();
        this.onInit();
    }

    _bindCoreEventListeners() {
        if (!this.isValid) return;
        this.appIcon.addEventListener('click', () => this.open());
        this.appWindowElement.addEventListener('mousedown', () => this.focus(), true);
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.close());
        }
        if (this.appConfig.minimizable && this.minimizeButton) {
            this.minimizeButton.addEventListener('click', (e) => this.minimize(e));
        }
        if (this.appConfig.maximizable && this.windowHeader) {
            this.windowHeader.addEventListener('dblclick', (e) => this.toggleMaximize(e));
        }
        if (this.windowHeader) this._makeDraggable();
        if (this.appConfig.resizable && this.resizeHandle) this._makeResizable();
    }

    open() {
        if (!this.isValid) return;
        this.appWindowElement.style.display = 'flex';
        
        if (!this.taskbarButton && WebDesktopLib.Taskbar) { // Use Lib
            this.taskbarButton = WebDesktopLib.Taskbar.add(this.appConfig, this.appWindowElement);
        }
        this.focus(); 

        if (!this.isMaximized) {
            this.appWindowElement.style.width = this.originalDimensions.width || this.appConfig.defaultWidth;
            this.appWindowElement.style.height = this.originalDimensions.height || this.appConfig.defaultHeight;
            if (!this.originalDimensions.left || this.originalDimensions.left === "50%") {
                 this.appWindowElement.style.left = '50%';
                 this.appWindowElement.style.top = '50%';
                 this.appWindowElement.style.transform = 'translate(-50%, -50%)';
            } else {
                 this.appWindowElement.style.left = this.originalDimensions.left;
                 this.appWindowElement.style.top = this.originalDimensions.top;
                 this.appWindowElement.style.transform = 'none';
            }
        }
        this.onOpen();
    }

    close() {
        if (!this.isValid) return;
        this.appWindowElement.style.display = 'none';
        if (WebDesktopLib.Taskbar) { // Use Lib
            WebDesktopLib.Taskbar.remove(this.appWindowElement.id);
        }
        this.taskbarButton = null;
        this.isMaximized = false;
        this.originalDimensions = {
            width: this.appConfig.defaultWidth,
            height: this.appConfig.defaultHeight,
            top: '50%', left: '50%'
        };
        this.onClose();
    }

    minimize(event) {
        if (!this.isValid) return;
        if(event) event.stopPropagation();
        this.appWindowElement.style.display = 'none';
        if (WebDesktopLib.Taskbar) WebDesktopLib.Taskbar.setInactive(this.appWindowElement.id); // Use Lib
        this.onMinimize();
    }

    focus() {
        if (!this.isValid) return;
        if (WebDesktopLib.Taskbar) { // Use Lib
            WebDesktopLib.Taskbar.bringToFront(this.appWindowElement.id);
        }
    }

    toggleMaximize(event) {
        if (!this.isValid) return;
        if (event && (event.target.closest('button') || (this.resizeHandle && event.target === this.resizeHandle))) return;

        if (this.isMaximized) {
            this.appWindowElement.classList.remove('maximized');
            this.appWindowElement.style.width = this.originalDimensions.width;
            this.appWindowElement.style.height = this.originalDimensions.height;
            this.appWindowElement.style.top = this.originalDimensions.top;
            this.appWindowElement.style.left = this.originalDimensions.left;
            this.appWindowElement.style.transform = (this.originalDimensions.left === '50%') ? 'translate(-50%, -50%)' : 'none';
            this.isMaximized = false;
        } else {
            this.originalDimensions = {
                width: this.appWindowElement.style.width, height: this.appWindowElement.style.height,
                top: this.appWindowElement.style.top, left: this.appWindowElement.style.left
            };
            this.appWindowElement.classList.add('maximized');
            this.appWindowElement.style.transform = 'none';
            this.isMaximized = true;
        }
        this.onToggleMaximize(this.isMaximized);
    }

    _makeDraggable() {
        let isDragging = false;
        let dragOffsetX, dragOffsetY;
        this.windowHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button') || (this.resizeHandle && e.target === this.resizeHandle) || this.isMaximized) return;
            isDragging = true;
            if (this.appWindowElement.style.transform.includes('translate')) {
                const rect = this.appWindowElement.getBoundingClientRect();
                const parentRect = this.appWindowElement.parentElement.getBoundingClientRect();
                this.appWindowElement.style.left = `${rect.left - parentRect.left}px`;
                this.appWindowElement.style.top = `${rect.top - parentRect.top}px`;
                this.appWindowElement.style.transform = 'none';
            }
            dragOffsetX = e.clientX - this.appWindowElement.offsetLeft;
            dragOffsetY = e.clientY - this.appWindowElement.offsetTop;
            this.appWindowElement.style.cursor = 'grabbing';
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newX = e.clientX - dragOffsetX;
            let newY = e.clientY - dragOffsetY;
            const desktop = WebDesktopLib.DOM.qs('#desktop'); // Use Lib
            const maxX = desktop.offsetWidth - this.appWindowElement.offsetWidth;
            const maxY = desktop.offsetHeight - this.appWindowElement.offsetHeight;
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            this.appWindowElement.style.left = `${newX}px`;
            this.appWindowElement.style.top = `${newY}px`;
        });
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.appWindowElement.style.cursor = 'move';
                if (!this.isMaximized) {
                    this.originalDimensions.left = this.appWindowElement.style.left;
                    this.originalDimensions.top = this.appWindowElement.style.top;
                }
            }
        });
    }

    _makeResizable() {
        let isResizing = false;
        let resizeInitialX, resizeInitialY, initialWidth, initialHeight;
        this.resizeHandle.addEventListener('mousedown', (e) => {
            if (this.isMaximized) return;
            e.stopPropagation();
            isResizing = true;
            resizeInitialX = e.clientX; resizeInitialY = e.clientY;
            initialWidth = this.appWindowElement.offsetWidth; initialHeight = this.appWindowElement.offsetHeight;
            if (this.appWindowElement.style.transform.includes('translate')) {
                 const rect = this.appWindowElement.getBoundingClientRect();
                 const parentRect = this.appWindowElement.parentElement.getBoundingClientRect();
                 this.appWindowElement.style.left = `${rect.left - parentRect.left}px`;
                 this.appWindowElement.style.top = `${rect.top - parentRect.top}px`;
                 this.appWindowElement.style.transform = 'none';
            }
            document.body.style.cursor = 'nwse-resize';
            this.appWindowElement.style.userSelect = 'none';
        });
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const dx = e.clientX - resizeInitialX; const dy = e.clientY - resizeInitialY;
            let newWidth = initialWidth + dx; let newHeight = initialHeight + dy;
            const minWidth = parseInt(getComputedStyle(this.appWindowElement).minWidth, 10) || 150;
            const minHeight = parseInt(getComputedStyle(this.appWindowElement).minHeight, 10) || 100;
            newWidth = Math.max(minWidth, newWidth); newHeight = Math.max(minHeight, newHeight);
            this.appWindowElement.style.width = `${newWidth}px`;
            this.appWindowElement.style.height = `${newHeight}px`;
        });
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
                this.appWindowElement.style.userSelect = '';
                if (!this.isMaximized) {
                    this.originalDimensions.width = this.appWindowElement.style.width;
                    this.originalDimensions.height = this.appWindowElement.style.height;
                }
            }
        });
    }

    onInit() { }
    onOpen() { }
    onClose() { }
    onMinimize() { }
    onToggleMaximize(isNowMaximized) { }
}
