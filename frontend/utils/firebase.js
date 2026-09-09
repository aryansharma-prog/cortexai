import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cotex-ai-4f3b2.firebaseapp.com",
  projectId: "cotex-ai-4f3b2",
  storageBucket: "cotex-ai-4f3b2.firebasestorage.app",
  messagingSenderId: "584896904072",
  appId: "1:584896904072:web:db49adb081cf1c7e0c183d"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()