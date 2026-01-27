// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDyu94UrPxC7yIbVBzMnjm59Sim2HILHLU",
  authDomain: "ramosfirebase.firebaseapp.com",
  projectId: "ramosfirebase",
  storageBucket: "ramosfirebase.firebasestorage.app",
  messagingSenderId: "960485902034",
  appId: "1:960485902034:web:461070b8acc2aabf2c4f0b",
  measurementId: "G-H20C6TG7QS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);  // Initialize authentication
const provider = new GoogleAuthProvider();  // Create Google Auth provider

export { auth, provider };  // Export auth and provider for use in other files