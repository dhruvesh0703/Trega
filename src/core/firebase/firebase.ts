import { getStorage } from 'firebase/storage';
import { app, db, auth } from '../../lib/firebase';

export const storage = getStorage(app);
export { db, auth };
