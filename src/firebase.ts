import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase config generated in firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0696819076",
  appId: "1:1089585182714:web:f48a203b0b08d55dde1643",
  apiKey: "AIzaSyD5azfy0ckqA1dnUkK9bj6MLaN6xd_xzDM",
  authDomain: "gen-lang-client-0696819076.firebaseapp.com",
  storageBucket: "gen-lang-client-0696819076.firebasestorage.app",
  messagingSenderId: "1089585182714"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if specified
// Note: our databaseId is "ai-studio-d8ff09d8-54c9-4b2a-9895-dd7283e8711c"
export const db = getFirestore(app, "ai-studio-d8ff09d8-54c9-4b2a-9895-dd7283e8711c");
export const auth = getAuth(app);
