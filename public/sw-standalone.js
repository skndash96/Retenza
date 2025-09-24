// Standalone Service Worker for Retenza PWA
// This handles both caching and push notifications

// Increment this version to invalidate old caches
const version = 2

const CACHE_NAME = `retenza-${version.toString}`;
const STATIC_CACHE = `retenza-static-v${version.toString()}`;
const DYNAMIC_CACHE = `retenza-dynamic-v${version.toString()}`;
const NOTIFICATION_CACHE = `retenza-notifications-v${version.toString()}`;

// Install event - cache static assets
self.addEventListener('install', function (event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return cache.addAll([
        '/icon-192.png',
        '/icon-512.png',
        '/manifest.json'
      ]);
    }).then(() => {
      console.log('Static assets cached');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function (event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== NOTIFICATION_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle caching strategy
self.addEventListener('fetch', function (event) {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/')) {
    // Network first for dynamic content
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  } else if (url.pathname.startsWith('/static/')) {
    // Cache first for static content
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request);
      })
    );
  } else {
    // Default: network first
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
  }
});

// Push event handling for notifications
self.addEventListener('push', function (event) {
  console.log('Push event received:', event);
  console.log('Push data:', event.data);

  if (event.data) {
    try {
      let data;

      // Try to parse as JSON first
      try {
        data = event.data.json();
        console.log('Push data parsed as JSON:', data);
      } catch (jsonError) {
        console.log('JSON parsing failed, trying text:', jsonError);
        // If JSON parsing fails, try to get as text
        try {
          const textData = event.data.text();
          console.log('Push data as text:', textData);

          // Try to parse the text as JSON
          data = JSON.parse(textData);
          console.log('Push data parsed from text:', data);
        } catch (textError) {
          console.log('Text parsing failed:', textError);
          console.log('Push data as raw:', event.data);

          // Create a fallback data structure
          data = {
            title: 'Retenza Notification',
            body: 'You have a new notification',
            tag: 'fallback',
            data: {}
          };
        }
      }

      const options = {
        body: data.body || 'New notification from Retenza',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: data.tag || 'default',
        data: data.data || {},
        requireInteraction: data.requireInteraction || false,
        renotify: data.renotify || false,
        actions: data.actions || [
          { action: 'view', title: 'View', icon: '/icon-192.png' },
          { action: 'dismiss', title: 'Dismiss' }
        ],
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
        silent: false,
        // Add mobile-specific options
        android: {
          icon: '/android/android-launchericon-192-192.png',
          color: '#317EFB',
          priority: 'high',
          sticky: false,
        },
        // Add iOS-specific options
        ios: {
          icon: '/ios/192.png',
          badge: 1,
        }
      };

      console.log('Showing notification with options:', options);

      // Show notification
      const notificationPromise = self.registration.showNotification(
        data.title || 'Retenza',
        options
      );

      event.waitUntil(notificationPromise);

      // Cache notification data for offline access
      event.waitUntil(
        caches.open(NOTIFICATION_CACHE).then(cache => {
          const notificationData = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            data: data,
            read: false
          };
          return cache.put(`/notification-${notificationData.id}`, new Response(JSON.stringify(notificationData)));
        })
      );

    } catch (error) {
      console.error('Error processing push event:', error);

      // Fallback notification
      const fallbackOptions = {
        body: 'You have a new notification from Retenza',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'fallback',
        vibrate: [200, 100, 200],
        actions: [
          { action: 'view', title: 'View', icon: '/icon-192.png' }
        ]
      };

      event.waitUntil(
        self.registration.showNotification('Retenza', fallbackOptions)
      );
    }
  } else {
    console.log('No push data received, showing default notification');
    // No data, show default notification
    const defaultOptions = {
      body: 'You have a new notification from Retenza',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'default',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'view', title: 'View', icon: '/icon-192.png' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification('Retenza', defaultOptions)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', function (event) {
  console.log('Notification clicked:', event);
  console.log('Notification action:', event.action);

  event.notification.close();

  // Handle notification click
  if (event.action) {
    console.log('Action clicked:', event.action);
    // Handle specific actions if needed
    switch (event.action) {
      case 'view':
        // Open the app
        event.waitUntil(
          clients.openWindow('/')
        );
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        // Default behavior
        event.waitUntil(
          clients.openWindow('/')
        );
    }
  } else {
    // Default behavior: focus/open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }

        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', function (event) {
  console.log('Notification closed:', event);
  // You can track notification engagement here
});

// Background sync for offline notifications
self.addEventListener('sync', function (event) {
  console.log('Background sync event:', event);

  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Processing background sync...')
    );
  }

  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Sync notifications when back online
      syncNotifications()
    );
  }
});

// Handle offline/online events
self.addEventListener('online', function (event) {
  console.log('Service Worker is online');
  // Sync any pending notifications
  event.waitUntil(syncNotifications());
});

self.addEventListener('offline', function (event) {
  console.log('Service Worker is offline');
});

// Function to sync notifications when back online
async function syncNotifications() {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE);
    const requests = await cache.keys();

    for (const request of requests) {
      if (request.url.includes('/notification-')) {
        const response = await cache.match(request);
        const notificationData = await response.json();

        // Mark as synced
        notificationData.synced = true;
        await cache.put(request, new Response(JSON.stringify(notificationData)));
      }
    }

    console.log('Notifications synced successfully');
  } catch (error) {
    console.error('Error syncing notifications:', error);
  }
}

// Message event for communication with main thread
self.addEventListener('message', function (event) {
  console.log('Message received in service worker:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }

  if (event.data && event.data.type === 'GET_NOTIFICATIONS') {
    event.waitUntil(
      caches.open(NOTIFICATION_CACHE).then(cache => {
        return cache.keys();
      }).then(requests => {
        const notifications = requests.filter(req => req.url.includes('/notification-'));
        event.ports[0].postMessage({ notifications: notifications.length });
      })
    );
  }
});

console.log('Retenza Standalone Service Worker loaded successfully'); 