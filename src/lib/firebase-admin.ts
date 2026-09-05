import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = { "projectId": "lithe-disk-8gbcx", "appId": "1:381942828602:web:3d9f6436d3c6eba68faf03", "apiKey": "AIzaSyBVJdwJPCuu-Jkjmg_L79RmeXNCSUZnMlo", "authDomain": "lithe-disk-8gbcx.firebaseapp.com", "firestoreDatabaseId": "ai-studio-tregapunehyperlo-7f965375-01ec-4342-a71b-23e282efc003", "storageBucket": "lithe-disk-8gbcx.firebasestorage.app", "messagingSenderId": "381942828602", "measurementId": "G-YEQZXBH8HV" };

let app;
if (getApps().length) {
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId) as any;
export const adminDb = db as any;
export const adminAuth = getAuth(app) as any;
