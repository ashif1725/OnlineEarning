"use strict";

/* =========================================================
   SkillEarn Hub
   Authentication Middleware
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
    Authorization: Bearer TOKEN
    ---------------------------------------------------------
    */

    if (
        authorization
            .toLowerCase()
            .startsWith("bearer ")
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
    Cookie fallback
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


    if (
        value === "admin" ||
        value === "administrator"
    ) {

        return "admin";

    }


    return "user";

}


/* =========================================================
   NORMALIZE USER
========================================================= */

function normalizeUser(user) {

    if (!user) {

        return null;

    }


    return {

        id:
            user.id ||
            user.user_id ||
            null,


        publicUserId:

            user.publicUserId ||

            user.public_user_id ||

            null,


        fullName:

            user.fullName ||

            user.full_name ||

            null,


        email:

            user.email ||

            null,


        phone:

            user.phone ||

            null,


        role:

            normalizeRole(

                user.role ||

                user.userRole ||

                user.user_role

            ),


        accountStatus:

            user.accountStatus ||

            user.account_status ||

            null,


        emailVerified:

            Boolean(

                user.emailVerified ||

                user.email_verified ||

                user.email_verified_at ||

                user.emailVerifiedAt

            )

    };

}


/* =========================================================
   BUILD SESSION USER
========================================================= */

function getUserFromSession(session) {

    if (!session) {

        return null;

    }


    /*
    ---------------------------------------------------------
    Case 1:
    Session contains nested user object
    ---------------------------------------------------------
    */

    if (
        session.user
    ) {

        return session.user;

    }


    /*
    ---------------------------------------------------------
    Case 2:
    Alternative nested structures
    ---------------------------------------------------------
    */

    if (
        session.account
    ) {

        return session.account;

    }


    if (
        session.userData
    ) {

        return session.userData;

    }


    /*
    ---------------------------------------------------------
    Case 3:
    Current session.service.js returns a flat PostgreSQL row.

    Example:

    {
        session_id,
        user_id,
        expires_at,
        public_user_id,
        full_name,
        email,
        phone,
        role,
        account_status,
        email_verified_at
    }
    ---------------------------------------------------------
    */

    if (

        session.user_id ||

        session.public_user_id ||

        session.email

    ) {

        return {

            id:

                session.user_id ||

                session.id ||

                null,


            publicUserId:

                session.public_user_id ||

                null,


            fullName:

                session.full_name ||

                null,


            email:

                session.email ||

                null,


            phone:

                session.phone ||

                null,


            role:

                session.role ||

                "user",


            accountStatus:

                session.account_status ||

                null,


            emailVerifiedAt:

                session.email_verified_at ||

                null

        };

    }


    return null;

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

function isAccountBlocked(user) {

    const status =
        String(
            user?.accountStatus ||
            ""
        )
        .trim()
        .toLowerCase();


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
        Get token from:
        1. Authorization Bearer token
        2. Cookie fallback
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
        Find active session

        session.service.js exports:
        getSession(token)
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
        Extract user from session
        -----------------------------------------------------
        */

        const rawUser =
            getUserFromSession(
                session
            );


        if (!rawUser) {

            return unauthorized(
                res,
                "Unable to load your account. Please sign in again."
            );

        }


        /*
        -----------------------------------------------------
        Normalize user
        -----------------------------------------------------
        */

        const user =
            normalizeUser(
                rawUser
            );


        if (
            !user ||
            !user.id
        ) {

            return unauthorized(
                res,
                "Unable to verify your account. Please sign in again."
            );

        }


        /*
        -----------------------------------------------------
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
        Attach authenticated user
        -----------------------------------------------------
        */

        req.user =
            user;


        /*
        -----------------------------------------------------
        Attach session/auth information

        Current session.service.js returns:

        session_id
        user_id
        expires_at
        -----------------------------------------------------
        */

        req.auth = {

            token:
                token,


            sessionId:

                session.session_id ||

                session.sessionId ||

                session.id ||

                null,


            expiresAt:

                session.expires_at ||

                session.expiresAt ||

                null

        };


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
        requireAuth must run before requireAdmin
        -----------------------------------------------------
        */

        if (!req.user) {

            return unauthorized(
                res,
                "Please sign in again."
            );

        }


        const role =
            normalizeRole(
                req.user.role
            );


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
        No authentication token:
        Continue as guest
        -----------------------------------------------------
        */

        const token =
            getRequestToken(
                req
            );


        if (!token) {

            return next();

        }


        /*
        -----------------------------------------------------
        Check session
        -----------------------------------------------------
        */

        const session =
            await getSession(
                token
            );


        if (!session) {

            return next();

        }


        /*
        -----------------------------------------------------
        Extract user
        -----------------------------------------------------
        */

        const rawUser =
            getUserFromSession(
                session
            );


        if (!rawUser) {

            return next();

        }


        const user =
            normalizeUser(
                rawUser
            );


        /*
        -----------------------------------------------------
        Attach user only if valid
        -----------------------------------------------------
        */

        if (
            user &&
            user.id &&
            !isAccountBlocked(user)
        ) {

            req.user =
                user;


            req.auth = {

                token:
                    token,


                sessionId:

                    session.session_id ||

                    session.sessionId ||

                    session.id ||

                    null,


                expiresAt:

                    session.expires_at ||

                    session.expiresAt ||

                    null

            };

        }


        return next();


    } catch (error) {

        /*
        -----------------------------------------------------
        Optional authentication must never
        block a public request.
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

    normalizeUser,

    requireAuth,

    requireAdmin,

    optionalAuth

};
