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
| EXTRACT AUTH TOKEN
|--------------------------------------------------------------------------
*/

function getAuthToken(
    req
) {

    let token =
        null;


    /*
    ---------------------------------------------------------
    Authorization Bearer Token
    ---------------------------------------------------------
    */

    const authorization =
        req.headers.authorization;


    if (
        authorization &&
        typeof authorization === "string" &&
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
| CREATE AUTHENTICATED USER
|--------------------------------------------------------------------------
*/

function createAuthenticatedUser(
    session
) {

    if (!session) {

        return null;

    }


    return {

        id:
            session.user_id,

        userId:
            session.user_id,

        user_id:
            session.user_id,

        publicUserId:
            session.public_user_id,

        public_user_id:
            session.public_user_id,

        fullName:
            session.full_name,

        full_name:
            session.full_name,

        email:
            session.email,

        phone:
            session.phone,

        role:
            session.role,

        accountStatus:
            session.account_status,

        account_status:
            session.account_status,

        emailVerifiedAt:
            session.email_verified_at,

        email_verified_at:
            session.email_verified_at

    };

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
        Get token
        -----------------------------------------------------
        */

        const token =
            getAuthToken(
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
        Invalid or expired session
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
        Create authenticated user
        -----------------------------------------------------
        */

        const user =
            createAuthenticatedUser(
                session
            );


        if (!user) {

            return res.status(401).json({

                success:
                    false,

                message:
                    "User not found."

            });

        }


        /*
        -----------------------------------------------------
        Attach authentication data
        -----------------------------------------------------
        */

        req.user =
            user;


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
        Authentication check
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
        Admin check
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
        Get token
        -----------------------------------------------------
        */

        const token =
            getAuthToken(
                req
            );


        /*
        -----------------------------------------------------
        Authentication is optional
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
        Attach user if session is valid
        -----------------------------------------------------
        */

        if (session) {

            const user =
                createAuthenticatedUser(
                    session
                );


            if (user) {

                req.user =
                    user;

            }


            req.session =
                session;

        }


        return next();


    } catch (error) {

        /*
        Optional authentication should not
        block the request.
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
