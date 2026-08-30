"use strict";

const jwt = require("jsonwebtoken");

const {
    registerUser,
    authenticateUser
} = require("../services/auth.service");


function createAccessToken(user) {

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is required");
    }


    return jwt.sign(
        {
            sub: user.id,
            role: user.role,
            userId: user.publicUserId
        },

        process.env.JWT_SECRET,

        {
            expiresIn: "15m",
            issuer: "skillearn-hub",
            audience: "skillearn-client"
        }
    );
}


async function register(req, res) {

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


        res.status(201).json({

            success: true,

            user: {
                userId: user.public_user_id,
                name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role
            },

            message:
                "Account created successfully."
        });


    } catch (error) {

        if (
            error.code ===
            "ACCOUNT_ALREADY_EXISTS"
        ) {

            return res.status(409).json({
                success: false,
                error: "ACCOUNT_ALREADY_EXISTS"
            });
        }


        console.error(error);

        res.status(500).json({
            success: false,
            error: "REGISTRATION_FAILED"
        });
    }
}


async function login(req, res) {

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


        const accessToken =
            createAccessToken(user);


        res.status(200).json({

            success: true,

            accessToken,

            user: {
                userId: user.publicUserId,
                name: user.fullName,
                email: user.email,
                role: user.role
            }
        });


    } catch (error) {

        if (
            error.message ===
            "INVALID_CREDENTIALS"
        ) {

            return res.status(401).json({
                success: false,
                error: "INVALID_CREDENTIALS"
            });
        }


        if (
            error.message ===
            "ACCOUNT_UNAVAILABLE"
        ) {

            return res.status(403).json({
                success: false,
                error: "ACCOUNT_UNAVAILABLE"
            });
        }


        console.error(error);

        res.status(500).json({
            success: false,
            error: "LOGIN_FAILED"
        });
    }
}


module.exports = {
    register,
    login
};
