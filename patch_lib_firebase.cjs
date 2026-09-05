const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(/export const app = initializeApp\(firebaseConfig\);/g, `
import { getApps, getApp } from 'firebase/app';
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
`);

fs.writeFileSync('src/lib/firebase.ts', code);
