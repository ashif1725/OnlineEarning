/*

* SkillEarn Hub
* Authentication Guard
  */

"use strict";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
auth
} from "../firebase/firebase-auth.js";

const LOGIN_PAGE =
"../auth/login.html";

const currentPath =
window.location.pathname;

/* =========================================================
PROTECTED PAGE GUARD
========================================================= */

onAuthStateChanged(
auth,
user => {

    if (!user) {

        const returnUrl =
            encodeURIComponent(
                currentPath
            );

        window.location.href =
            `${LOGIN_PAGE}?redirect=${returnUrl}`;

        return;

    }


    /*
     * User is authenticated.
     * Continue loading the protected page.
     */

    document.documentElement
        .classList
        .add("authenticated");

}

);
