function initializeSampleApp() {
    const sampleAppIcon = document.getElementById('sample-app-icon');
    const sampleAppWindow = document.getElementById('sample-app-window');
    
    // Check if elements exist to prevent errors if HTML is not ready or app is removed
    if (!sampleAppIcon || !sampleAppWindow) {
        // console.warn("Sample App elements not found. App will not initialize.");
        return; 
    }

    const closeButton = sampleAppWindow.querySelector('.close-button');
    const windowHeader = sampleAppWindow.querySelector('.window-header');

    // Open window when icon is clicked
    sampleAppIcon.addEventListener('click', () => {
        sampleAppWindow.style.display = 'flex'; // Use flex to enable column layout
    });

    // Close window when close button is clicked
    closeButton.addEventListener('click', () => {
        sampleAppWindow.style.display = 'none';
    });

    // Make window draggable
    let isDragging = false;
    let offsetX, offsetY;

    windowHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - sampleAppWindow.offsetLeft;
        offsetY = e.clientY - sampleAppWindow.offsetTop;
        sampleAppWindow.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        const desktop = document.getElementById('desktop');
        const maxX = desktop.offsetWidth - sampleAppWindow.offsetWidth;
        const maxY = desktop.offsetHeight - sampleAppWindow.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        sampleAppWindow.style.left = `${newX}px`;
        sampleAppWindow.style.top = `${newY}px`;
        sampleAppWindow.style.transform = 'none'; 
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            sampleAppWindow.style.cursor = 'move';
        }
    });
}

// Initialize the app once the DOM is ready
// We'll call this from the main script.js after loading this file.
// For direct testing, you might use:
// if (document.readyState === 'loading') {
// document.addEventListener('DOMContentLoaded', initializeSampleApp);
// } else {
// initializeSampleApp();
// }
