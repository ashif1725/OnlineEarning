"use strict";

const {
    registerUser,
    authenticateUser
} =
    require("../services/auth.service");


const {
    createSession,
    revokeSession
} =
    require("../services/session.service");


/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

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
        } = req.body;


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


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

async function login(
    req,
    res
) {

    try {

        const {
            email,
            password
        } = req.body;


        const user =
            await authenticateUser({
                email,
                password
            });


        if (!user) {

            return res.status(401).json({

                success:
                    false,

                message:
                    "Invalid email or password"

            });
        }


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
            {

                httpOnly:
                    true,

                secure:
                    process.env.NODE_ENV ===
                    "production",

                sameSite:
                    "lax",

                maxAge,

                path:
                    "/"

            }
        );


        return res.status(200).json({

            success:
                true,

            message:
                "Login successful",

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


/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

async function me(
    req,
    res
) {

    return res.status(200).json({

        success:
            true,

        user: {

            publicUserId:
                req.auth.publicUserId,

            fullName:
                req.auth.fullName,

            email:
                req.auth.email,

            phone:
                req.auth.phone,

            role:
                req.auth.role,

            accountStatus:
                req.auth.accountStatus,

            emailVerified:
                req.auth.emailVerified

        }

    });
}


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

async function logout(
    req,
    res
) {

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
            {

                httpOnly:
                    true,

                secure:
                    process.env.NODE_ENV ===
                    "production",

                sameSite:
                    "lax",

                path:
                    "/"

            }
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
    logout,
    me

};
