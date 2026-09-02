"use strict";


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


    if (

        authorization.toLowerCase()
            .startsWith("bearer ")

    ) {

        return authorization
            .slice(7)
            .trim();

    }


    if (

        req.cookies &&
        req.cookies.skillearn_session

    ) {

        return req.cookies.skillearn_session;

    }


    return null;

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

        const token =
            getRequestToken(
                req
            );


        if (!token) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "AUTHENTICATION_REQUIRED",

                message:
                    "Please sign in to continue."

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
                    "Your session has expired. Please sign in again."

            });

        }


        req.auth = {

            token,

            sessionId:
                session.session_id,

            userId:
                session.user_id,

            expiresAt:
                session.expires_at

        };


        req.user = {

            id:
                session.user_id,

            publicUserId:
                session.public_user_id,

            fullName:
                session.full_name,

            email:
                session.email,

            phone:
                session.phone,

            role:
                session.role,

            accountStatus:
                session.account_status,

            emailVerifiedAt:
                session.email_verified_at

        };


        next();


    } catch (error) {

        console.error(
            "AUTH MIDDLEWARE ERROR:",
            error
        );


        return res.status(500).json({

            success:
                false,

            error:
                "AUTHENTICATION_ERROR",

            message:
                "Unable to verify your session."

        });

    }

}


module.exports = {

    requireAuth,

    getRequestToken

};
