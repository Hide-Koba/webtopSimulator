document.addEventListener('DOMContentLoaded', () => {
    // Function to dynamically load a script
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            if (callback) callback();
        };
        script.onerror = () => {
            console.error(`Error loading script: ${src}`);
        };
        document.head.appendChild(script);
    }

    // Function to dynamically load a CSS file
    function loadCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = href;
        link.onerror = () => {
            console.error(`Error loading CSS: ${href}`);
        };
        document.head.appendChild(link);
    }

    // Function to fetch HTML content and inject it into the DOM
    function fetchAndInjectHTML(url, targetElement) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for ${url}`);
                }
                return response.text();
            })
            .then(html => {
                targetElement.insertAdjacentHTML('beforeend', html);
            })
            .catch(error => {
                console.error(`Error fetching or injecting HTML from ${url}:`, error);
                return Promise.reject(error); // Propagate error to stop further processing if critical
            });
    }

    // Function to fetch app configuration and then load apps
    async function loadAppsFromConfig() {
        try {
            const response = await fetch('config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for config.json`);
            }
            const config = await response.json();

            if (config && config.apps && Array.isArray(config.apps)) {
                const desktopElement = document.getElementById('desktop');
                if (!desktopElement) {
                    console.error('Desktop element not found!');
                    return;
                }

                for (const app of config.apps) {
                    // Load app-specific CSS first
                    if (app.css) {
                        loadCSS(app.css);
                    }

                    // Load HTML for icon
                    if (app.iconHtml) {
                        try {
                            await fetchAndInjectHTML(app.iconHtml, desktopElement);
                        } catch (iconError) {
                            console.error(`Failed to load icon HTML for ${app.name}:`, iconError);
                            // Decide if to continue or skip app
                        }
                    }
                    
                    let appWindowElement = null;
                    // Load HTML for body, set size, and add resize handle
                    if (app.bodyHtml) {
                        const tempDiv = document.createElement('div');
                        try {
                            const htmlContent = await fetch(app.bodyHtml).then(res => {
                                if (!res.ok) throw new Error(`Failed to fetch ${app.bodyHtml}: ${res.status} ${res.statusText}`);
                                return res.text();
                            });
                            tempDiv.innerHTML = htmlContent;
                            // Ensure we get the actual window element, not a wrapper if innerHTML creates one.
                            appWindowElement = tempDiv.querySelector('.window') || (tempDiv.firstElementChild && tempDiv.firstElementChild.classList.contains('window') ? tempDiv.firstElementChild : null);


                            if (appWindowElement) {
                                if (app.defaultWidth) appWindowElement.style.width = app.defaultWidth;
                                if (app.defaultHeight) appWindowElement.style.height = app.defaultHeight;
                                
                                desktopElement.appendChild(appWindowElement);

                                if (app.resizable) {
                                    const resizeHandle = document.createElement('div');
                                    resizeHandle.className = 'window-resize-handle';
                                    appWindowElement.appendChild(resizeHandle);
                                }
                            } else {
                                console.error(`Could not find a valid .window element in ${app.bodyHtml} for ${app.name}. Content loaded into tempDiv:`, tempDiv.innerHTML);
                            }
                        } catch (fetchHtmlError) {
                            console.error(`Error fetching or processing bodyHtml for ${app.name} from ${app.bodyHtml}:`, fetchHtmlError);
                        }
                    }

                    // Then load the script and initialize, passing the app config and the window DOM element
                    if (app.script && app.initFunction) {
                        loadScript(app.script, () => {
                            if (window[app.initFunction] && typeof window[app.initFunction] === 'function') {
                                // Pass the app config object and the window DOM element to the init function
                                window[app.initFunction](app, appWindowElement); 
                            } else {
                                console.error(`Initialization function ${app.initFunction} not found for ${app.name}`);
                            }
                        });
                    }
                }
            } else {
                console.error('Invalid config.json format or no apps array found.');
            }
        } catch (error) {
            console.error('Error in loadAppsFromConfig:', error);
        }
    }

    // Start loading apps
    loadAppsFromConfig();

    // You can add other general desktop functionalities here
    // For example, managing focus between windows, a taskbar, etc.
    // --- Core Desktop API Functions can be added below if needed by multiple apps ---
});
