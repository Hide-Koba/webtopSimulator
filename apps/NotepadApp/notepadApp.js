function initializeNotepadApp() {
    const notepadAppIcon = document.getElementById('notepad-app-icon');
    const notepadAppWindow = document.getElementById('notepad-app-window');

    if (!notepadAppIcon || !notepadAppWindow) {
        // console.warn("Notepad App elements not found. App will not initialize.");
        return;
    }

    const closeButton = notepadAppWindow.querySelector('.close-button');
    const windowHeader = notepadAppWindow.querySelector('.window-header');
    // const notepadTextarea = notepadAppWindow.querySelector('.notepad-textarea'); // Not directly used for open/close/drag

    // Open window when icon is clicked
    notepadAppIcon.addEventListener('click', () => {
        notepadAppWindow.style.display = 'flex';
    });

    // Close window when close button is clicked
    closeButton.addEventListener('click', () => {
        notepadAppWindow.style.display = 'none';
    });

    // Make window draggable
    let isDragging = false;
    let offsetX, offsetY;

    windowHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - notepadAppWindow.offsetLeft;
        offsetY = e.clientY - notepadAppWindow.offsetTop;
        notepadAppWindow.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        const desktop = document.getElementById('desktop');
        const maxX = desktop.offsetWidth - notepadAppWindow.offsetWidth;
        const maxY = desktop.offsetHeight - notepadAppWindow.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        notepadAppWindow.style.left = `${newX}px`;
        notepadAppWindow.style.top = `${newY}px`;
        notepadAppWindow.style.transform = 'none';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            notepadAppWindow.style.cursor = 'move';
        }
    });
}
