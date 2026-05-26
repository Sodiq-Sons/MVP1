importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Config injected via URL search params from src/lib/fcm.js
const url = new URL(location.href);
firebase.initializeApp({
    apiKey:            url.searchParams.get('apiKey'),
    authDomain:        url.searchParams.get('authDomain'),
    projectId:         url.searchParams.get('projectId'),
    storageBucket:     url.searchParams.get('storageBucket'),
    messagingSenderId: url.searchParams.get('messagingSenderId'),
    appId:             url.searchParams.get('appId'),
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'Camp Connect';
    const body  = payload.notification?.body  ?? '';
    self.registration.showNotification(title, {
        body,
        icon:      '/icons/icon-192x192.webp',
        badge:     '/icons/icon-72x72.webp',
        data:      payload.data ?? {},
        tag:       payload.data?.type ?? 'camp-connect',
        renotify:  true,
    });
});
