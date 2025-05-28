document.addEventListener('DOMContentLoaded', () => {
    const taskbar = document.getElementById('taskbar');
    const startButton = document.getElementById('start-button');
    const startMenuPanel = document.getElementById('start-menu-panel');
    const openWindows = new Map(); 
    const appInstances = new Map(); // Stores app instances: { appName: instance }
    let highestZIndex = 100; 

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
            if (existingButton) { // If button exists, just ensure window is visible and front
                appWindowElement.style.display = 'flex';
                window.manageTaskbar.bringToFront(appWindowElement.id);
                return existingButton;
            }

            const button = document.createElement('button');
            button.className = 'taskbar-button';
            button.textContent = appConfig.name;
            button.dataset.appId = appWindowElement.id;
            
            button.addEventListener('click', () => {
                const appInstance = appInstances.get(appConfig.name); // Get the app instance
                if (!appInstance || !appInstance.appWindowElement) return;

                const targetWindow = appInstance.appWindowElement;
                const isHidden = targetWindow.style.display === 'none';

                if (isHidden) {
                    appInstance.open(); // Use app's open method
                } else {
                    if (targetWindow.style.zIndex == highestZIndex -1) { 
                        appInstance.minimize(); 
                    } else {
                        appInstance.focus(); 
                    }
                }
            });
            // Insert before other taskbar buttons, or after start button if it's the first
            const firstAppButton = taskbar.querySelector('.taskbar-button');
            if (firstAppButton) {
                taskbar.insertBefore(button, firstAppButton);
            } else {
                taskbar.appendChild(button);
            }
            
            openWindows.set(appWindowElement.id, { windowElement: appWindowElement, taskbarButton: button, config: appConfig });
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
                window.manageTaskbar.setActive(appWindowId); 
            }
        }
    };

    function populateStartMenu(apps) {
        if (!startMenuPanel) return;
        startMenuPanel.innerHTML = ''; // Clear previous items
        apps.forEach(appConfig => {
            const menuItem = document.createElement('div');
            menuItem.className = 'start-menu-item';
            menuItem.textContent = appConfig.name;
            menuItem.addEventListener('click', () => {
                const appInstance = appInstances.get(appConfig.name);
                if (appInstance) {
                    appInstance.open(); // Call the app's open method
                } else {
                    console.error(`App instance for ${appConfig.name} not found.`);
                    // This case implies an app icon was not clicked first to create the instance.
                    // We might need to simulate an icon click or directly instantiate if not already.
                    // For now, assumes apps are instantiated by clicking their desktop icon first.
                    // To handle direct launch from start menu for non-instantiated apps:
                    const iconToClick = document.getElementById(appConfig.iconId || `${appConfig.name.toLowerCase()}-app-icon`);
                    if (iconToClick) {
                        iconToClick.click(); // Simulate icon click to trigger instantiation and open
                    } else {
                        console.error(`Icon for ${appConfig.name} not found to simulate click.`);
                    }
                }
                startMenuPanel.classList.add('start-menu-hidden'); // Hide menu after click
            });
            startMenuPanel.appendChild(menuItem);
        });
    }

    if (startButton && startMenuPanel) {
        startButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from closing menu immediately if desktop listener is added
            startMenuPanel.classList.toggle('start-menu-hidden');
            if (!startMenuPanel.classList.contains('start-menu-hidden')) {
                 // Optional: bring start menu to a high z-index if it can be overlapped
                 startMenuPanel.style.zIndex = highestZIndex + 100; // Ensure it's above windows
            }
        });
        // Hide start menu if clicking outside
        document.addEventListener('click', (event) => {
            if (!startMenuPanel.classList.contains('start-menu-hidden') && 
                !startMenuPanel.contains(event.target) && 
                event.target !== startButton) {
                startMenuPanel.classList.add('start-menu-hidden');
            }
        });
    }


    async function loadAppsFromConfig() {
        try {
            await new Promise((resolve) => { loadScript('AppBase.js', resolve); });
            const response = await fetch('config.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for config.json`);
            const config = await response.json();

            if (config && config.apps && Array.isArray(config.apps)) {
                populateStartMenu(config.apps); // Populate Start Menu
                const desktopElement = document.getElementById('desktop');
                if (!desktopElement) { console.error('Desktop element not found!'); return; }

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
                                    let titleSpan = windowHeader.querySelector('.window-header-title');
                                    if (!titleSpan) {
                                        const existingTextNode = Array.from(windowHeader.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '');
                                        titleSpan = document.createElement('span');
                                        titleSpan.className = 'window-header-title';
                                        titleSpan.textContent = existingTextNode ? existingTextNode.textContent.trim() : app.name;
                                        if(existingTextNode) existingTextNode.remove();
                                        windowHeader.prepend(titleSpan);
                                    }
                                    windowHeader.appendChild(headerButtonsContainer);
                                }

                                if (app.minimizable) {
                                    const minimizeButton = document.createElement('button');
                                    minimizeButton.className = 'window-header-button minimize-button';
                                    minimizeButton.innerHTML = '&#xE921;'; 
                                    minimizeButton.title = 'Minimize';
                                    // Prepend minimize button before close button if close button exists in container
                                    const closeBtn = headerButtonsContainer.querySelector('.close-button');
                                    if(closeBtn) {
                                        headerButtonsContainer.insertBefore(minimizeButton, closeBtn);
                                    } else {
                                        headerButtonsContainer.appendChild(minimizeButton);
                                    }
                                }
                                
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
                            } else { console.error(`Could not find .window element in ${app.bodyHtml} for ${app.name}.`); }
                        } catch (e) { console.error(`Error processing bodyHtml for ${app.name}:`, e); }
                    }

                    if (app.script && app.initFunction) {
                        loadScript(app.script, () => {
                            const AppClass = window[app.initFunction];
                            if (AppClass && typeof AppClass === 'function' && AppClass.prototype) {
                                try {
                                    const appInstance = new AppClass(app, appWindowElement);
                                    appInstances.set(app.name, appInstance); // Store the instance
                                } catch (e) { console.error(`Error instantiating app ${app.name}:`, e); }
                            } else { console.error(`App class ${app.initFunction} not found for ${app.name}.`); }
                        });
                    }
                }
            } else { console.error('Invalid config.json format.'); }
        } catch (e) { console.error('Error in loadAppsFromConfig:', e); }
    }
    loadAppsFromConfig();
});
