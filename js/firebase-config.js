// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqERPPe2wcr_BKVwSlz07EKc5Ormlld_Y",
  authDomain: "websangudom.firebaseapp.com",
  projectId: "websangudom",
  storageBucket: "websangudom.firebasestorage.app",
  messagingSenderId: "47183761185",
  appId: "1:47183761185:web:5a05f007803882e3647860"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
