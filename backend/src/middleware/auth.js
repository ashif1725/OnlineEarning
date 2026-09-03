"use strict";


const {
    getSession
} = require("../services/session.service");


/*
|--------------------------------------------------------------------------
| EXTRACT AUTH TOKEN
|--------------------------------------------------------------------------
|
| Supports:
|
| 1. Authorization: Bearer TOKEN
|
| 2. Cookie:
|    skillearn_session=TOKEN
|
|--------------------------------------------------------------------------
*/

function getRequestToken(
    req
) {


    /*
    ---------------------------------------------------------
    Authorization Header
    ---------------------------------------------------------
    */

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
                .slice(
                    7
                )
                .trim();


        if (
            token
        ) {

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


        return String(
            req.cookies.skillearn_session
        )
        .trim();

    }


    return null;

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
            getRequestToken(
                req
            );


        /*
        -----------------------------------------------------
        No token
        -----------------------------------------------------
        */

        if (
            !token
        ) {

            return res.status(
                401
            )
            .json({

                success:
                    false,

                error:
                    "AUTHENTICATION_REQUIRED",

                message:
                    "Please sign in."

            });

        }


        /*
        -----------------------------------------------------
        Validate Session
        -----------------------------------------------------
        */

        const session =
            await getSession(
                token
            );


        if (
            !session
        ) {

            return res.status(
                401
            )
            .json({

                success:
                    false,

                error:
                    "INVALID_SESSION",

                message:
                    "Your session has expired. Please sign in again."

            });

        }


        /*
        -----------------------------------------------------
        Attach User
        -----------------------------------------------------
        */

        req.user = {

            id:
                session.user_id,

            userId:
                session.public_user_id,

            name:
                session.full_name,

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


        /*
        -----------------------------------------------------
        Attach Auth / Session Info
        -----------------------------------------------------
        */

        req.auth = {

            sessionId:
                session.session_id,

            userId:
                session.user_id,

            expiresAt:
                session.expires_at

        };


        return next();


    } catch (
        error
    ) {


        console.error(
            "AUTHENTICATION ERROR:",
            error
        );


        return res.status(
            500
        )
        .json({

            success:
                false,

            error:
                "AUTHENTICATION_FAILED",

            message:
                "Unable to authenticate request."

        });

    }

}


module.exports = {

    requireAuth,

    getRequestToken

};
