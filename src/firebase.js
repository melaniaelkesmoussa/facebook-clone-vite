import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // db
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAl2KgxBMdr8VCwbAzn0LqMpwelKPlwiRM",
  authDomain: "facebook-clone-vite.firebaseapp.com",
  projectId: "facebook-clone-vite",
  storageBucket: "facebook-clone-vite.appspot.com",
  messagingSenderId: "1078887626084",
  appId: "1:1078887626084:web:89c4c16213e8f165acb671",
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // db 
export const storage = getStorage(app);
