class NotepadApp extends AppBase {
    constructor(appConfig, appWindowElement) {
        super(appConfig, appWindowElement);
        // Specific NotepadApp properties can be initialized here
        if (this.isValid) {
            this.notepadTextarea = this.appWindowElement.querySelector('.notepad-textarea');
        }
    }

    onInit() {
        // Called by AppBase constructor
        if (!this.isValid) return;
        // console.log(`${this.appConfig.name} initialized.`);
        // Any other specific init logic for Notepad
    }

    onOpen() {
        if (!this.isValid) return;
        // console.log(`${this.appConfig.name} opened.`);
        // If you want to focus the textarea when the app opens:
        // if (this.notepadTextarea) {
        //     this.notepadTextarea.focus();
        // }
    }

    onClose() {
        // Called by AppBase's close method
        if (!this.isValid) return;
        // Reset Notepad specific state
        if (this.notepadTextarea) {
            this.notepadTextarea.value = ''; // Clear text
        }
        // console.log(`${this.appConfig.name} closed and text cleared.`);
    }

    // NotepadApp doesn't have much unique behavior beyond the textarea,
    // so most functionality is handled by AppBase.
}

// Explicitly assign the class to the window object
window.NotepadApp = NotepadApp;
