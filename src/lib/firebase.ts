// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7lCSJ3v5TV8wTX_6vBIK5-sWh00hz0HI",
  authDomain: "painting-estimator-sync.firebaseapp.com",
  projectId: "painting-estimator-sync",
  storageBucket: "painting-estimator-sync.firebasestorage.app",
  messagingSenderId: "621276859732",
  appId: "1:621276859732:web:457d06bc88805ee5280cc1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);