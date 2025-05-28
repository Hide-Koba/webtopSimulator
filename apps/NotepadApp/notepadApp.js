function initializeNotepadApp(appConfig, appWindowElement) {
    const appIcon = document.getElementById('notepad-app-icon');
    
    if (!appIcon || !appWindowElement) {
        console.warn(`${appConfig.name || 'App'} elements not found. App will not initialize.`);
        return;
    }

    const closeButton = appWindowElement.querySelector('.close-button');
    const minimizeButton = appWindowElement.querySelector('.minimize-button');
    const windowHeader = appWindowElement.querySelector('.window-header');
    const resizeHandle = appWindowElement.querySelector('.window-resize-handle');
    let taskbarButton = null;

    let originalDimensions = {
        width: appWindowElement.style.width,
        height: appWindowElement.style.height,
        top: appWindowElement.style.top,
        left: appWindowElement.style.left
    };
    let isMaximized = false;

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
        // TODO: Bring to front
    });

    closeButton.addEventListener('click', () => {
        appWindowElement.style.display = 'none';
        if (window.manageTaskbar) window.manageTaskbar.remove(appWindowElement.id);
        taskbarButton = null;
    });

    if (appConfig.minimizable && minimizeButton) {
        minimizeButton.addEventListener('click', () => {
            appWindowElement.style.display = 'none';
            if (window.manageTaskbar) window.manageTaskbar.setInactive(appWindowElement.id);
        });
    }

    if (appConfig.maximizable && windowHeader) {
        windowHeader.addEventListener('dblclick', (e) => {
            if (e.target === closeButton || (resizeHandle && e.target === resizeHandle)) return;
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
        let isDragging = false;
        let dragOffsetX, dragOffsetY;
        windowHeader.addEventListener('mousedown', (e) => {
            if (e.target === closeButton || (resizeHandle && e.target === resizeHandle) || isMaximized) return;
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
