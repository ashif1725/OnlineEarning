"use strict";

const crypto = require("crypto");

const SESSION_DAYS = 7;


function generateSessionToken() {

    return crypto.randomBytes(32).toString("base64url");
}


function hashToken(token) {

    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}


function getSessionExpiry() {

    const expiry = new Date();

    expiry.setDate(
        expiry.getDate() + SESSION_DAYS
    );

    return expiry;
}


module.exports = {
    generateSessionToken,
    hashToken,
    getSessionExpiry
};
