"use strict";

const {
    getSessionByToken
} = require(
    "../services/session.service"
);


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

        let token =
            null;


        /*
        |--------------------------------------------------------------------------
        | Authorization Bearer Token
        |--------------------------------------------------------------------------
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
                authorization.slice(
                    7
                );

        }


        /*
        |--------------------------------------------------------------------------
        | Cookie Token
        |--------------------------------------------------------------------------
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


        if (!token) {

            return res.status(
                401
            ).json(
                {
                    success:
                        false,

                    message:
                        "Authentication required."
                }
            );

        }


        const session =
            await getSessionByToken(
                token
            );


        if (!session) {

            return res.status(
                401
            ).json(
                {
                    success:
                        false,

                    message:
                        "Invalid or expired session."
                }
            );

        }


        const user =
            session.user ||
            session;


        if (!user) {

            return res.status(
                401
            ).json(
                {
                    success:
                        false,

                    message:
                        "User not found."
                }
            );

        }


        req.user =
            user;


        req.session =
            session;


        next();


    } catch (error) {

        console.error(
            "AUTH MIDDLEWARE ERROR:",
            error
        );


        return res.status(
            401
        ).json(
            {
                success:
                    false,

                message:
                    "Authentication failed."
            }
        );

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

        if (!req.user) {

            return res.status(
                401
            ).json(
                {
                    success:
                        false,

                    message:
                        "Authentication required."
                }
            );

        }


        const role =
            String(
                req.user.role ||
                req.user.account_role ||
                ""
            )
                .trim()
                .toLowerCase();


        if (
            role !== "admin"
        ) {

            return res.status(
                403
            ).json(
                {
                    success:
                        false,

                    message:
                        "Admin access required."
                }
            );

        }


        next();


    } catch (error) {

        console.error(
            "ADMIN MIDDLEWARE ERROR:",
            error
        );


        return res.status(
            403
        ).json(
            {
                success:
                    false,

                message:
                    "Unable to verify admin access."
            }
        );

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

        let token =
            null;


        const authorization =
            req.headers.authorization;


        if (
            authorization &&
            authorization.startsWith(
                "Bearer "
            )
        ) {

            token =
                authorization.slice(
                    7
                );

        }


        if (
            !token &&
            req.cookies
        ) {

            token =
                req.cookies.access_token ||
                req.cookies.token ||
                null;

        }


        if (!token) {

            return next();

        }


        const session =
            await getSessionByToken(
                token
            );


        if (session) {

            req.session =
                session;


            req.user =
                session.user ||
                session;

        }


        next();


    } catch (error) {

        next();

    }

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports =
    {
        requireAuth,
        requireAdmin,
        optionalAuth
    };
