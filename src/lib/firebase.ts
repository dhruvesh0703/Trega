import { initializeApp } from 'firebase/app';
import {
 getAuth,
 RecaptchaVerifier,
 signInWithPhoneNumber,
 ConfirmationResult,
 signOut,
 onAuthStateChanged,
 User as FirebaseUser,
} from 'firebase/auth';
import {
 initializeFirestore,
 persistentLocalCache,
 persistentMultipleTabManager,
 doc,
 getDoc,
 setDoc,
 updateDoc,
 getDocFromServer,
 collection,
} from 'firebase/firestore';
const firebaseConfig = { "projectId": "lithe-disk-8gbcx", "appId": "1:381942828602:web:3d9f6436d3c6eba68faf03", "apiKey": "AIzaSyBVJdwJPCuu-Jkjmg_L79RmeXNCSUZnMlo", "authDomain": "lithe-disk-8gbcx.firebaseapp.com", "firestoreDatabaseId": "ai-studio-tregapunehyperlo-7f965375-01ec-4342-a71b-23e282efc003", "storageBucket": "lithe-disk-8gbcx.firebasestorage.app", "messagingSenderId": "381942828602", "measurementId": "G-YEQZXBH8HV" };


import { getApps, getApp } from 'firebase/app';
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
 CREATE = 'create',
 UPDATE = 'update',
 DELETE = 'delete',
 LIST = 'list',
 GET = 'get',
 WRITE = 'write',
}

export interface FirestoreErrorInfo {
 error: string;
 operationType: OperationType;
 path: string | null;
 authInfo: {
 userId?: string | null;
 email?: string | null;
 emailVerified?: boolean | null;
 isAnonymous?: boolean | null;
 tenantId?: string | null;
 providerInfo?: {
 providerId?: string | null;
 email?: string | null;
 }[];
 };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
 const errInfo: FirestoreErrorInfo = {
 error: error instanceof Error ? error.message : String(error),
 authInfo: {
 userId: auth.currentUser?.uid,
 email: auth.currentUser?.email,
 emailVerified: auth.currentUser?.emailVerified,
 isAnonymous: auth.currentUser?.isAnonymous,
 tenantId: auth.currentUser?.tenantId,
 providerInfo: auth.currentUser?.providerData?.map((provider) => ({
 providerId: provider.providerId,
 email: provider.email,
 })) || [],
 },
 operationType,
 path,
 };
 console.error('Firestore Error:', JSON.stringify(errInfo));
 throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testConnection() {
 try {
 await getDocFromServer(doc(db, 'test', 'connection'));
 } catch (error) {
 if (error instanceof Error && error.message.includes('the client is offline')) {
 console.error('Please check your Firebase configuration.');
 }
 }
}
testConnection();

export {
 RecaptchaVerifier,
 signInWithPhoneNumber,
 signOut,
 onAuthStateChanged,
};
export type { ConfirmationResult, FirebaseUser };

