class NotificationCenterApp extends AppBase {
    constructor(appConfig, appWindowElement) {
        super(appConfig, appWindowElement);
        if (!this.isValid) return;

        this.notificationListElement = WebDesktopLib.DOM.qs('#notification-list', this.appWindowElement);
        this.noNotificationsMessage = WebDesktopLib.DOM.qs('.no-notifications-message', this.notificationListElement);
        this.clearAllButton = WebDesktopLib.DOM.qs('.notification-center-clear-all', this.windowHeader);

        this._bindNotificationCenterEventListeners();
    }

    onInit() {
        if (!this.isValid) return;
        // Subscribe to the global notification event
        WebDesktopLib.EventBus.subscribe('desktopNotification', this._addNotification.bind(this));
        // console.log(`${this.appConfig.name} initialized and subscribed to notifications.`);
    }

    _bindNotificationCenterEventListeners() {
        if (this.clearAllButton) {
            this.clearAllButton.addEventListener('click', () => this._clearAllNotifications());
        }
    }

    _addNotification(notificationData) {
        if (!this.isValid || !this.notificationListElement) return;

        // Remove "no notifications" message if it exists
        if (this.noNotificationsMessage && this.noNotificationsMessage.parentNode === this.notificationListElement) {
            this.notificationListElement.removeChild(this.noNotificationsMessage);
        }

        const item = WebDesktopLib.DOM.createElement('li', { 
            className: `notification-item type-${notificationData.type || 'info'}` 
        });

        const header = WebDesktopLib.DOM.createElement('div', { className: 'notification-item-header' });
        const title = WebDesktopLib.DOM.createElement('span', { 
            className: 'notification-title', 
            textContent: notificationData.title || 'Notification' 
        });
        header.appendChild(title);

        if (notificationData.appName) {
            const appNameSpan = WebDesktopLib.DOM.createElement('span', {
                className: 'notification-app-name',
                textContent: `from ${notificationData.appName}`
            });
            header.appendChild(appNameSpan);
        }
        item.appendChild(header);

        if (notificationData.message) {
            const message = WebDesktopLib.DOM.createElement('p', { 
                className: 'notification-message', 
                textContent: notificationData.message 
            });
            item.appendChild(message);
        }

        const timestamp = WebDesktopLib.DOM.createElement('div', {
            className: 'notification-timestamp',
            textContent: new Date().toLocaleTimeString()
        });
        item.appendChild(timestamp);

        this.notificationListElement.prepend(item); // Add new notifications to the top
    }

    _clearAllNotifications() {
        if (!this.isValid || !this.notificationListElement) return;
        WebDesktopLib.DOM.empty(this.notificationListElement); // Use lib's empty function
        
        // Re-add the "no notifications" message
        this.noNotificationsMessage = WebDesktopLib.DOM.createElement('li', {
            className: 'no-notifications-message',
            textContent: 'No new notifications.'
        });
        this.notificationListElement.appendChild(this.noNotificationsMessage);
    }

    onClose() {
        // Optional: Decide if notifications should persist if the window is closed and reopened,
        // or if they should be cleared. For now, they persist in the DOM until cleared.
        // If we want to clear them: this._clearAllNotifications();
        // console.log(`${this.appConfig.name} closed.`);
    }
}

window.NotificationCenterApp = NotificationCenterApp;
