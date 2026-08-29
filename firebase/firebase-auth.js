/*

* SkillEarn Hub
* Firebase Authentication
* 
* Firebase v10+ modular SDK
  */

"use strict";

import {
initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
getAuth,
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
getFirestore,
doc,
getDoc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
firebaseConfig
} from "./firebase-config.js";

/* =========================================================
INITIALIZE FIREBASE
========================================================= */

const app =
initializeApp(firebaseConfig);

const auth =
getAuth(app);

const db =
getFirestore(app);

/* =========================================================
CURRENT USER
========================================================= */

export function getCurrentUser() {

return auth.currentUser;

}

/* =========================================================
AUTH STATE
========================================================= */

export function watchAuthState(callback) {

return onAuthStateChanged(
    auth,
    callback
);

}

/* =========================================================
CREATE USER PROFILE
========================================================= */

export async function createUserProfile(
user,
extraData = {}
) {

if (!user) {
    throw new Error(
        "Authenticated user is required."
    );
}


const userRef =
    doc(
        db,
        "users",
        user.uid
    );


const existing =
    await getDoc(userRef);


if (existing.exists()) {
    return existing.data();
}


const profile = {

    uid: user.uid,

    email:
        user.email || "",

    displayName:
        extraData.displayName ||
        user.displayName ||
        "Member",

    phone:
        extraData.phone ||
        user.phoneNumber ||
        "",

    role: "user",

    accountStatus: "active",

    createdAt:
        serverTimestamp(),

    updatedAt:
        serverTimestamp()

};


await setDoc(
    userRef,
    profile
);


return profile;

}

/* =========================================================
GET USER PROFILE
========================================================= */

export async function getUserProfile(
uid
) {

if (!uid) {
    throw new Error(
        "UID is required."
    );
}


const userRef =
    doc(
        db,
        "users",
        uid
    );


const snapshot =
    await getDoc(userRef);


if (!snapshot.exists()) {
    return null;
}


return snapshot.data();

}

/* =========================================================
LOGOUT
========================================================= */

export async function logoutUser() {

await signOut(auth);

}

/* =========================================================
EXPORT FIREBASE INSTANCES
========================================================= */

export {
app,
auth,
db
};
