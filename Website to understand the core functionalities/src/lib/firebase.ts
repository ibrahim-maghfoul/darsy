import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAEK4iKL_2Hum90gAMzPvtNdhpmIWPGNhw",
    authDomain: "darsy-3f275.firebaseapp.com",
    projectId: "darsy-3f275",
    storageBucket: "darsy-3f275.firebasestorage.app",
    messagingSenderId: "650738111418",
    appId: "YOUR_WEB_APP_ID", // TODO: Replace with your web app ID from Firebase Console
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
