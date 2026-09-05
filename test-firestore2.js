import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer, collection, getDocs } from "firebase/firestore";

const firebaseConfig = { "projectId": "lithe-disk-8gbcx", "appId": "1:381942828602:web:3d9f6436d3c6eba68faf03", "apiKey": "AIzaSyBVJdwJPCuu-Jkjmg_L79RmeXNCSUZnMlo", "authDomain": "lithe-disk-8gbcx.firebaseapp.com", "firestoreDatabaseId": "ai-studio-tregapunehyperlo-7f965375-01ec-4342-a71b-23e282efc003" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    const querySnapshot = await getDocs(collection(db, "listings"));
    console.log("Success! Connected to Firestore. Found documents:", querySnapshot.size);
  } catch (e) {
    console.error("Error connecting to Firestore:", e.message);
  }
  process.exit(0);
}
test();
