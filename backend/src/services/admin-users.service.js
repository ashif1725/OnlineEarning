"use strict";

const pool = require("../config/db");


async function getUsers({
    search,
    status,
    limit = 25,
    offset = 0
}) {

    const values = [];
    const conditions = [];


    if (search) {

        values.push(`%${search}%`);

        conditions.push(`
            (
                u.public_user_id ILIKE $${values.length}
                OR
                u.full_name ILIKE $${values.length}
                OR
                u.email ILIKE $${values.length}
            )
        `);
    }


    if (status) {

        values.push(status);

        conditions.push(
            `u.account_status = $${values.length}`
        );
    }


    const whereClause =
        conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";


    values.push(limit);

    const limitIndex =
        values.length;


    values.push(offset);

    const offsetIndex =
        values.length;


    const result =
        await pool.query(
            `
            SELECT
                u.id,
                u.public_user_id,
                u.full_name,
                u.email,
                u.role,
                u.account_status,
                u.last_login_at,
                u.created_at,

                COALESCE(
                    wb.available_balance,
                    0
                ) AS available_balance,

                COALESCE(
                    wb.pending_balance,
                    0
                ) AS pending_balance,

                wb.currency

            FROM users u

            LEFT JOIN wallets w
                ON w.user_id = u.id

            LEFT JOIN wallet_balances wb
                ON wb.wallet_id = w.id

            ${whereClause}

            ORDER BY
                u.created_at DESC

            LIMIT $${limitIndex}
            OFFSET $${offsetIndex}
            `,
            values
        );


    return result.rows;
}


async function getUserDetails(userId) {

    const result =
        await pool.query(
            `
            SELECT
                u.id,
                u.public_user_id,
                u.full_name,
                u.email,
                u.role,
                u.account_status,
                u.last_login_at,
                u.created_at,

                COALESCE(
                    wb.available_balance,
                    0
                ) AS available_balance,

                COALESCE(
                    wb.pending_balance,
                    0
                ) AS pending_balance,

                wb.currency

            FROM users u

            LEFT JOIN wallets w
                ON w.user_id = u.id

            LEFT JOIN wallet_balances wb
                ON wb.wallet_id = w.id

            WHERE u.id = $1

            LIMIT 1
            `,
            [userId]
        );


    if (result.rowCount === 0) {
        return null;
    }


    return result.rows[0];
}


module.exports = {
    getUsers,
    getUserDetails
};
