import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDo5qGYWfqGoCil4SVYarcxxFd-mVDD2Ac",
  authDomain: "controllerhomepatrimonio.firebaseapp.com",
  projectId: "controllerhomepatrimonio",
  storageBucket: "controllerhomepatrimonio.firebasestorage.app",
  messagingSenderId: "286606812167",
  appId: "1:286606812167:web:6107cc1ca9617c1587f6a2",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);
export const firebaseStorage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
