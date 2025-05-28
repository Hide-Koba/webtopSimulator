class SampleApp extends AppBase {
    constructor(appConfig, appWindowElement) {
        // The AppBase constructor will call super(appConfig, appWindowElement) implicitly if not defined here.
        // However, it's good practice to call it explicitly if you might add constructor logic later.
        super(appConfig, appWindowElement); 
        // If super() is called, it must be the first statement.
        // The AppBase constructor already calls this.onInit(), so specific init logic goes there.
    }

    onInit() {
        // This is called by the AppBase constructor.
        // Add any SampleApp-specific initialization here.
        // For SampleApp, there isn't much beyond what AppBase handles.
        // console.log(`${this.appConfig.name} initialized.`);
        if (!this.isValid) return; // Check if AppBase constructor failed
    }

    onOpen() {
        // Called when the window is opened or restored from taskbar.
        // console.log(`${this.appConfig.name} opened.`);
        if (!this.isValid) return;
    }

    onClose() {
        // Called when the window is closed (X button).
        // Reset any app-specific state here.
        // For SampleApp, AppBase's close method already resets dimensions.
        // console.log(`${this.appConfig.name} closed, state reset.`);
        if (!this.isValid) return;
    }

    // Other AppBase lifecycle methods like onMinimize, onToggleMaximize can be overridden if needed.
}

// Explicitly assign the class to the window object
// so script.js can find it via window[classNameString]
window.SampleApp = SampleApp;
