// firebase.js
import { initializeApp } from "firebase/app";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBOFMn_YmL1_jXXCRgI-dc409Omu9Ldu1E",
  authDomain: "models-2c439.firebaseapp.com",
  projectId: "models-2c439",
  storageBucket: "models-2c439.firebasestorage.app",
  messagingSenderId: "554135576586",
  appId: "1:554135576586:web:bf7610c7e19a535ad87ff3"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage, ref, listAll, getDownloadURL };
