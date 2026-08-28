/* =========================================================
   SKILLEARN HUB
   Firebase Configuration
   ========================================================= */

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHwV9fDsRXKjiImYuIF-qhi1hQ3MlqKng",
    authDomain: "skillearn-hub.firebaseapp.com",
    projectId: "skillearn-hub",
    storageBucket: "skillearn-hub.firebasestorage.app",
    messagingSenderId: "368756239597",
    appId: "1:368756239597:web:57278e2e36bc6e99e730e4",
    measurementId: "G-B7S23BPQ9T"
};


/* =========================================================
   INITIALIZE FIREBASE
   ========================================================= */

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}


/* =========================================================
   FIREBASE SERVICES
   ========================================================= */

const firebaseAuth = firebase.auth();
const firestoreDB = firebase.firestore();


/* =========================================================
   OPTIONAL:
   Firebase Analytics
   ========================================================= */

if (typeof firebase.analytics === "function") {
    firebase.analytics();
}


/* =========================================================
   CONSOLE MESSAGE
   ========================================================= */

console.log("SkillEarn Hub Firebase initialized successfully.");
console.log("Project:", firebaseConfig.projectId);
