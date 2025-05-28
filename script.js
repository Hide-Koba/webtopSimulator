document.addEventListener('DOMContentLoaded', () => {
    const taskbar = document.getElementById('taskbar');
    const openWindows = new Map(); // To keep track of app windows and their taskbar buttons
    let highestZIndex = 100; // Starting z-index for windows

    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => callback && callback();
        script.onerror = () => console.error(`Error loading script: ${src}`);
        document.head.appendChild(script);
    }

    function loadCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = href;
        link.onerror = () => console.error(`Error loading CSS: ${href}`);
        document.head.appendChild(link);
    }

    function fetchAndInjectHTML(url, targetElement) {
        return fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${url}`);
                return response.text();
            })
            .then(html => targetElement.insertAdjacentHTML('beforeend', html))
            .catch(error => {
                console.error(`Error fetching or injecting HTML from ${url}:`, error);
                return Promise.reject(error);
            });
    }
    
    window.manageTaskbar = {
        add: (appConfig, appWindowElement) => {
            if (!taskbar) return;
            const existingButton = taskbar.querySelector(`[data-app-id="${appWindowElement.id}"]`);
            if (existingButton) return existingButton; // Already exists

            const button = document.createElement('button');
            button.className = 'taskbar-button';
            button.textContent = appConfig.name;
            button.dataset.appId = appWindowElement.id;
            
            button.addEventListener('click', () => {
                const isHidden = appWindowElement.style.display === 'none';
                if (isHidden) {
                    appWindowElement.style.display = 'flex';
                    window.manageTaskbar.bringToFront(appWindowElement.id);
                } else {
                    if (appWindowElement.style.zIndex == highestZIndex -1) { // If it's already the top-most visible window
                         appWindowElement.style.display = 'none';
                         window.manageTaskbar.setInactive(appWindowElement.id);
                    } else { // If it's not the top-most, bring it to front
                        window.manageTaskbar.bringToFront(appWindowElement.id);
                    }
                }
            });
            taskbar.appendChild(button);
            openWindows.set(appWindowElement.id, { windowElement: appWindowElement, taskbarButton: button, config: appConfig });
            // Set initial z-index when added
            appWindowElement.style.zIndex = highestZIndex++;
            window.manageTaskbar.setActive(appWindowElement.id);
            return button;
        },
        remove: (appWindowId) => {
            const appData = openWindows.get(appWindowId);
            if (appData && appData.taskbarButton) {
                appData.taskbarButton.remove();
            }
            openWindows.delete(appWindowId);
        },
        setActive: (appWindowId) => {
            taskbar.querySelectorAll('.taskbar-button.active').forEach(b => b.classList.remove('active'));
            const appData = openWindows.get(appWindowId);
            if (appData && appData.taskbarButton) {
                appData.taskbarButton.classList.add('active');
            }
        },
        setInactive: (appWindowId) => {
             const appData = openWindows.get(appWindowId);
            if (appData && appData.taskbarButton) {
                appData.taskbarButton.classList.remove('active');
            }
        },
        bringToFront: (appWindowId) => {
            const appData = openWindows.get(appWindowId);
            if (appData && appData.windowElement) {
                appData.windowElement.style.zIndex = highestZIndex++;
                window.manageTaskbar.setActive(appWindowId); // Also set its taskbar button as active
            }
        }
    };


    async function loadAppsFromConfig() {
        try {
            const response = await fetch('config.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for config.json`);
            const config = await response.json();

            if (config && config.apps && Array.isArray(config.apps)) {
                const desktopElement = document.getElementById('desktop');
                if (!desktopElement) {
                    console.error('Desktop element not found!');
                    return;
                }

                for (const app of config.apps) {
                    if (app.css) loadCSS(app.css);
                    if (app.iconHtml) await fetchAndInjectHTML(app.iconHtml, desktopElement).catch(e => console.error(e));
                    
                    let appWindowElement = null;
                    if (app.bodyHtml) {
                        const tempDiv = document.createElement('div');
                        try {
                            const htmlContent = await fetch(app.bodyHtml).then(res => {
                                if (!res.ok) throw new Error(`Fetch failed for ${app.bodyHtml}: ${res.status}`);
                                return res.text();
                            });
                            tempDiv.innerHTML = htmlContent;
                            appWindowElement = tempDiv.querySelector('.window') || (tempDiv.firstElementChild?.classList.contains('window') ? tempDiv.firstElementChild : null);

                            if (appWindowElement) {
                                if (app.defaultWidth) appWindowElement.style.width = app.defaultWidth;
                                if (app.defaultHeight) appWindowElement.style.height = app.defaultHeight;
                                
                                const windowHeader = appWindowElement.querySelector('.window-header');
                                const headerButtonsContainer = windowHeader?.querySelector('.window-header-buttons') || document.createElement('div');
                                if (!headerButtonsContainer.classList.contains('window-header-buttons')) {
                                    headerButtonsContainer.className = 'window-header-buttons';
                                    // Ensure title span exists if we are creating the buttons container
                                    let titleSpan = windowHeader.querySelector('.window-header-title');
                                    if (!titleSpan) {
                                        const existingText = Array.from(windowHeader.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '');
                                        titleSpan = document.createElement('span');
                                        titleSpan.className = 'window-header-title';
                                        titleSpan.textContent = existingText ? existingText.textContent.trim() : app.name;
                                        if(existingText) existingText.remove(); // remove original text node
                                        windowHeader.prepend(titleSpan); // Add title at the beginning
                                    }
                                    windowHeader.appendChild(headerButtonsContainer);
                                }


                                if (app.minimizable) {
                                    const minimizeButton = document.createElement('button');
                                    minimizeButton.className = 'window-header-button minimize-button';
                                    minimizeButton.innerHTML = '&#xE921;'; // Minimize icon (Segoe MDL2 Assets) or use text like "_"
                                    minimizeButton.title = 'Minimize';
                                    headerButtonsContainer.appendChild(minimizeButton); // Appends to existing buttons or new container
                                }
                                
                                // Ensure close button is also in this container if it exists
                                const closeButton = appWindowElement.querySelector('.close-button');
                                if (closeButton && closeButton.parentElement !== headerButtonsContainer) {
                                     headerButtonsContainer.appendChild(closeButton);
                                }


                                desktopElement.appendChild(appWindowElement);
                                if (app.resizable) {
                                    const resizeHandle = document.createElement('div');
                                    resizeHandle.className = 'window-resize-handle';
                                    appWindowElement.appendChild(resizeHandle);
                                }
                            } else {
                                console.error(`Could not find .window element in ${app.bodyHtml} for ${app.name}.`);
                            }
                        } catch (e) {
                            console.error(`Error processing bodyHtml for ${app.name}:`, e);
                        }
                    }

                    if (app.script && app.initFunction) {
                        loadScript(app.script, () => {
                            if (window[app.initFunction]) {
                                window[app.initFunction](app, appWindowElement);
                            } else {
                                console.error(`Init function ${app.initFunction} not found for ${app.name}.`);
                            }
                        });
                    }
                }
            } else {
                console.error('Invalid config.json format.');
            }
        } catch (e) {
            console.error('Error in loadAppsFromConfig:', e);
        }
    }

    loadAppsFromConfig();
});
