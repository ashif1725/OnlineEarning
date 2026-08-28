
// ==========================================
// SkillEarn Hub - Firebase Configuration
// ==========================================

// Firebase Web configuration
// NOTE: Firebase Web API key is okay to expose
// Payment/API secret keys यहां कभी मत रखें.

const firebaseConfig = {
    apiKey: "AIzaSyAHwV9fDsRXKjiImYuIF-qhi1hQ3MlqKng",
    authDomain: "skillearn-hub.firebaseapp.com",
    projectId: "skillearn-hub",
    storageBucket: "skillearn-hub.firebasestorage.app",
    messagingSenderId: "368756239597",
    appId: "1:368756239597:web:57278e2e36bc6e99e730e4",
    measurementId: "G-B7S23BPQ9T"
};


// ==========================================
// INITIALIZE FIREBASE
// ==========================================

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}


// ==========================================
// FIRESTORE
// ==========================================

const db = firebase.firestore();


// ==========================================
// AUTHENTICATION
// ==========================================

const auth = firebase.auth();


// ==========================================
// FIREBASE READY
// ==========================================

console.log("Firebase initialized successfully.");
console.log("Project:", firebaseConfig.projectId);
