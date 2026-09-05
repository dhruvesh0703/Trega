import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = { "projectId": "lithe-disk-8gbcx", "appId": "1:381942828602:web:3d9f6436d3c6eba68faf03", "apiKey": "AIzaSyBVJdwJPCuu-Jkjmg_L79RmeXNCSUZnMlo", "authDomain": "lithe-disk-8gbcx.firebaseapp.com", "firestoreDatabaseId": "ai-studio-tregapunehyperlo-7f965375-01ec-4342-a71b-23e282efc003" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    const d = await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Success:", d.exists());
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
test();
