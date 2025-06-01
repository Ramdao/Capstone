// src/firebase.js

import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
  uploadBytesResumable 
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBeDq79m9z254S_jLgkT_tvvizguluId0Y",
  authDomain: "models-a3835.firebaseapp.com",
  projectId: "models-a3835",
  storageBucket: "models-a3835.firebasestorage.app", 
  messagingSenderId: "770474288991",
  appId: "1:770474288991:web:286f4cb00a701f074ff8ea"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// ✅ Export all needed Firebase Storage functions
export { storage, ref, listAll, getDownloadURL, uploadBytesResumable };
