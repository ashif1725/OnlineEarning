"use strict";

/* =========================================================
   SkillEarn Hub
   Authentication Controller
========================================================= */

const {
    registerUser,
    authenticateUser
} = require("../services/auth.service");

const {
    createSession,
    revokeSession
} = require("../services/session.service");


/* =========================================================
   COOKIE OPTIONS
========================================================= */

function getCookieOptions(maxAge) {

    const production =
        process.env.NODE_ENV === "production";


    const options = {

        httpOnly:
            true,

        secure:
            production,

        sameSite:
            production
                ? "none"
                : "lax",

        path:
            "/"

    };


    if (
        Number.isFinite(maxAge) &&
        maxAge > 0
    ) {

        options.maxAge =
            maxAge;

    }


    return options;

}


/* =========================================================
   NORMALIZE ROLE
========================================================= */

function normalizeRole(role) {

    const normalized =
        String(
            role ||
            "user"
        )
            .trim()
            .toLowerCase();


    if (
        normalized === "admin" ||
        normalized === "administrator"
    ) {

        return "admin";

    }


    return "user";

}


/* =========================================================
   CREATE SAFE USER RESPONSE
========================================================= */

function createUserResponse(user) {

    if (!user) {

        return null;

    }


    return {

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
   EXTRACT SESSION TOKEN
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

        const token =
            authorization
                .slice(7)
                .trim();


        if (token) {

            return token;

        }

    }


    if (
        req.cookies &&
        req.cookies.skillearn_session
    ) {

        return String(
            req.cookies.skillearn_session
        ).trim();

    }


    return null;

}


/* =========================================================
   REGISTER
========================================================= */

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

                success:
                    false,

                error:
                    "INVALID_REQUEST",

                message:
                    "All fields are required."

            });

        }


        const user =
            await registerUser({

                fullName:
                    String(fullName)
                        .trim(),

                email:
                    String(email)
                        .trim()
                        .toLowerCase(),

                phone:
                    String(phone)
                        .trim(),

                password

            });


        return res.status(201).json({

            success:
                true,

            message:
                "Account created successfully.",

            user:
                createUserResponse(
                    user
                )

        });


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );


        if (
            error?.code ===
            "ACCOUNT_ALREADY_EXISTS"
        ) {

            return res.status(409).json({

                success:
                    false,

                error:
                    "ACCOUNT_ALREADY_EXISTS",

                message:
                    "Email or phone already registered."

            });

        }


        return res.status(500).json({

            success:
                false,

            error:
                "REGISTER_FAILED",

            message:
                "Registration failed. Please try again."

        });

    }

}


/* =========================================================
   LOGIN
========================================================= */

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

                success:
                    false,

                error:
                    "INVALID_REQUEST",

                message:
                    "Email and password are required."

            });

        }


        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        /* =================================================
           AUTHENTICATE USER
        ================================================= */

        const user =
            await authenticateUser({

                email:
                    normalizedEmail,

                password

            });


        if (!user) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "INVALID_CREDENTIALS",

                message:
                    "Invalid email or password."

            });

        }


        /* =================================================
           CREATE SESSION
        ================================================= */

        const session =
            await createSession({

                userId:
                    user.id,

                ipAddress:
                    req.ip,

                userAgent:
                    req.get(
                        "user-agent"
                    ) || null

            });


        if (
            !session ||
            !session.token
        ) {

            throw new Error(
                "Unable to create login session."
            );

        }


        /* =================================================
           CALCULATE COOKIE MAX AGE
        ================================================= */

        let maxAge;


        if (
            session.expiresAt
        ) {

            const expiresAt =
                new Date(
                    session.expiresAt
                );


            const difference =
                expiresAt.getTime() -
                Date.now();


            if (
                Number.isFinite(
                    difference
                ) &&
                difference > 0
            ) {

                maxAge =
                    difference;

            }

        }


        /* =================================================
           SET SESSION COOKIE
        ================================================= */

        res.cookie(

            "skillearn_session",

            session.token,

            getCookieOptions(
                maxAge
            )

        );


        /* =================================================
           SAFE USER
        ================================================= */

        const safeUser =
            createUserResponse(
                user
            );


        /* =================================================
           REDIRECT VALUE
           
           Frontend can use this if needed.
        ================================================= */

        const redirect =
            safeUser.role === "admin"
                ? "admin/dashboard.html"
                : "user/dashboard.html";


        /* =================================================
           LOGIN RESPONSE

           IMPORTANT:
           token is returned because GitHub Pages frontend
           and Render backend are different origins.

           config.js stores this token and sends:
           Authorization: Bearer TOKEN
        ================================================= */

        return res.status(200).json({

            success:
                true,

            message:
                "Login successful.",

            token:
                session.token,

            expiresAt:
                session.expiresAt ||
                null,

            redirect,

            user:
                safeUser

        });


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        if (
            error?.code ===
            "INVALID_CREDENTIALS"
        ) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "INVALID_CREDENTIALS",

                message:
                    "Invalid email or password."

            });

        }


        if (
            error?.code ===
            "ACCOUNT_LOCKED"
        ) {

            return res.status(423).json({

                success:
                    false,

                error:
                    "ACCOUNT_LOCKED",

                message:
                    "Account is temporarily locked."

            });

        }


        if (
            error?.code ===
            "ACCOUNT_DISABLED"
        ) {

            return res.status(403).json({

                success:
                    false,

                error:
                    "ACCOUNT_DISABLED",

                message:
                    "Account is disabled."

            });

        }


        return res.status(500).json({

            success:
                false,

            error:
                "LOGIN_FAILED",

            message:
                "Login failed. Please try again."

        });

    }

}


/* =========================================================
   CURRENT AUTHENTICATED USER
========================================================= */

async function me(req, res) {

    try {

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


        const safeUser =
            createUserResponse(
                req.user
            );


        return res.status(200).json({

            success:
                true,

            user: {

                ...safeUser,

                emailVerified:
                    Boolean(
                        req.user.emailVerifiedAt ||
                        req.user.email_verified_at
                    )

            },

            session: {

                id:
                    req.auth?.sessionId ||
                    null,

                expiresAt:
                    req.auth?.expiresAt ||
                    null

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

            error:
                "ME_FAILED",

            message:
                "Unable to load account information."

        });

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout(req, res) {

    try {

        const token =
            getRequestToken(
                req
            );


        if (token) {

            try {

                await revokeSession(
                    token
                );

            } catch (sessionError) {

                console.warn(
                    "SESSION REVOKE ERROR:",
                    sessionError
                );

            }

        }


        res.clearCookie(

            "skillearn_session",

            {

                httpOnly:
                    true,

                secure:
                    process.env.NODE_ENV ===
                    "production",

                sameSite:
                    process.env.NODE_ENV ===
                    "production"
                        ? "none"
                        : "lax",

                path:
                    "/"

            }

        );


        return res.status(200).json({

            success:
                true,

            message:
                "Logout successful."

        });


    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );


        try {

            res.clearCookie(

                "skillearn_session",

                {

                    httpOnly:
                        true,

                    secure:
                        process.env.NODE_ENV ===
                        "production",

                    sameSite:
                        process.env.NODE_ENV ===
                        "production"
                            ? "none"
                            : "lax",

                    path:
                        "/"

                }

            );

        } catch (
            clearCookieError
        ) {

            console.warn(
                "CLEAR COOKIE ERROR:",
                clearCookieError
            );

        }


        return res.status(200).json({

            success:
                true,

            message:
                "Logged out."

        });

    }

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    register,

    login,

    me,

    logout,

    getRequestToken

};
