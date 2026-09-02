"use strict";


const jwt =
    require(
        "jsonwebtoken"
    );


/* =========================================================
   GET TOKEN FROM REQUEST
========================================================= */

function getTokenFromRequest(
    req
) {

    /*
    ---------------------------------------------------------
    1. Authorization Header
    ---------------------------------------------------------
    */

    const authorization =
        String(
            req.headers.authorization || ""
        )
        .trim();


    if (
        authorization.startsWith(
            "Bearer "
        )
    ) {

        const token =
            authorization
                .slice(
                    7
                )
                .trim();


        if (token) {

            return token;

        }

    }


    /*
    ---------------------------------------------------------
    2. Cookies

    Supports multiple possible cookie names so the middleware
    remains compatible with the existing frontend/backend.
    ---------------------------------------------------------
    */

    const cookieToken =

        req.cookies?.token ||

        req.cookies?.access_token ||

        req.cookies?.accessToken ||

        req.cookies?.skillearn_access_token ||

        null;


    if (
        cookieToken
    ) {

        return String(
            cookieToken
        )
        .trim();

    }


    return null;

}


/* =========================================================
   AUTHENTICATION MIDDLEWARE
========================================================= */

function requireAuth(
    req,
    res,
    next
) {

    try {

        const token =
            getTokenFromRequest(
                req
            );


        if (!token) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "UNAUTHORIZED",

                message:
                    "Authentication token is required."

            });

        }


        const secret =
            process.env.JWT_SECRET;


        if (!secret) {

            console.error(
                "JWT_SECRET is missing from environment variables."
            );


            return res.status(500).json({

                success:
                    false,

                error:
                    "SERVER_CONFIGURATION_ERROR",

                message:
                    "Authentication service is not configured."

            });

        }


        /*
        -----------------------------------------------------
        Verify JWT
        -----------------------------------------------------
        */

        const decoded =
            jwt.verify(
                token,
                secret
            );


        /*
        -----------------------------------------------------
        Normalize authenticated user
        -----------------------------------------------------
        */

        const userId =

            decoded.id ||

            decoded.userId ||

            decoded.user_id ||

            decoded.sub ||

            null;


        if (!userId) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "INVALID_TOKEN",

                message:
                    "Authentication token does not contain a valid user ID."

            });

        }


        /*
        -----------------------------------------------------
        Attach normalized user to request
        -----------------------------------------------------
        */

        req.user = {

            ...decoded,

            id:
                userId,

            userId:
                userId

        };


        return next();

    } catch (error) {

        console.error(
            "AUTH MIDDLEWARE ERROR:",
            error.message
        );


        /*
        -----------------------------------------------------
        Token expired
        -----------------------------------------------------
        */

        if (
            error.name ===
            "TokenExpiredError"
        ) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "TOKEN_EXPIRED",

                message:
                    "Your session has expired. Please login again."

            });

        }


        /*
        -----------------------------------------------------
        Invalid token
        -----------------------------------------------------
        */

        return res.status(401).json({

            success:
                false,

            error:
                "INVALID_TOKEN",

            message:
                "Invalid authentication token."

        });

    }

}


/* =========================================================
   OPTIONAL AUTH MIDDLEWARE
========================================================= */

function optionalAuth(
    req,
    res,
    next
) {

    const token =
        getTokenFromRequest(
            req
        );


    if (!token) {

        return next();

    }


    const secret =
        process.env.JWT_SECRET;


    if (!secret) {

        return next();

    }


    try {

        const decoded =
            jwt.verify(
                token,
                secret
            );


        const userId =

            decoded.id ||

            decoded.userId ||

            decoded.user_id ||

            decoded.sub ||

            null;


        if (userId) {

            req.user = {

                ...decoded,

                id:
                    userId,

                userId:
                    userId

            };

        }

    } catch (error) {

        /*
        Invalid token is ignored in optional authentication.
        Protected routes must use requireAuth.
        */

    }


    return next();

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports =
    requireAuth;


module.exports.requireAuth =
    requireAuth;


module.exports.optionalAuth =
    optionalAuth;


module.exports.getTokenFromRequest =
    getTokenFromRequest;
