import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyCDJE2gwncDw0UbtfgesS0ui4Q8Y21XcPA",
  authDomain: "audit-os-7c993.firebaseapp.com",
  projectId: "audit-os-7c993",
  storageBucket: "audit-os-7c993.firebasestorage.app",
  messagingSenderId: "585809395057",
  appId: "1:585809395057:web:8d53014a76aa0db905cad0"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
