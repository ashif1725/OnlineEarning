"use strict";

/* =========================================================
   SkillEarn Hub
   Password Security Utilities
========================================================= */

const argon2 =
    require("argon2");


/* =========================================================
   ARGON2 CONFIGURATION
========================================================= */

/*
|--------------------------------------------------------------------------
| Password hashing configuration
|--------------------------------------------------------------------------
|
| argon2id is recommended for password hashing.
|
| These settings provide a reasonable balance between
| security and server performance.
|--------------------------------------------------------------------------
*/

const ARGON2_OPTIONS = {

    type:
        argon2.argon2id,

    memoryCost:
        19456,

    timeCost:
        2,

    parallelism:
        1

};


/* =========================================================
   HASH PASSWORD
========================================================= */

async function hashPassword(
    password
) {

    if (
        typeof password !== "string" ||
        password.length === 0
    ) {

        const error =
            new Error(
                "PASSWORD_REQUIRED"
            );

        error.code =
            "PASSWORD_REQUIRED";

        throw error;

    }


    return argon2.hash(

        password,

        ARGON2_OPTIONS

    );

}


/* =========================================================
   VERIFY PASSWORD
========================================================= */

async function verifyPassword(
    password,
    passwordHash
) {

    /*
    |--------------------------------------------------------------------------
    | Invalid input should simply fail authentication.
    |--------------------------------------------------------------------------
    */

    if (
        typeof password !== "string" ||
        password.length === 0
    ) {

        return false;

    }


    if (
        typeof passwordHash !== "string" ||
        passwordHash.length === 0
    ) {

        return false;

    }


    try {

        return await argon2.verify(

            passwordHash,

            password

        );

    } catch (error) {

        /*
        |--------------------------------------------------------------------------
        | Invalid/corrupted hash should not crash login.
        | Authentication will fail safely.
        |--------------------------------------------------------------------------
        */

        console.error(
            "PASSWORD VERIFY ERROR:",
            error
        );


        return false;

    }

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    hashPassword,

    verifyPassword,

    ARGON2_OPTIONS

};
