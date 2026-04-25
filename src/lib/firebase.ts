import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';

let app: any;
let db: any;
let auth: any;
const googleProvider = new GoogleAuthProvider();

if (firebaseConfig && (firebaseConfig as any).apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
    }, (firebaseConfig as any).firestoreDatabaseId);
    auth = getAuth(app);
  } catch (e) {
    console.error("Firebase init error:", e);
  }
}

export { db, auth, googleProvider };
export const signIn = () => auth ? signInWithPopup(auth, googleProvider) : Promise.reject("Firebase not initialized");
export const logout = () => auth ? signOut(auth) : Promise.reject("Firebase not initialized");
