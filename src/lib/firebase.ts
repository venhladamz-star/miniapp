import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app;
let db: any;
let auth: any;
const googleProvider = new GoogleAuthProvider();

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  auth = getAuth(app);
} catch (e) {
  console.error("Firebase initialization failed. Check firebase-applet-config.json", e);
}

export { db, auth, googleProvider };
export const signIn = () => auth ? signInWithPopup(auth, googleProvider) : Promise.reject("Firebase not initialized");
export const logout = () => auth ? signOut(auth) : Promise.reject("Firebase not initialized");
