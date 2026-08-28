// ============================================================
// SkillEarn Hub - Firebase Configuration
// Firebase Modular SDK v10
// ============================================================

import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth
} from
"https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore
} from
"https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {

  apiKey:
    "AIzaSyAHwV9fDsRXKjiImYuIF-qhi1hQ3MlqKng",

  authDomain:
    "skillearn-hub.firebaseapp.com",

  projectId:
    "skillearn-hub",

  storageBucket:
    "skillearn-hub.firebasestorage.app",

  messagingSenderId:
    "368756239597",

  appId:
    "1:368756239597:web:57278e2e36bc6e99e730e4",

  measurementId:
    "G-B7S23BPQ9T"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app =
  initializeApp(firebaseConfig);


// ============================================================
// FIREBASE SERVICES
// ============================================================

const auth =
  getAuth(app);

const db =
  getFirestore(app);


// ============================================================
// EXPORT
// ============================================================

export {
  app,
  auth,
  db
};


console.log(
  "SkillEarn Hub Firebase initialized successfully."
);

console.log(
  "Project:",
  firebaseConfig.projectId
);
