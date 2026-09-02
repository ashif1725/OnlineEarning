"use strict";


const {
    registerUser,
    authenticateUser
} = require(
    "../services/auth.service"
);


const {
    createSession,
    revokeSession
} = require(
    "../services/session.service"
);


/* =========================================================
   TOKEN FROM REQUEST
========================================================= */

function getRequestToken(req) {

    const authorization =
        String(
            req.get("authorization") ||
            ""
        ).trim();


    if (

        authorization
            .toLowerCase()
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
   COOKIE OPTIONS
========================================================= */

function getCookieOptions(maxAge) {

    const production =
        process.env.NODE_ENV ===
        "production";


    return {

        httpOnly:
            true,

        secure:
            production,

        sameSite:
            production
                ? "none"
                : "lax",

        maxAge:
            maxAge,

        path:
            "/"

    };

}


/* =========================================================
   REGISTER
========================================================= */

async function register(
    req,
    res
) {

    try {

        const {
            fullName,
            email,
            phone,
            password
        } =
            req.body;


        const user =
            await registerUser({

                fullName,
                email,
                phone,
                password

            });


        return res.status(201).json({

            success:
                true,

            message:
                "Account created successfully",

            user

        });


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );


        if (

            error.code ===
            "ACCOUNT_ALREADY_EXISTS"

        ) {

            return res.status(409).json({

                success:
                    false,

                message:
                    "Email or phone already registered"

            });

        }


        return res.status(500).json({

            success:
                false,

            message:
                "Registration failed"

        });

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function login(
    req,
    res
) {

    try {

        const {
            email,
            password
        } =
            req.body;


        const user =
            await authenticateUser({

                email,
                password

            });


        const session =
            await createSession({

                userId:
                    user.id,

                ipAddress:
                    req.ip,

                userAgent:
                    req.get(
                        "user-agent"
                    )

            });


        const expiresAt =
            new Date(
                session.expiresAt
            );


        const maxAge =
            Math.max(

                0,

                expiresAt.getTime() -
                Date.now()

            );


        res.cookie(

            "skillearn_session",

            session.token,

            getCookieOptions(
                maxAge
            )

        );


        return res.status(200).json({

            success:
                true,

            message:
                "Login successful",

            token:
                session.token,

            expiresAt:
                session.expiresAt,

            user: {

                id:
                    user.id,

                publicUserId:
                    user.publicUserId,

                fullName:
                    user.fullName,

                email:
                    user.email,

                phone:
                    user.phone,

                role:
                    user.role

            }

        });


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        if (

            error.code ===
            "INVALID_CREDENTIALS"

        ) {

            return res.status(401).json({

                success:
                    false,

                message:
                    "Invalid email or password"

            });

        }


        if (

            error.code ===
            "ACCOUNT_LOCKED"

        ) {

            return res.status(423).json({

                success:
                    false,

                message:
                    "Account is temporarily locked"

            });

        }


        if (

            error.code ===
            "ACCOUNT_DISABLED"

        ) {

            return res.status(403).json({

                success:
                    false,

                message:
                    "Account is disabled"

            });

        }


        return res.status(500).json({

            success:
                false,

            message:
                "Login failed"

        });

    }

}


/* =========================================================
   CURRENT USER
========================================================= */

async function me(
    req,
    res
) {

    try {

        if (!req.user) {

            return res.status(401).json({

                success:
                    false,

                message:
                    "Please sign in again."

            });

        }


        return res.status(200).json({

            success:
                true,

            user: {

                id:
                    req.user.id,

                publicUserId:
                    req.user.publicUserId,

                fullName:
                    req.user.fullName,

                email:
                    req.user.email,

                phone:
                    req.user.phone,

                role:
                    req.user.role,

                accountStatus:
                    req.user.accountStatus,

                emailVerified:
                    Boolean(
                        req.user.emailVerifiedAt
                    )

            },

            session: {

                id:
                    req.auth.sessionId,

                expiresAt:
                    req.auth.expiresAt

            }

        });


    } catch (error) {

        console.error(
            "ME ERROR:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                "Unable to load account information"

        });

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout(
    req,
    res
) {

    try {

        const token =
            getRequestToken(
                req
            );


        if (token) {

            await revokeSession(
                token
            );

        }


        res.clearCookie(

            "skillearn_session",

            getCookieOptions(
                0
            )

        );


        return res.status(200).json({

            success:
                true,

            message:
                "Logout successful"

        });


    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                "Logout failed"

        });

    }

}


module.exports = {

    register,

    login,

    me,

    logout

};
