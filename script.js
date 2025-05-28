document.addEventListener('DOMContentLoaded', () => {
    const taskbarDOMElement = document.getElementById('taskbar'); // Renamed to avoid conflict
    const startButton = document.getElementById('start-button');
    const startMenuPanel = document.getElementById('start-menu-panel');
    // const openWindows = new Map(); // Now managed by WebDesktopLib.Taskbar
    const appInstances = new Map(); 
    // let highestZIndex = 100; // Now managed by WebDesktopLib.Taskbar

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
    
    // Old window.manageTaskbar logic is removed as it's now in WebDesktopLib.js

    function populateStartMenu(apps) {
        if (!startMenuPanel) return;
        WebDesktopLib.DOM.empty(startMenuPanel); // Use lib's DOM helper
        apps.forEach(appConfig => {
            const menuItem = WebDesktopLib.DOM.createElement('div', {
                className: 'start-menu-item',
                textContent: appConfig.name
            });
            menuItem.addEventListener('click', () => {
                const appInstance = appInstances.get(appConfig.name);
                if (appInstance) {
                    appInstance.open(); 
                } else {
                    const iconToClick = document.getElementById(appConfig.iconId || `${appConfig.name.toLowerCase()}-app-icon`);
                    if (iconToClick) {
                        iconToClick.click(); 
                    } else {
                        console.error(`Icon for ${appConfig.name} not found.`);
                    }
                }
                startMenuPanel.classList.add('start-menu-hidden');
            });
            startMenuPanel.appendChild(menuItem);
        });
    }

    if (startButton && startMenuPanel) {
        startButton.addEventListener('click', (event) => {
            event.stopPropagation(); 
            startMenuPanel.classList.toggle('start-menu-hidden');
            if (!startMenuPanel.classList.contains('start-menu-hidden')) {
                 startMenuPanel.style.zIndex = WebDesktopLib.Taskbar.getHighestZIndex() + 100; 
            }
        });
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
            // Load WebDesktopLib.js first
            await new Promise((resolve) => { loadScript('WebDesktopLib.js', resolve); });
            // Then load AppBase.js
            await new Promise((resolve) => { loadScript('AppBase.js', resolve); });

            // Initialize Taskbar Manager from the library
            if (taskbarDOMElement && WebDesktopLib.Taskbar) {
                WebDesktopLib.Taskbar.init(taskbarDOMElement, appInstances);
            } else {
                console.error("Taskbar DOM element or WebDesktopLib.Taskbar not found for init.");
            }

            const response = await fetch('config.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for config.json`);
            const config = await response.json();

            if (config && config.apps && Array.isArray(config.apps)) {
                populateStartMenu(config.apps); 
                const desktopElement = document.getElementById('desktop');
                if (!desktopElement) { console.error('Desktop element not found!'); return; }

                for (const app of config.apps) {
                    if (app.css) loadCSS(app.css);
                    if (app.iconHtml) await fetchAndInjectHTML(app.iconHtml, desktopElement).catch(e => console.error(e));
                    
                    let appWindowElement = null;
                    if (app.bodyHtml) {
                        const tempDiv = WebDesktopLib.DOM.createElement('div'); // Use lib
                        try {
                            const htmlContent = await fetch(app.bodyHtml).then(res => {
                                if (!res.ok) throw new Error(`Fetch failed for ${app.bodyHtml}: ${res.status}`);
                                return res.text();
                            });
                            tempDiv.innerHTML = htmlContent;
                            appWindowElement = WebDesktopLib.DOM.qs('.window', tempDiv) || (tempDiv.firstElementChild?.classList.contains('window') ? tempDiv.firstElementChild : null);

                            if (appWindowElement) {
                                if (app.defaultWidth) appWindowElement.style.width = app.defaultWidth;
                                if (app.defaultHeight) appWindowElement.style.height = app.defaultHeight;
                                
                                const windowHeader = WebDesktopLib.DOM.qs('.window-header', appWindowElement);
                                let headerButtonsContainer = WebDesktopLib.DOM.qs('.window-header-buttons', windowHeader);
                                if (!headerButtonsContainer && windowHeader) { // Ensure windowHeader exists
                                    headerButtonsContainer = WebDesktopLib.DOM.createElement('div', {className: 'window-header-buttons'});
                                    let titleSpan = WebDesktopLib.DOM.qs('.window-header-title', windowHeader);
                                    if (!titleSpan) {
                                        const existingTextNode = Array.from(windowHeader.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '');
                                        titleSpan = WebDesktopLib.DOM.createElement('span', {
                                            className: 'window-header-title',
                                            textContent: existingTextNode ? existingTextNode.textContent.trim() : app.name
                                        });
                                        if(existingTextNode) existingTextNode.remove();
                                        windowHeader.prepend(titleSpan);
                                    }
                                    windowHeader.appendChild(headerButtonsContainer);
                                }

                                if (app.minimizable && headerButtonsContainer) {
                                    const minimizeButton = WebDesktopLib.DOM.createElement('button', {
                                        className: 'window-header-button minimize-button',
                                        innerHTML: '&#xE921;',
                                        title: 'Minimize'
                                    });
                                    const closeBtn = WebDesktopLib.DOM.qs('.close-button', headerButtonsContainer);
                                    if(closeBtn) {
                                        headerButtonsContainer.insertBefore(minimizeButton, closeBtn);
                                    } else {
                                        headerButtonsContainer.appendChild(minimizeButton);
                                    }
                                }
                                
                                const closeButton = WebDesktopLib.DOM.qs('.close-button', appWindowElement);
                                if (closeButton && headerButtonsContainer && closeButton.parentElement !== headerButtonsContainer) {
                                     headerButtonsContainer.appendChild(closeButton);
                                }
                                desktopElement.appendChild(appWindowElement);
                                if (app.resizable) {
                                    const resizeHandle = WebDesktopLib.DOM.createElement('div', {className: 'window-resize-handle'});
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
                                    appInstances.set(app.name, appInstance); 
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
