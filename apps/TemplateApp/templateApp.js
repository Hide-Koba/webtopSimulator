/**
 * apps/TemplateApp/templateApp.js
 * 
 * This is a template application class that extends AppBase.
 * It demonstrates how to structure an application and utilize the AppBase functionalities.
 * Developers can copy this folder ("TemplateApp") and rename/modify its contents 
 * to create new applications for the web desktop.
 */
class TemplateApp extends AppBase {
    /**
     * Constructor for TemplateApp.
     * @param {object} appConfig - The application's configuration object from config.json.
     * @param {HTMLElement} appWindowElement - The DOM element for this app's main window.
     */
    constructor(appConfig, appWindowElement) {
        // Call the constructor of the parent class (AppBase).
        // This initializes common window properties and binds core event listeners.
        super(appConfig, appWindowElement);

        // Check if AppBase initialization was successful (e.g., elements found).
        if (!this.isValid) {
            return; // Stop further initialization if AppBase failed.
        }

        // Get references to specific UI elements within this app's window content.
        // These elements are defined in apps/TemplateApp/appbody.html.
        this.actionButton = this.appWindowElement.querySelector('.template-app-button');
        this.messageParagraph = this.appWindowElement.querySelector('#template-app-message');

        // Bind event listeners for app-specific UI elements.
        this._bindTemplateEventListeners();
    }

    /**
     * AppBase lifecycle hook: Called at the end of the AppBase constructor.
     * Use this for any initialization logic specific to TemplateApp that needs to run
     * after AppBase has set up the basic window.
     */
    onInit() {
        if (!this.isValid) return; // Ensure AppBase initialized correctly.

        // console.log(`TemplateApp (${this.appConfig.name}): Initialized.`);
        // Example: Set an initial message.
        if (this.messageParagraph) {
            this.messageParagraph.textContent = 'TemplateApp is ready. Click the button!';
        }
    }

    /**
     * AppBase lifecycle hook: Called when the window is opened or restored from the taskbar.
     */
    onOpen() {
        if (!this.isValid) return;
        // console.log(`TemplateApp (${this.appConfig.name}): Window opened.`);
        // Example: Focus a specific element when the app opens.
        // if (this.actionButton) {
        //     this.actionButton.focus();
        // }
    }

    /**
     * AppBase lifecycle hook: Called when the window is closed using the 'X' button.
     * Use this to reset any app-specific state to ensure a "fresh" open next time.
     * AppBase's close() method already handles hiding the window and resetting general state.
     */
    onClose() {
        if (!this.isValid) return;
        // console.log(`TemplateApp (${this.appConfig.name}): Window closed. Resetting app-specific state.`);
        // Example: Reset the message paragraph.
        if (this.messageParagraph) {
            this.messageParagraph.textContent = 'TemplateApp is ready. Click the button!';
        }
        // Any other app-specific cleanup (e.g., clearing intervals, revoking object URLs).
    }

    /**
     * AppBase lifecycle hook: Called when the window is minimized.
     */
    onMinimize() {
        if (!this.isValid) return;
        // console.log(`TemplateApp (${this.appConfig.name}): Window minimized.`);
    }

    /**
     * AppBase lifecycle hook: Called after the window is maximized or restored.
     * @param {boolean} isNowMaximized - True if the window was just maximized, false if restored.
     */
    onToggleMaximize(isNowMaximized) {
        if (!this.isValid) return;
        // console.log(`TemplateApp (${this.appConfig.name}): Maximized state changed to: ${isNowMaximized}`);
        // Example: Adjust layout or content based on maximized state.
    }

    /**
     * Binds event listeners for UI elements specific to TemplateApp.
     * This is a private helper method for organizing event bindings.
     */
    _bindTemplateEventListeners() {
        if (this.actionButton) {
            this.actionButton.addEventListener('click', () => this.performAction());
        }
    }

    /**
     * An example of an app-specific method.
     * Called when the "Click Me!" button in this app is clicked.
     */
    performAction() {
        if (!this.isValid) return;
        const timestamp = new Date().toLocaleTimeString();
        if (this.messageParagraph) {
            this.messageParagraph.textContent = `Button clicked at: ${timestamp}`;
        }
        console.log(`TemplateApp (${this.appConfig.name}): Action button clicked.`);
    }
}

// Explicitly assign the class to the window object so that script.js can find it
// using window[classNameString] lookup, where classNameString is taken from 
// the 'initFunction' property in config.json.
window.TemplateApp = TemplateApp;
