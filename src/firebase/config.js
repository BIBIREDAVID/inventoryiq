import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCk-hsCLIfk5_uYCVBgyaR1NAkW4wUGfIs",
  authDomain: "limo-inventory-system.firebaseapp.com",
  projectId: "limo-inventory-system",
  storageBucket: "limo-inventory-system.firebasestorage.app",
  messagingSenderId: "783620662998",
  appId: "1:783620662998:web:a6b586663c027eaf45cb77"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;