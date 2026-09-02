"use strict";

/* =========================================================
   SkillEarn Hub
   Authentication Middleware
========================================================= */


/* =========================================================
   IMPORTS
========================================================= */

const {
    getSession
} = require(
    "../services/session.service"
);


/* =========================================================
   EXTRACT TOKEN
========================================================= */

function getRequestToken(req) {

    const authorization =
        String(
            req.get("authorization") ||
            ""
        ).trim();


    /*
    ---------------------------------------------------------
    Authorization Header

    Authorization: Bearer TOKEN
    ---------------------------------------------------------
    */

    if (
        authorization
            .toLowerCase()
            .startsWith(
                "bearer "
            )
    ) {

        const token =
            authorization
                .slice(7)
                .trim();


        if (token) {

            return token;

        }

    }


    /*
    ---------------------------------------------------------
    Cookie Fallback
    ---------------------------------------------------------
    */

    if (
        req.cookies &&
        req.cookies.skillearn_session
    ) {

        const cookieToken =
            String(
                req.cookies
                    .skillearn_session
            )
            .trim();


        if (cookieToken) {

            return cookieToken;

        }

    }


    return null;

}


/* =========================================================
   NORMALIZE ROLE
========================================================= */

function normalizeRole(role) {

    const value =
        String(
            role ||
            "user"
        )
        .trim()
        .toLowerCase();


    /*
    ---------------------------------------------------------
    Admin aliases
    ---------------------------------------------------------
    */

    if (

        value === "admin" ||

        value === "administrator"

    ) {

        return "admin";

    }


    /*
    ---------------------------------------------------------
    Default role
    ---------------------------------------------------------
    */

    return "user";

}


/* =========================================================
   NORMALIZE ACCOUNT STATUS
========================================================= */

function normalizeAccountStatus(
    status
) {

    const value =
        String(
            status ||
            "active"
        )
        .trim()
        .toLowerCase();


    return value;

}


/* =========================================================
   NORMALIZE SESSION USER
========================================================= */

/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
|
| session.service.js returns PostgreSQL fields directly:
|
| session_id
| user_id
| public_user_id
| full_name
| email
| phone
| role
| account_status
| email_verified_at
| expires_at
|
| Therefore we convert database field names to the frontend/
| controller friendly camelCase format here.
|--------------------------------------------------------------------------
*/

function normalizeSessionUser(
    session
) {

    if (!session) {

        return null;

    }


    const userId =

        session.userId ||

        session.user_id ||

        session.id ||

        null;


    if (!userId) {

        return null;

    }


    return {

        /*
        -----------------------------------------------------
        Primary user ID
        -----------------------------------------------------
        */

        id:
            userId,


        /*
        -----------------------------------------------------
        Public User ID
        -----------------------------------------------------
        */

        publicUserId:

            session.publicUserId ||

            session.public_user_id ||

            null,


        /*
        -----------------------------------------------------
        Full Name
        -----------------------------------------------------
        */

        fullName:

            session.fullName ||

            session.full_name ||

            null,


        /*
        -----------------------------------------------------
        Email
        -----------------------------------------------------
        */

        email:

            session.email ||

            null,


        /*
        -----------------------------------------------------
        Phone
        -----------------------------------------------------
        */

        phone:

            session.phone ||

            null,


        /*
        -----------------------------------------------------
        Role
        -----------------------------------------------------
        */

        role:

            normalizeRole(

                session.role ||

                session.userRole ||

                session.user_role ||

                "user"

            ),


        /*
        -----------------------------------------------------
        Account Status
        -----------------------------------------------------
        */

        accountStatus:

            normalizeAccountStatus(

                session.accountStatus ||

                session.account_status ||

                "active"

            ),


        /*
        -----------------------------------------------------
        Email Verification
        -----------------------------------------------------
        */

        emailVerifiedAt:

            session.emailVerifiedAt ||

            session.email_verified_at ||

            null

    };

}


/* =========================================================
   UNAUTHORIZED RESPONSE
========================================================= */

function unauthorized(
    res,
    message = "Please sign in again."
) {

    return res.status(401).json({

        success:
            false,

        error:
            "AUTHENTICATION_REQUIRED",

        message:
            message

    });

}


/* =========================================================
   ACCOUNT STATUS CHECK
========================================================= */

function isAccountBlocked(
    user
) {

    if (!user) {

        return true;

    }


    const status =
        normalizeAccountStatus(
            user.accountStatus
        );


    return (

        status === "disabled" ||

        status === "suspended" ||

        status === "blocked" ||

        status === "inactive"

    );

}


/* =========================================================
   REQUIRE AUTH
========================================================= */

async function requireAuth(
    req,
    res,
    next
) {

    try {

        /*
        -----------------------------------------------------
        STEP 1
        Extract token
        -----------------------------------------------------
        */

        const token =
            getRequestToken(
                req
            );


        if (!token) {

            return unauthorized(

                res,

                "Authentication token is missing. Please sign in again."

            );

        }


        /*
        -----------------------------------------------------
        STEP 2
        Get active session

        IMPORTANT:

        session.service.js exports getSession()
        NOT getSessionByToken()
        -----------------------------------------------------
        */

        const session =
            await getSession(
                token
            );


        if (!session) {

            return unauthorized(

                res,

                "Your session has expired or is no longer valid. Please sign in again."

            );

        }


        /*
        -----------------------------------------------------
        STEP 3
        Convert flat PostgreSQL session result
        into authenticated user
        -----------------------------------------------------
        */

        const user =
            normalizeSessionUser(
                session
            );


        if (!user) {

            return unauthorized(

                res,

                "Unable to load your account. Please sign in again."

            );

        }


        /*
        -----------------------------------------------------
        STEP 4
        Account status
        -----------------------------------------------------
        */

        if (
            isAccountBlocked(
                user
            )
        ) {

            return res.status(403).json({

                success:
                    false,

                error:
                    "ACCOUNT_DISABLED",

                message:
                    "This account is currently disabled."

            });

        }


        /*
        -----------------------------------------------------
        STEP 5
        Attach authenticated user
        -----------------------------------------------------
        */

        req.user =
            user;


        /*
        -----------------------------------------------------
        STEP 6
        Attach authentication/session information
        -----------------------------------------------------
        */

        req.auth = {

            token:
                token,


            sessionId:

                session.sessionId ||

                session.session_id ||

                null,


            userId:

                user.id,


            expiresAt:

                session.expiresAt ||

                session.expires_at ||

                null

        };


        /*
        -----------------------------------------------------
        STEP 7
        Continue request
        -----------------------------------------------------
        */

        return next();


    } catch (error) {

        console.error(
            "AUTH MIDDLEWARE ERROR:",
            error
        );


        return unauthorized(

            res,

            "Unable to verify your session. Please sign in again."

        );

    }

}


/* =========================================================
   REQUIRE ADMIN
========================================================= */

function requireAdmin(
    req,
    res,
    next
) {

    try {

        /*
        -----------------------------------------------------
        Authentication must run first
        -----------------------------------------------------
        */

        if (!req.user) {

            return unauthorized(

                res,

                "Please sign in again."

            );

        }


        /*
        -----------------------------------------------------
        Normalize role
        -----------------------------------------------------
        */

        const role =
            normalizeRole(
                req.user.role
            );


        /*
        -----------------------------------------------------
        Admin check
        -----------------------------------------------------
        */

        if (
            role !== "admin"
        ) {

            return res.status(403).json({

                success:
                    false,

                error:
                    "ADMIN_ACCESS_REQUIRED",

                message:
                    "Administrator access is required."

            });

        }


        return next();


    } catch (error) {

        console.error(
            "ADMIN MIDDLEWARE ERROR:",
            error
        );


        return res.status(403).json({

            success:
                false,

            error:
                "ADMIN_ACCESS_REQUIRED",

            message:
                "Administrator access is required."

        });

    }

}


/* =========================================================
   OPTIONAL AUTH
========================================================= */

async function optionalAuth(
    req,
    res,
    next
) {

    try {

        /*
        -----------------------------------------------------
        Get token
        -----------------------------------------------------
        */

        const token =
            getRequestToken(
                req
            );


        /*
        -----------------------------------------------------
        Guest request
        -----------------------------------------------------
        */

        if (!token) {

            return next();

        }


        /*
        -----------------------------------------------------
        Get session
        -----------------------------------------------------
        */

        const session =
            await getSession(
                token
            );


        /*
        -----------------------------------------------------
        Invalid session

        Continue as guest.
        -----------------------------------------------------
        */

        if (!session) {

            return next();

        }


        /*
        -----------------------------------------------------
        Normalize user
        -----------------------------------------------------
        */

        const user =
            normalizeSessionUser(
                session
            );


        if (!user) {

            return next();

        }


        /*
        -----------------------------------------------------
        Do not attach blocked users
        -----------------------------------------------------
        */

        if (
            isAccountBlocked(
                user
            )
        ) {

            return next();

        }


        /*
        -----------------------------------------------------
        Attach user
        -----------------------------------------------------
        */

        req.user =
            user;


        req.auth = {

            token:
                token,


            sessionId:

                session.sessionId ||

                session.session_id ||

                null,


            userId:

                user.id,


            expiresAt:

                session.expiresAt ||

                session.expires_at ||

                null

        };


        return next();


    } catch (error) {

        /*
        -----------------------------------------------------
        Optional authentication must never block
        public routes.
        -----------------------------------------------------
        */

        console.warn(
            "OPTIONAL AUTH ERROR:",
            error.message
        );


        return next();

    }

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    getRequestToken,

    normalizeRole,

    normalizeSessionUser,

    requireAuth,

    requireAdmin,

    optionalAuth

};
