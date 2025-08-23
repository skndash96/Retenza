// Service Worker Registration Script
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw-standalone.js', {
            scope: '/'
        }).then(function (registration) {
            console.log('SW registered: ', registration);

            // Check for updates
            registration.addEventListener('updatefound', function () {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', function () {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New content is available, show update notification
                        if (confirm('New version available! Reload to update?')) {
                            window.location.reload();
                        }
                    }
                });
            });
        }).catch(function (registrationError) {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

// Push notification permission request
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

// Expose to global scope
window.requestNotificationPermission = requestNotificationPermission; 