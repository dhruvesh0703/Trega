// Firebase Cloud Messaging Service Worker for Trega Marketplace
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "lithe-disk-8gbcx",
  appId: "1:381942828602:web:3d9f6436d3c6eba68faf03",
  apiKey: "AIzaSyBVJdwJPCuu-Jkjmg_L79RmeXNCSUZnMlo",
  messagingSenderId: "381942828602",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Trega Pune Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new offer update on Trega Marketplace!',
    icon: '/icon.png',
    badge: '/icon.png',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
