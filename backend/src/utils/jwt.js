"use strict";

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
}

const JWT_EXPIRES_IN =
    process.env.JWT_EXPIRES_IN || "1h";


function createAccessToken(user) {

    if (!user || !user.id) {
        throw new Error(
            "USER_DATA_REQUIRED"
        );
    }


    const payload = {
        sub: user.id,

        publicUserId:
            user.publicUserId,

        role:
            user.role
    };


    const token =
        jwt.sign(
            payload,
            JWT_SECRET,
            {
                expiresIn:
                    JWT_EXPIRES_IN,

                issuer:
                    "skillearn-hub",

                audience:
                    "skillearn-hub-users"
            }
        );


    const decoded =
        jwt.decode(token);


    const expiresAt =
        decoded &&
        decoded.exp
            ? new Date(
                decoded.exp * 1000
              ).toISOString()
            : null;


    return {
        token,
        expiresAt
    };
}


function verifyAccessToken(token) {

    if (!token) {
        throw new Error(
            "TOKEN_REQUIRED"
        );
    }


    return jwt.verify(
        token,
        JWT_SECRET,
        {
            issuer:
                "skillearn-hub",

            audience:
                "skillearn-hub-users"
        }
    );
}


module.exports = {
    createAccessToken,
    verifyAccessToken
};
