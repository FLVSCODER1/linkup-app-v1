import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRIqQ0IzxXf_md3m5N_GTTSAhXk2imHJk",
  authDomain: "linkup-app-c0cf1.firebaseapp.com",
  projectId: "linkup-app-c0cf1",
  storageBucket: "linkup-app-c0cf1.firebasestorage.app",
  messagingSenderId: "532045831400",
  appId: "1:532045831400:web:1da275bf708053b4bebd5d",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);