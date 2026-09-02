"use strict";

/* =========================================================
   SkillEarn Hub
   Authentication Middleware
========================================================= */

const {
    getSessionByToken
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

        ...user,

        id:
            user.id,

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

        message

    });

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
        Get token
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

        session.service.js must return:
        {
            id,
            token,
            expiresAt,
            user
        }

        OR an equivalent object containing user data.
        -----------------------------------------------------
        */

        const session =
            await getSessionByToken(
                token
            );


        if (!session) {

            return unauthorized(
                res,
                "Your session has expired. Please sign in again."
            );

        }


        /*
        -----------------------------------------------------
        Session user extraction
        -----------------------------------------------------
        */

        const rawUser =

            session.user ||

            session.account ||

            session.userData ||

            null;


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


        if (!user) {

            return unauthorized(
                res
            );

        }


        /*
        -----------------------------------------------------
        Check account status

        Allow null because older accounts may not yet have
        an explicit accountStatus field.
        -----------------------------------------------------
        */

        const status =
            String(
                user.accountStatus ||
                ""
            )
            .trim()
            .toLowerCase();


        if (
            status === "disabled" ||
            status === "suspended" ||
            status === "blocked"
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
        Attach authentication/session data
        -----------------------------------------------------
        */

        req.auth = {

            token,

            sessionId:

                session.id ||

                session.sessionId ||

                null,


            expiresAt:

                session.expiresAt ||

                session.expires_at ||

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
        User must already be authenticated.
        -----------------------------------------------------
        */

        if (!req.user) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "AUTHENTICATION_REQUIRED",

                message:
                    "Please sign in again."

            });

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

        const token =
            getRequestToken(
                req
            );


        /*
        -----------------------------------------------------
        No token = continue as guest
        -----------------------------------------------------
        */

        if (!token) {

            return next();

        }


        const session =
            await getSessionByToken(
                token
            );


        if (!session) {

            return next();

        }


        const rawUser =

            session.user ||

            session.account ||

            session.userData ||

            null;


        if (!rawUser) {

            return next();

        }


        const user =
            normalizeUser(
                rawUser
            );


        if (user) {

            req.user =
                user;


            req.auth = {

                token,

                sessionId:

                    session.id ||

                    session.sessionId ||

                    null,


                expiresAt:

                    session.expiresAt ||

                    session.expires_at ||

                    null

            };

        }


        return next();


    } catch (error) {

        /*
        Optional authentication must never
        block a public request.
        */

        return next();

    }

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    getRequestToken,

    requireAuth,

    requireAdmin,

    optionalAuth

};
