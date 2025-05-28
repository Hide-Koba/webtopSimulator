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

    // Define the apps to load
    // In a more advanced setup, this could be fetched from a config file or by scanning the /apps directory
    const appsToLoad = [
        { name: 'SampleApp', script: 'apps/sampleApp.js', initFunction: 'initializeSampleApp' }
        // Add more apps here in the future
        // { name: 'AnotherApp', script: 'apps/anotherApp.js', initFunction: 'initializeAnotherApp' }
    ];

    // Load and initialize each app
    appsToLoad.forEach(app => {
        loadScript(app.script, () => {
            if (window[app.initFunction] && typeof window[app.initFunction] === 'function') {
                window[app.initFunction]();
            } else {
                console.error(`Initialization function ${app.initFunction} not found for ${app.name}`);
            }
        });
    });

    // You can add other general desktop functionalities here
    // For example, managing focus between windows, a taskbar, etc.
});
