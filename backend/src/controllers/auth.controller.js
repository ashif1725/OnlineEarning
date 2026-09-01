"use strict";


const {
    registerUser,
    authenticateUser
} = require("../services/auth.service");


const {
    createSession,
    getSession,
    revokeSession
} = require("../services/session.service");


/*
|--------------------------------------------------------------------------
| COOKIE OPTIONS
|--------------------------------------------------------------------------
*/

function getCookieOptions(maxAge) {

    const isProduction =
        process.env.NODE_ENV === "production";


    return {

        httpOnly: true,

        secure:
            isProduction,

        sameSite:
            isProduction
                ? "none"
                : "lax",

        maxAge,

        path: "/"

    };
}


/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

async function register(req, res) {

    try {

        const {
            fullName,
            email,
            phone,
            password
        } = req.body;


        if (
            !fullName ||
            !email ||
            !phone ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "All fields are required."

            });
        }


        const user =
            await registerUser({

                fullName,
                email,
                phone,
                password

            });


        return res.status(201).json({

            success: true,

            message:
                "Account created successfully.",

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

                success: false,

                message:
                    "Email or phone already registered."

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Registration failed."

        });
    }
}


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

async function login(req, res) {

    try {

        const {
            email,
            password
        } = req.body;


        if (
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required."

            });
        }


        /*
        |--------------------------------------------------------------------------
        | AUTHENTICATE
        |--------------------------------------------------------------------------
        */

        const user =
            await authenticateUser({

                email,
                password

            });


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });
        }


        /*
        |--------------------------------------------------------------------------
        | CREATE SERVER SESSION
        |--------------------------------------------------------------------------
        */

        const session =
            await createSession({

                userId:
                    user.id,

                ipAddress:
                    req.ip,

                userAgent:
                    req.get("user-agent")

            });


        /*
        |--------------------------------------------------------------------------
        | SESSION COOKIE
        |--------------------------------------------------------------------------
        */

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

            getCookieOptions(maxAge)

        );


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            expiresAt:
                session.expiresAt,

            sessionId:
                session.id,

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
                    user.role,

                accountStatus:
                    user.accountStatus ||
                    user.account_status ||
                    null,

                emailVerified:
                    Boolean(
                        user.emailVerifiedAt ||
                        user.email_verified_at
                    )

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

                success: false,

                message:
                    "Invalid email or password."

            });
        }


        if (
            error.code ===
            "ACCOUNT_LOCKED"
        ) {

            return res.status(423).json({

                success: false,

                message:
                    "Account is temporarily locked."

            });
        }


        if (
            error.code ===
            "ACCOUNT_DISABLED"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Account is disabled."

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Login failed."

        });
    }
}


/*
|--------------------------------------------------------------------------
| CURRENT USER / ME
|--------------------------------------------------------------------------
*/

async function me(req, res) {

    try {

        const token =
            req.cookies &&
            req.cookies.skillearn_session;


        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "Not authenticated."

            });
        }


        const session =
            await getSession(token);


        if (!session) {

            return res.status(401).json({

                success: false,

                message:
                    "Session expired or invalid."

            });
        }


        return res.status(200).json({

            success: true,

            user: {

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

                emailVerified:
                    Boolean(
                        session.email_verified_at
                    )

            }

        });


    } catch (error) {

        console.error(
            "ME ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load account."

        });
    }
}


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

async function logout(req, res) {

    try {

        const token =
            req.cookies &&
            req.cookies.skillearn_session;


        if (token) {

            await revokeSession(
                token
            );
        }


        res.clearCookie(

            "skillearn_session",

            getCookieOptions(0)

        );


        return res.status(200).json({

            success: true,

            message:
                "Logout successful."

        });


    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Logout failed."

        });
    }
}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    register,

    login,

    me,

    logout

};
