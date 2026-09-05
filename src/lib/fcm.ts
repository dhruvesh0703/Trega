import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { app, db, auth } from './firebase';
import { getApiBaseUrl } from '../config';

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

export async function getFCMInstance() {
 try {
 const supported = await isSupported();
 if (supported && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
 if (!messagingInstance) {
 messagingInstance = getMessaging(app);
 }
 return messagingInstance;
 }
 } catch (err) {
 console.warn('FCM Messaging is not supported in this browser environment:', err);
 }
 return null;
}

export async function requestFCMPermission(userId?: string): Promise<string | null> {
 if (typeof window === 'undefined' || !('Notification' in window)) {
 console.warn('Push Notifications are not supported on this browser.');
 return null;
 }

 try {
 const permission = await Notification.requestPermission();
 if (permission !== 'granted') {
 console.log('Notification permission was not granted.');
 return null;
 }

 const messaging = await getFCMInstance();
 if (!messaging) {
 console.warn('FCM instance could not be initialized.');
 return null;
 }

 // Register service worker if not already active
 let swRegistration: ServiceWorkerRegistration | undefined;
 if ('serviceWorker' in navigator) {
 try {
 swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
 } catch (swErr) {
 console.warn('Service Worker registration failed:', swErr);
 }
 }

 // Retrieve FCM Token
 const token = await getToken(messaging, {
 serviceWorkerRegistration: swRegistration,
 }).catch(async (err) => {
 console.warn('Failed to get FCM token with SW registration, trying default:', err);
 return await getToken(messaging);
 });

 if (token) {
 console.log('FCM Device Token retrieved:', token);
 
 // Save token locally
 localStorage.setItem('trega_fcm_token', token);

 // Send token to server endpoint
 if (userId) {
 try {
 const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
 await fetch(`${getApiBaseUrl()}/api/fcm/token`, {
 method: 'POST',
 headers: { 
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${idToken}`,
 'x-trega-client': 'trega-web-app'
 },
 body: JSON.stringify({ userId, fcmToken: token }),
 });

 // Save token to user document in Firestore if available
 const userRef = doc(db, 'users', userId);
 await updateDoc(userRef, { fcmToken: token, fcmUpdatedAt: new Date().toISOString() }).catch(() => {});
 } catch (apiErr) {
 console.warn('Failed to sync FCM token with server:', apiErr);
 }
 }

 return token;
 }
 } catch (error) {
 console.error('Error requesting FCM notification permission:', error);
 }
 return null;
}

export async function listenToForegroundFCM(
 onNotification: (notification: { title: string; body: string; data?: Record<string, any> }) => void
) {
 const messaging = await getFCMInstance();
 if (!messaging) return () => {};

 return onMessage(messaging, (payload) => {
 console.log('Foreground FCM Message received:', payload);
 const title = payload.notification?.title || payload.data?.title || 'New Marketplace Update';
 const body = payload.notification?.body || payload.data?.body || 'You received an update on TREGA MARKETPLACE.';
 
 // Trigger in-app callback
 onNotification({
 title,
 body,
 data: payload.data,
 });

 // Also display native browser notification if app is tabbed or active
 if (Notification.permission === 'granted') {
 try {
 new Notification(title, {
 body,
 icon: '/icon.png',
 data: payload.data,
 });
 } catch (e) {
 // Ignored for environments restricting window.Notification constructor
 }
 }
 });
}
