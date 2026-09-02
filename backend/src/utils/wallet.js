"use strict";

const crypto = require("crypto");


/*
|--------------------------------------------------------------------------
| Generate Transaction ID
|--------------------------------------------------------------------------
*/

function generateTransactionId() {

    return crypto.randomUUID();

}


/*
|--------------------------------------------------------------------------
| Generate Idempotency Key
|--------------------------------------------------------------------------
*/

function generateIdempotencyKey() {

    return crypto.randomUUID();

}


/*
|--------------------------------------------------------------------------
| Normalize Amount
|--------------------------------------------------------------------------
*/

function normalizeAmount(value) {

    const amount =
        Number(value);


    if (!Number.isFinite(amount)) {
        return null;
    }


    if (amount <= 0) {
        return null;
    }


    return Number(
        amount.toFixed(2)
    );
}


module.exports = {

    generateTransactionId,

    generateIdempotencyKey,

    normalizeAmount

};
