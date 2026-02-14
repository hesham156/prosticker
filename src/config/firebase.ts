// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
 apiKey: "AIzaSyAgLteACxfZxkQxwJYoNTNqdIg9UE5pGE4",
  authDomain: "aqar-b7d60.firebaseapp.com",
  projectId: "aqar-b7d60",
  storageBucket: "aqar-b7d60.firebasestorage.app",
  messagingSenderId: "376245419512",
  appId: "1:376245419512:web:dd3c3ebc47876164c06a0d",
  measurementId: "G-66QS2G2D9H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
