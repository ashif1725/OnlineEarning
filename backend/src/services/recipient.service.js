"use strict";

const pool = require("../config/db");


async function findRecipientByUserId(
    publicUserId
) {

    const result = await pool.query(
        `
        SELECT
            id,
            public_user_id,
            full_name,
            account_status
        FROM users
        WHERE public_user_id = $1
        LIMIT 1
        `,
        [publicUserId]
    );


    if (result.rowCount === 0) {
        return null;
    }


    const user = result.rows[0];


    if (
        user.account_status !== "active"
    ) {
        return null;
    }


    return {
        id: user.id,
        userId: user.public_user_id,
        name: user.full_name
    };
}


module.exports = {
    findRecipientByUserId
};
