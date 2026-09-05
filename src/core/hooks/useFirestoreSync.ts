import { useState, useEffect } from 'react';
import { collection, doc, setDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Global flag to track if Firebase quota is exhausted so we can fallback to local state seamlessly
let isQuotaExceeded = false;

// Helper to remove undefined values before sending to Firestore
function removeUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      if (obj[key] !== undefined) {
        acc[key] = removeUndefined(obj[key]);
      }
      return acc;
    }, {} as any);
  }
  return obj;
}

export function useFirestoreSync<T extends { id: string }>(collectionName: string, initialData: T[]): [T[], (data: T[] | ((prev: T[]) => T[])) => void, boolean] {
  const [state, setState] = useState<T[]>(initialData);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    
    if (isQuotaExceeded) {
      setIsReady(true);
      return unsubscribe;
    }

    try {
      unsubscribe = onSnapshot(collection(db, collectionName), { includeMetadataChanges: true }, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
        if (items.length > 0) {
          setState(items);
        } else if (!snapshot.metadata.fromCache) {
          setState([]);
        }
        
        if (!snapshot.metadata.fromCache || items.length > 0) {
          setIsReady(true);
        }
      }, (error: any) => {
        if (error.code === 'resource-exhausted') {
          console.warn(`Firebase quota exceeded for ${collectionName}. Falling back to local state.`);
          isQuotaExceeded = true;
          unsubscribe();
        } else if (error.code === 'permission-denied') {
          // Ignore permission-denied errors for guests on restricted collections
          console.warn(`Permission denied syncing ${collectionName}. Falling back to local state.`);
        } else {
          console.error(`Error syncing ${collectionName}:`, error.message || error);
        }
        setIsReady(true);
      });
    } catch (e) {
      setIsReady(true);
    }
    return () => unsubscribe();
  }, [collectionName]);

  const setPersistedState = (value: T[] | ((prev: T[]) => T[])) => {
    setState((prev) => {
      const nextState = typeof value === 'function' ? (value as any)(prev) : value;
      
      if (isReady && !isQuotaExceeded) {
        nextState.forEach((item: T) => {
          const prevItem = prev.find(p => p.id === item.id);
          if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
            setDoc(doc(db, collectionName, item.id), removeUndefined(item), { merge: true }).catch((error) => {
               if (error.code === 'resource-exhausted') isQuotaExceeded = true;
            });
          }
        });
      }
      return nextState;
    });
  };

  return [state, setPersistedState, isReady];
}

export function useFirestoreRecordSync<T>(collectionName: string, initialData: Record<string, T[]>): [Record<string, T[]>, (data: Record<string, T[]> | ((prev: Record<string, T[]>) => Record<string, T[]>)) => void, boolean] {
  const [state, setState] = useState<Record<string, T[]>>(initialData);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    
    if (isQuotaExceeded) {
      setIsReady(true);
      return unsubscribe;
    }

    try {
      unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
        const record: Record<string, T[]> = {};
        snapshot.docs.forEach(doc => {
          record[doc.id] = doc.data().items as T[];
        });
        if (Object.keys(record).length > 0) {
          setState(record);
        }
        setIsReady(true);
      }, (error: any) => {
        if (error.code === 'resource-exhausted') {
          console.warn(`Firebase quota exceeded for ${collectionName}. Falling back to local state.`);
          isQuotaExceeded = true;
          unsubscribe();
        } else if (error.code === 'permission-denied') {
          console.warn(`Permission denied syncing ${collectionName}. Falling back to local state.`);
        } else {
          console.error(`Error syncing record ${collectionName}:`, error.message || error);
        }
        setIsReady(true);
      });
    } catch (e) {
      setIsReady(true);
    }
    return () => unsubscribe();
  }, [collectionName]);

  const setPersistedState = (value: Record<string, T[]> | ((prev: Record<string, T[]>) => Record<string, T[]>)) => {
    setState((prev) => {
      const nextState = typeof value === 'function' ? (value as any)(prev) : value;
      if (isReady && !isQuotaExceeded) {
        Object.keys(nextState).forEach(key => {
          if (!prev[key] || JSON.stringify(prev[key]) !== JSON.stringify(nextState[key])) {
            setDoc(doc(db, collectionName, key), { items: removeUndefined(nextState[key]) }, { merge: true }).catch((error) => {
               if (error.code === 'resource-exhausted') isQuotaExceeded = true;
            });
          }
        });
      }
      return nextState;
    });
  };

  return [state, setPersistedState, isReady];
}

export function useFirestoreDocSync<T extends { id: string }>(collectionName: string, docId: string, initialData: T | null): [T | null, (data: T | null | ((prev: T | null) => T | null)) => void, boolean] {
  const [state, setState] = useState<T | null>(initialData);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    
    if (isQuotaExceeded) {
      setIsReady(true);
      return unsubscribe;
    }

    try {
      unsubscribe = onSnapshot(doc(db, collectionName, docId), (snapshot) => {
        if (snapshot.exists()) {
          setState({ ...snapshot.data(), id: snapshot.id } as T);
        }
        setIsReady(true);
      }, (error: any) => {
        if (error.code === 'resource-exhausted') {
          console.warn(`Firebase quota exceeded for ${collectionName}/${docId}. Falling back to local state.`);
          isQuotaExceeded = true;
          unsubscribe();
        } else if (error.code === 'permission-denied') {
          console.warn(`Permission denied syncing ${collectionName}/${docId}. Falling back to local state.`);
        } else {
          console.error(`Error syncing doc ${collectionName}/${docId}:`, error.message || error);
        }
        setIsReady(true);
      });
    } catch (e) {
      setIsReady(true);
    }
    return () => unsubscribe();
  }, [collectionName, docId]);

  const setPersistedState = (value: T | null | ((prev: T | null) => T | null)) => {
    setState((prev) => {
      const nextState = typeof value === 'function' ? (value as any)(prev) : value;
      if (isReady && !isQuotaExceeded && nextState) {
        if (!prev || JSON.stringify(prev) !== JSON.stringify(nextState)) {
          setDoc(doc(db, collectionName, docId), removeUndefined(nextState), { merge: true }).catch((error) => {
               if (error.code === 'resource-exhausted') isQuotaExceeded = true;
          });
        }
      }
      return nextState;
    });
  };

  return [state, setPersistedState, isReady];
}
