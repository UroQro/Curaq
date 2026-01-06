import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBdmVCQnUjDUXqwsiCPemJZ6u0fl5DhFAo",
  authDomain: "curaq-e3118.firebaseapp.com",
  projectId: "curaq-e3118",
  storageBucket: "curaq-e3118.firebasestorage.app",
  messagingSenderId: "849145373580",
  appId: "1:849145373580:web:a6e0a5095db154e45d6ca9",
  measurementId: "G-T17XP80GD1"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
