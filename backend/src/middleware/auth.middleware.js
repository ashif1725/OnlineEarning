"use strict";


/*
|--------------------------------------------------------------------------
| SESSION SERVICE
|--------------------------------------------------------------------------
*/

const {
    getSession
} = require(
    "../services/session.service"
);


/*
|--------------------------------------------------------------------------
| EXTRACT TOKEN
|--------------------------------------------------------------------------
*/

function extractToken(
    req
) {

    let token =
        null;


    /*
    ---------------------------------------------------------
    Authorization Header
    ---------------------------------------------------------
    */

    const authorization =
        req.headers.authorization;


    if (
        authorization &&
        authorization.startsWith(
            "Bearer "
        )
    ) {

        token =
            authorization
                .slice(7)
                .trim();

    }


    /*
    ---------------------------------------------------------
    Cookie Token
    ---------------------------------------------------------
    */

    if (
        !token &&
        req.cookies
    ) {

        token =
            req.cookies.access_token ||
            req.cookies.token ||
            null;

    }


    return token;

}


/*
|--------------------------------------------------------------------------
| REQUIRE AUTH
|--------------------------------------------------------------------------
*/

async function requireAuth(
    req,
    res,
    next
) {

    try {

        /*
        -----------------------------------------------------
        Extract token
        -----------------------------------------------------
        */

        const token =
            extractToken(
                req
            );


        /*
        -----------------------------------------------------
        Token missing
        -----------------------------------------------------
        */

        if (!token) {

            return res.status(401).json({

                success:
                    false,

                message:
                    "Authentication required."

            });

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
        -----------------------------------------------------
        */

        if (!session) {

            return res.status(401).json({

                success:
                    false,

                message:
                    "Invalid or expired session."

            });

        }


        /*
        -----------------------------------------------------
        Attach authenticated user
        -----------------------------------------------------

        getSession() returns a flat session object.

        Therefore req.user must be created explicitly.
        -----------------------------------------------------
        */

        req.user = {

            id:
                session.user_id,

            userId:
                session.user_id,

            user_id:
                session.user_id,

            public_user_id:
                session.public_user_id,

            full_name:
                session.full_name,

            email:
                session.email,

            phone:
                session.phone,

            role:
                session.role,

            account_status:
                session.account_status,

            email_verified_at:
                session.email_verified_at

        };


        /*
        -----------------------------------------------------
        Attach session
        -----------------------------------------------------
        */

        req.session =
            session;


        /*
        -----------------------------------------------------
        Continue
        -----------------------------------------------------
        */

        return next();


    } catch (error) {

        console.error(
            "AUTH MIDDLEWARE ERROR:",
            error
        );


        return res.status(401).json({

            success:
                false,

            message:
                "Authentication failed."

        });

    }

}


/*
|--------------------------------------------------------------------------
| REQUIRE ADMIN
|--------------------------------------------------------------------------
*/

function requireAdmin(
    req,
    res,
    next
) {

    try {

        /*
        -----------------------------------------------------
        User missing
        -----------------------------------------------------
        */

        if (!req.user) {

            return res.status(401).json({

                success:
                    false,

                message:
                    "Authentication required."

            });

        }


        /*
        -----------------------------------------------------
        Get role
        -----------------------------------------------------
        */

        const role =
            String(

                req.user.role ||

                req.user.account_role ||

                ""

            )
            .trim()
            .toLowerCase();


        /*
        -----------------------------------------------------
        Verify admin
        -----------------------------------------------------
        */

        if (
            role !== "admin" &&
            role !== "administrator"
        ) {

            return res.status(403).json({

                success:
                    false,

                message:
                    "Admin access required."

            });

        }


        /*
        -----------------------------------------------------
        Continue
        -----------------------------------------------------
        */

        return next();


    } catch (error) {

        console.error(
            "ADMIN MIDDLEWARE ERROR:",
            error
        );


        return res.status(403).json({

            success:
                false,

            message:
                "Unable to verify admin access."

        });

    }

}


/*
|--------------------------------------------------------------------------
| OPTIONAL AUTH
|--------------------------------------------------------------------------
*/

async function optionalAuth(
    req,
    res,
    next
) {

    try {

        /*
        -----------------------------------------------------
        Extract token
        -----------------------------------------------------
        */

        const token =
            extractToken(
                req
            );


        /*
        -----------------------------------------------------
        No token

        Authentication is optional, so continue normally.
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
        Attach user if valid session exists
        -----------------------------------------------------
        */

        if (session) {

            req.user = {

                id:
                    session.user_id,

                userId:
                    session.user_id,

                user_id:
                    session.user_id,

                public_user_id:
                    session.public_user_id,

                full_name:
                    session.full_name,

                email:
                    session.email,

                phone:
                    session.phone,

                role:
                    session.role,

                account_status:
                    session.account_status,

                email_verified_at:
                    session.email_verified_at

            };


            req.session =
                session;

        }


        /*
        -----------------------------------------------------
        Continue
        -----------------------------------------------------
        */

        return next();


    } catch (error) {

        /*
        Optional authentication must never block request.
        */

        return next();

    }

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    requireAuth,

    requireAdmin,

    optionalAuth

};
