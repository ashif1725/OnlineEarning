"use strict";

const {
    registerUser,
    authenticateUser
} = require("../services/auth.service");

const {
    createSession
} = require("../services/session.service");

const {
    createAccessToken
} = require("../utils/jwt");


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


        // Validation
        if (
            !fullName ||
            !email ||
            !phone ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }


        const user = await registerUser({
            fullName,
            email,
            phone,
            password
        });


        return res.status(201).json({
            success: true,
            message: "Account created successfully",
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
                    "Email or phone already registered"
            });
        }


        return res.status(500).json({
            success: false,
            message: "Registration failed"
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


        // Validation
        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | Authenticate user
        |--------------------------------------------------------------------------
        */

        const user =
            await authenticateUser({
                email,
                password
            });


        /*
        |--------------------------------------------------------------------------
        | Create JWT access token
        |--------------------------------------------------------------------------
        */

        const {
            token,
            expiresAt
        } = createAccessToken(user);


        /*
        |--------------------------------------------------------------------------
        | Create login session
        |--------------------------------------------------------------------------
        */

        const session =
            await createSession({
                userId: user.id,
                token,
                expiresAt
            });


        /*
        |--------------------------------------------------------------------------
        | Login successful
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            message:
                "Login successful",

            token,

            expiresAt,

            sessionId:
                session.id,

            user: {
                id: user.id,
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


        /*
        |--------------------------------------------------------------------------
        | Invalid credentials
        |--------------------------------------------------------------------------
        */

        if (
            error.message ===
            "INVALID_CREDENTIALS"
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | Account unavailable
        |--------------------------------------------------------------------------
        */

        if (
            error.message ===
            "ACCOUNT_UNAVAILABLE"
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Your account is currently unavailable"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | Server error
        |--------------------------------------------------------------------------
        */

        return res.status(500).json({
            success: false,
            message:
                "Login failed. Please try again."
        });
    }
}


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
    register,
    login
};
