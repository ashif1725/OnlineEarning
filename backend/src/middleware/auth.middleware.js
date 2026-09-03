"use strict";


const {
    getSession
} = require(
    "../services/session.service"
);


/*
|--------------------------------------------------------------------------
| GET AUTH TOKEN
|--------------------------------------------------------------------------
*/

function getAuthToken(
    req
) {

    const authorization =
        String(
            req.get(
                "authorization"
            ) ||
            ""
        )
        .trim();


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


        if (
            token
        ) {

            return token;

        }

    }


    return (

        req.cookies?.skillearn_session ||

        req.cookies?.access_token ||

        req.cookies?.token ||

        null

    );

}


/*
|--------------------------------------------------------------------------
| CREATE AUTH USER
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

        name:
            session.full_name,

        email:
            session.email,

        phone:
            session.phone,

        role:

            String(
                session.role ||
                "user"
            )
            .trim()
            .toLowerCase(),

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

        const token =
            getAuthToken(
                req
            );


        if (!token) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "AUTHENTICATION_REQUIRED",

                message:
                    "Authentication required."

            });

        }


        const session =
            await getSession(
                token
            );


        if (!session) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "INVALID_SESSION",

                message:
                    "Invalid or expired session."

            });

        }


        const user =
            createAuthenticatedUser(
                session
            );


        req.user =
            user;


        req.session =
            session;


        req.auth = {

            sessionId:
                session.session_id ||
                null,

            expiresAt:
                session.expires_at ||
                null

        };


        return next();


    } catch (error) {

        console.error(
            "AUTH MIDDLEWARE ERROR:",
            error
        );


        return res.status(401).json({

            success:
                false,

            error:
                "AUTHENTICATION_FAILED",

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

    if (!req.user) {

        return res.status(401).json({

            success:
                false,

            error:
                "AUTHENTICATION_REQUIRED"

        });

    }


    const role =
        String(
            req.user.role ||
            "user"
        )
        .trim()
        .toLowerCase();


    if (

        role !== "admin" &&

        role !== "administrator"

    ) {

        return res.status(403).json({

            success:
                false,

            error:
                "ADMIN_ACCESS_REQUIRED",

            message:
                "Admin access required."

        });

    }


    return next();

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

        const token =
            getAuthToken(
                req
            );


        if (!token) {

            return next();

        }


        const session =
            await getSession(
                token
            );


        if (!session) {

            return next();

        }


        req.user =
            createAuthenticatedUser(
                session
            );


        req.session =
            session;


        req.auth = {

            sessionId:
                session.session_id ||
                null,

            expiresAt:
                session.expires_at ||
                null

        };


        return next();


    } catch (error) {

        return next();

    }

}


module.exports = {

    getAuthToken,

    createAuthenticatedUser,

    requireAuth,

    requireAdmin,

    optionalAuth

};
