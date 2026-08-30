"use strict";

const crypto = require("crypto");

function generatePublicUserId() {

    const randomPart = crypto
        .randomBytes(5)
        .toString("hex")
        .toUpperCase();

    return `USR-${randomPart}`;
}

module.exports = {
    generatePublicUserId
};
