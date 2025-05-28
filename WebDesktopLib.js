/**
 * WebDesktopLib.js
 * A supporting library for the Web Desktop environment.
 */
const WebDesktopLib = (() => {
    // --- Private state for the library ---
    let _taskbarElement = null;
    let _openWindowsMap = new Map(); 
    let _highestZIndex = 100;      
    let _appInstancesMap = new Map(); 

    // --- DOM Utilities ---
    const DOM = {
        qs: (selector, parent = document) => parent.querySelector(selector),
        qsa: (selector, parent = document) => parent.querySelectorAll(selector),
        createElement: (tagName, attributes = {}, children = []) => {
            const element = document.createElement(tagName);
            for (const key in attributes) {
                if (key === 'className') {
                    element.className = attributes[key];
                } else if (key === 'textContent' || key === 'innerHTML') {
                    element[key] = attributes[key];
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            }
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });
            return element;
        },
        empty: (element) => {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        },
    };

    // --- Taskbar Manager ---
    const Taskbar = {
        init: (taskbarDomElement, appInstancesRef) => {
            _taskbarElement = taskbarDomElement;
            _appInstancesMap = appInstancesRef; 
        },
        add: (appConfig, appWindowElement) => {
            if (!_taskbarElement) return null;
            const existingButton = DOM.qs(`[data-app-id="${appWindowElement.id}"]`, _taskbarElement);
            if (existingButton) {
                appWindowElement.style.display = 'flex';
                Taskbar.bringToFront(appWindowElement.id);
                return existingButton;
            }
            const button = DOM.createElement('button', {
                className: 'taskbar-button',
                textContent: appConfig.name,
                'data-app-id': appWindowElement.id
            });
            button.addEventListener('click', () => {
                const appInstance = _appInstancesMap.get(appConfig.name);
                if (!appInstance || !appInstance.appWindowElement) return;
                const targetWindow = appInstance.appWindowElement;
                if (targetWindow.style.display === 'none') {
                    appInstance.open(); 
                } else {
                    if (targetWindow.style.zIndex == _highestZIndex - 1) { // Using direct _highestZIndex comparison
                        appInstance.minimize();
                    } else {
                        appInstance.focus();
                    }
                }
            });
            const firstAppButton = DOM.qs('.taskbar-button', _taskbarElement);
            if (firstAppButton) {
                _taskbarElement.insertBefore(button, firstAppButton);
            } else {
                _taskbarElement.appendChild(button);
            }
            _openWindowsMap.set(appWindowElement.id, { windowElement: appWindowElement, taskbarButton: button, config: appConfig });
            appWindowElement.style.zIndex = _highestZIndex++;
            Taskbar.setActive(appWindowElement.id);
            return button;
        },
        remove: (appWindowId) => {
            const appData = _openWindowsMap.get(appWindowId);
            if (appData && appData.taskbarButton) appData.taskbarButton.remove();
            _openWindowsMap.delete(appWindowId);
        },
        setActive: (appWindowId) => {
            if (!_taskbarElement) return;
            DOM.qsa('.taskbar-button.active', _taskbarElement).forEach(b => b.classList.remove('active'));
            const appData = _openWindowsMap.get(appWindowId);
            if (appData && appData.taskbarButton) appData.taskbarButton.classList.add('active');
        },
        setInactive: (appWindowId) => {
            const appData = _openWindowsMap.get(appWindowId);
            if (appData && appData.taskbarButton) appData.taskbarButton.classList.remove('active');
        },
        bringToFront: (appWindowId) => {
            const appData = _openWindowsMap.get(appWindowId);
            if (appData && appData.windowElement) {
                appData.windowElement.style.zIndex = _highestZIndex++;
                Taskbar.setActive(appWindowId);
            }
        },
        getHighestZIndex: () => _highestZIndex,
        // incrementZIndex: () => _highestZIndex++ // Not strictly needed if bringToFront handles it
    };

    // --- Storage Manager ---
    const Storage = {
        local: {
            set: (key, value) => {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                } catch (e) {
                    console.error("Error saving to localStorage:", e);
                }
            },
            get: (key, defaultValue = null) => {
                try {
                    const value = localStorage.getItem(key);
                    return value ? JSON.parse(value) : defaultValue;
                } catch (e) {
                    console.error("Error reading from localStorage:", e);
                    return defaultValue;
                }
            },
            remove: (key) => localStorage.removeItem(key),
            clear: () => localStorage.clear()
        },
        indexedDB: {
            // DB_NAME and DB_VERSION are app-level concerns for now, or could be global if shared
            _openDB: (dbName, version, onUpgradeNeeded) => {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open(dbName, version);
                    request.onerror = (event) => reject("IndexedDB error: " + event.target.errorCode);
                    request.onsuccess = (event) => resolve(event.target.result);
                    if (typeof onUpgradeNeeded === 'function') {
                        request.onupgradeneeded = onUpgradeNeeded;
                    }
                });
            },
            get: async (dbName, version, storeName, key, onUpgradeNeeded) => {
                const db = await Storage.indexedDB._openDB(dbName, version, onUpgradeNeeded);
                return new Promise((resolve, reject) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        // This case should ideally be handled by onUpgradeNeeded creating the store
                        console.warn(`Store ${storeName} not found in ${dbName}. Returning undefined.`);
                        db.close();
                        resolve(undefined); 
                        return;
                    }
                    const transaction = db.transaction([storeName], 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.get(key);
                    request.onerror = (event) => reject("IndexedDB get error: " + event.target.errorCode);
                    request.onsuccess = (event) => resolve(event.target.result);
                    transaction.oncomplete = () => db.close();
                });
            },
            set: async (dbName, version, storeName, key, value, onUpgradeNeeded) => {
                const db = await Storage.indexedDB._openDB(dbName, version, onUpgradeNeeded);
                return new Promise((resolve, reject) => {
                     if (!db.objectStoreNames.contains(storeName)) {
                        console.error(`Store ${storeName} not found in ${dbName}. Cannot set value. Please ensure onupgradeneeded creates it.`);
                        db.close();
                        reject(new Error(`Store ${storeName} not found.`));
                        return;
                    }
                    const transaction = db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.put(value, key);
                    request.onerror = (event) => reject("IndexedDB set error: " + event.target.errorCode);
                    request.onsuccess = (event) => resolve(event.target.result);
                    transaction.oncomplete = () => db.close();
                });
            },
            delete: async (dbName, version, storeName, key, onUpgradeNeeded) => {
                const db = await Storage.indexedDB._openDB(dbName, version, onUpgradeNeeded);
                return new Promise((resolve, reject) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.close(); resolve(false); return; // Or reject
                    }
                    const transaction = db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.delete(key);
                    request.onerror = (event) => reject("IndexedDB delete error: " + event.target.errorCode);
                    request.onsuccess = (event) => resolve(true);
                    transaction.oncomplete = () => db.close();
                });
            },
            clear: async (dbName, version, storeName, onUpgradeNeeded) => {
                 const db = await Storage.indexedDB._openDB(dbName, version, onUpgradeNeeded);
                return new Promise((resolve, reject) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                         db.close(); resolve(false); return; // Or reject
                    }
                    const transaction = db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.clear();
                    request.onerror = (event) => reject("IndexedDB clear error: " + event.target.errorCode);
                    request.onsuccess = (event) => resolve(true);
                    transaction.oncomplete = () => db.close();
                });
            }
        }
    };

    // --- Event Bus ---
    const EventBus = (() => {
        const events = {}; // Store event listeners: { eventName: [callback1, callback2, ...] }

        function subscribe(eventName, callback) {
            if (!events[eventName]) {
                events[eventName] = [];
            }
            events[eventName].push(callback);
        }

        function unsubscribe(eventName, callback) {
            if (!events[eventName]) return;

            events[eventName] = events[eventName].filter(cb => cb !== callback);
            if (events[eventName].length === 0) {
                delete events[eventName];
            }
        }

        function publish(eventName, data) {
            if (!events[eventName]) return;

            // Call a copy of the callbacks array in case a callback unsubscribes itself
            [...events[eventName]].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`Error in EventBus callback for event "${eventName}":`, e);
                }
            });
        }

        return {
            subscribe,
            unsubscribe,
            publish
        };
    })();

    // Public API of the library
    return {
        DOM,
        Taskbar,
        Storage,
        EventBus
        // Other modules like UI will be added here
    };
})();
