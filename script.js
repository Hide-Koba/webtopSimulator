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
            });
    }

    // Function to fetch app configuration and then load apps
    async function loadAppsFromConfig() {
        try {
            const response = await fetch('config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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

                    // Load HTML for icon and body
                    if (app.iconHtml) {
                        await fetchAndInjectHTML(app.iconHtml, desktopElement);
                    }
                    if (app.bodyHtml) {
                        await fetchAndInjectHTML(app.bodyHtml, desktopElement);
                    }

                    // Then load the script and initialize
                    loadScript(app.script, () => {
                        if (window[app.initFunction] && typeof window[app.initFunction] === 'function') {
                            window[app.initFunction]();
                        } else {
                            console.error(`Initialization function ${app.initFunction} not found for ${app.name}`);
                        }
                    });
                }
            } else {
                console.error('Invalid config.json format.');
            }
        } catch (error) {
            console.error('Error loading or parsing config.json:', error);
        }
    }

    // Start loading apps
    loadAppsFromConfig();

    // You can add other general desktop functionalities here
    // For example, managing focus between windows, a taskbar, etc.
    // --- Core Desktop API Functions can be added below if needed by multiple apps ---
});
