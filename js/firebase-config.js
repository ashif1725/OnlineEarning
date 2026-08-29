/* =========================================================
   SKILLEARN HUB
   Firebase Configuration
   Firebase JS SDK - COMPAT
   ========================================================= */

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

const auth = firebase.auth();
const db = firebase.firestore();


/* =========================================================
   COMPATIBILITY VARIABLES
   ========================================================= */

const firebaseAuth = auth;
const firestoreDB = db;


/* =========================================================
   FIREBASE ANALYTICS
   ========================================================= */

if (
    typeof firebase.analytics === "function"
) {
    try {
        firebase.analytics();
    } catch (error) {
        console.warn(
            "Firebase Analytics unavailable:",
            error
        );
    }
}


/* =========================================================
   FIREBASE CONFIG TEST
   ========================================================= */

console.log(
    "=========================================="
);

console.log(
    "SkillEarn Hub Firebase initialized"
);

console.log(
    "Project:",
    firebaseConfig.projectId
);

console.log(
    "Auth:",
    !!auth
);

console.log(
    "Firestore:",
    !!db
);

console.log(
    "=========================================="
);
