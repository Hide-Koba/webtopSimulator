function initializeSampleApp(appConfig, appWindowElement) {
    // appConfig contains { name, script, initFunction, iconHtml, bodyHtml, css, defaultWidth, defaultHeight, resizable, maximizable }
    // appWindowElement is the DOM element for this app's window

    const appIcon = document.getElementById('sample-app-icon'); // Assuming icon ID is consistent or derived from appConfig.name
    
    if (!appIcon || !appWindowElement) {
        console.warn(`${appConfig.name || 'App'} elements not found. App will not initialize. Icon: ${appIcon}, Window: ${appWindowElement}`);
        return; 
    }

    const closeButton = appWindowElement.querySelector('.close-button');
    const minimizeButton = appWindowElement.querySelector('.minimize-button'); // Added by script.js
    const windowHeader = appWindowElement.querySelector('.window-header');
    const resizeHandle = appWindowElement.querySelector('.window-resize-handle'); // May be null if not resizable
    let taskbarButton = null;

    // --- Store original dimensions for restoring from maximized ---
    let originalDimensions = {
        width: appWindowElement.style.width,
        height: appWindowElement.style.height,
        top: appWindowElement.style.top,
        left: appWindowElement.style.left
    };
    let isMaximized = false;

    // --- Open window ---
    appIcon.addEventListener('click', () => {
        appWindowElement.style.display = 'flex';
        if (!taskbarButton && window.manageTaskbar) { // Create taskbar button on first open
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
        // TODO: Bring to front (z-index management) - now handled by mousedown on window
    });
    
    appWindowElement.addEventListener('mousedown', () => {
        if (window.manageTaskbar) {
            window.manageTaskbar.bringToFront(appWindowElement.id);
        }
    }, true); // Use capture phase to ensure it fires before drag/resize mousedown

    // --- Close window ---
    closeButton.addEventListener('click', () => {
        appWindowElement.style.display = 'none'; // Hide the window
        
        // Remove from taskbar and internal tracking in script.js
        if (window.manageTaskbar) {
            window.manageTaskbar.remove(appWindowElement.id);
        }
        taskbarButton = null; // Nullify local reference to taskbar button

        // Reset any app-specific state here if needed for a "fresh" open next time
        // For SampleApp, there isn't much state beyond its visual/positional state,
        // which is handled by the open logic (originalDimensions, isMaximized).
        // If it had, e.g., text in a field, you'd clear it here.
        isMaximized = false; // Reset maximized state
        // Reset originalDimensions to reflect config defaults for next open,
        // or rely on open logic to re-center if no specific position was stored.
        originalDimensions = {
            width: appConfig.defaultWidth,
            height: appConfig.defaultHeight,
            top: '50%', // Assuming initial centering
            left: '50%'
        };
    });

    // --- Minimize window ---
    if (appConfig.minimizable && minimizeButton) {
        minimizeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling to header or window
            appWindowElement.style.display = 'none';
            if (window.manageTaskbar) window.manageTaskbar.setInactive(appWindowElement.id);
        });
    }
    
    // --- Maximize/Restore window ---
    if (appConfig.maximizable && windowHeader) {
        windowHeader.addEventListener('dblclick', (e) => {
            // Ensure not clicking on any button inside the header
            if (e.target.closest('button') || (resizeHandle && e.target === resizeHandle)) return;

            if (isMaximized) {
                // Restore
                appWindowElement.classList.remove('maximized');
                appWindowElement.style.width = originalDimensions.width;
                appWindowElement.style.height = originalDimensions.height;
                appWindowElement.style.top = originalDimensions.top;
                appWindowElement.style.left = originalDimensions.left;
                // Re-apply transform if it was centered, otherwise remove it
                if (originalDimensions.left === '50%') {
                    appWindowElement.style.transform = 'translate(-50%, -50%)';
                } else {
                    appWindowElement.style.transform = 'none';
                }
                isMaximized = false;
            } else {
                // Maximize
                // Store current dimensions before maximizing
                originalDimensions = {
                    width: appWindowElement.style.width,
                    height: appWindowElement.style.height,
                    top: appWindowElement.style.top,
                    left: appWindowElement.style.left
                };
                appWindowElement.classList.add('maximized');
                // Styles for maximized are handled by CSS, but ensure transform is off
                appWindowElement.style.transform = 'none';
                isMaximized = true;
            }
        });
    }

    // --- Draggable window ---
    if (windowHeader) {
        let isDragging = false;
        let dragOffsetX, dragOffsetY;

        windowHeader.addEventListener('mousedown', (e) => {
            // Ensure not clicking on any button inside the header or if maximized
            if (e.target.closest('button') || (resizeHandle && e.target === resizeHandle) || isMaximized) return;
            
            isDragging = true;
            // If window is centered with transform, convert its position to pixels first
            if (appWindowElement.style.transform.includes('translate')) {
                const rect = appWindowElement.getBoundingClientRect(); // Get current visual position
                const parentRect = appWindowElement.parentElement.getBoundingClientRect();
                
                // Set left/top to pixel values based on current visual position
                appWindowElement.style.left = `${rect.left - parentRect.left}px`;
                appWindowElement.style.top = `${rect.top - parentRect.top}px`;
                
                // Now remove the transform
                appWindowElement.style.transform = 'none';
            }
            // Recalculate offset AFTER position and transform have been set
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
                // Store new position for restore
                originalDimensions.left = appWindowElement.style.left;
                originalDimensions.top = appWindowElement.style.top;
            }
        });
    }

    // --- Resizable window ---
    if (appConfig.resizable && resizeHandle) {
        let isResizing = false;
        let resizeInitialX, resizeInitialY, initialWidth, initialHeight;

        resizeHandle.addEventListener('mousedown', (e) => {
            if (isMaximized) return; // Don't resize if maximized
            e.stopPropagation(); // Prevent window drag
            isResizing = true;
            
            resizeInitialX = e.clientX;
            resizeInitialY = e.clientY;
            initialWidth = appWindowElement.offsetWidth;
            initialHeight = appWindowElement.offsetHeight;
            
            // Remove transform for direct sizing if it was centered
            appWindowElement.style.transform = 'none'; 
            // Ensure left/top are set if they were 50% (centered)
            if (appWindowElement.style.left === '50%') {
                appWindowElement.style.left = `${appWindowElement.offsetLeft}px`;
                appWindowElement.style.top = `${appWindowElement.offsetTop}px`;
            }

            document.body.style.cursor = 'nwse-resize'; // Change global cursor
            appWindowElement.style.userSelect = 'none'; // Prevent text selection
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const dx = e.clientX - resizeInitialX;
            const dy = e.clientY - resizeInitialY;
            
            let newWidth = initialWidth + dx;
            let newHeight = initialHeight + dy;

            // Enforce min dimensions (from CSS or define here)
            const minWidth = parseInt(getComputedStyle(appWindowElement).minWidth, 10) || 150;
            const minHeight = parseInt(getComputedStyle(appWindowElement).minHeight, 10) || 100;

            newWidth = Math.max(minWidth, newWidth);
            newHeight = Math.max(minHeight, newHeight);
            
            // Prevent resizing beyond desktop boundaries (optional, can be complex)
            // const desktop = document.getElementById('desktop');
            // if (appWindowElement.offsetLeft + newWidth > desktop.offsetWidth) {
            //     newWidth = desktop.offsetWidth - appWindowElement.offsetLeft;
            // }
            // if (appWindowElement.offsetTop + newHeight > desktop.offsetHeight) {
            //     newHeight = desktop.offsetHeight - appWindowElement.offsetTop;
            // }

            appWindowElement.style.width = `${newWidth}px`;
            appWindowElement.style.height = `${newHeight}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
                appWindowElement.style.userSelect = '';
                // Store new dimensions for restore
                originalDimensions.width = appWindowElement.style.width;
                originalDimensions.height = appWindowElement.style.height;
            }
        });
    }
}
