import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA2KJVniff4pIipVaKsJCHTxAlX4g0wajE",
  authDomain: "crezia-mira-ai.firebaseapp.com",
  projectId: "crezia-mira-ai",
  storageBucket: "crezia-mira-ai.firebasestorage.app",
  messagingSenderId: "878178195161",
  appId: "1:878178195161:web:a6d8b576d21c1ca24290c8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth
export const auth = getAuth(app);