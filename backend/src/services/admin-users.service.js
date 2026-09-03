"use strict";


/*
|--------------------------------------------------------------------------
| DATABASE
|--------------------------------------------------------------------------
*/

const pool =
    require(
        "../config/db"
    );


/*
|--------------------------------------------------------------------------
| GET USERS
|--------------------------------------------------------------------------
*/

async function getUsers({

    search,

    status,

    limit = 25,

    offset = 0

}) {

    const values =
        [];


    const conditions =
        [];


    /*
    ---------------------------------------------------------
    Search
    ---------------------------------------------------------
    */

    if (search) {

        values.push(
            `%${search}%`
        );


        conditions.push(

            `
            (
                u.public_user_id ILIKE $${values.length}

                OR

                u.full_name ILIKE $${values.length}

                OR

                u.email ILIKE $${values.length}
            )
            `

        );

    }


    /*
    ---------------------------------------------------------
    Status filter
    ---------------------------------------------------------
    */

    if (status) {

        values.push(
            status
        );


        conditions.push(

            `
            u.account_status = $${values.length}
            `

        );

    }


    const whereClause =

        conditions.length

            ? `WHERE ${conditions.join(" AND ")}`

            : "";


    /*
    ---------------------------------------------------------
    Pagination
    ---------------------------------------------------------
    */

    values.push(
        limit
    );


    const limitIndex =
        values.length;


    values.push(
        offset
    );


    const offsetIndex =
        values.length;


    /*
    ---------------------------------------------------------
    Query users
    ---------------------------------------------------------
    */

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

                )
                AS available_balance,


                COALESCE(

                    wb.pending_balance,

                    0

                )
                AS pending_balance,


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


/*
|--------------------------------------------------------------------------
| GET USER DETAILS
|--------------------------------------------------------------------------
*/

async function getUserDetails(
    userId
) {

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

                )
                AS available_balance,


                COALESCE(

                    wb.pending_balance,

                    0

                )
                AS pending_balance,


                wb.currency


            FROM users u


            LEFT JOIN wallets w

                ON w.user_id = u.id


            LEFT JOIN wallet_balances wb

                ON wb.wallet_id = w.id


            WHERE

                u.id = $1


            LIMIT 1
            `,

            [
                userId
            ]

        );


    if (
        result.rowCount === 0
    ) {

        return null;

    }


    return result.rows[0];

}


/*
|--------------------------------------------------------------------------
| UPDATE USER STATUS
|--------------------------------------------------------------------------
*/

async function updateUserStatus({

    userId,

    status,

    adminUserId,

    ipAddress,

    userAgent

}) {

    /*
    ---------------------------------------------------------
    Validate user ID
    ---------------------------------------------------------
    */

    if (!userId) {

        const error =
            new Error(
                "USER_NOT_FOUND"
            );


        throw error;

    }


    /*
    ---------------------------------------------------------
    Normalize status
    ---------------------------------------------------------
    */

    const normalizedStatus =
        String(
            status ||
            ""
        )
        .trim()
        .toLowerCase();


    /*
    ---------------------------------------------------------
    Allowed statuses
    ---------------------------------------------------------
    */

    const allowedStatuses =
        [

            "active",

            "inactive",

            "disabled",

            "suspended"

        ];


    if (
        !allowedStatuses.includes(
            normalizedStatus
        )
    ) {

        const error =
            new Error(
                "INVALID_ACCOUNT_STATUS"
            );


        throw error;

    }


    /*
    ---------------------------------------------------------
    Get current user
    ---------------------------------------------------------
    */

    const existingResult =
        await pool.query(

            `
            SELECT

                id,

                account_status

            FROM users

            WHERE id = $1

            LIMIT 1
            `,

            [
                userId
            ]

        );


    if (
        existingResult.rowCount === 0
    ) {

        const error =
            new Error(
                "USER_NOT_FOUND"
            );


        throw error;

    }


    const existingUser =
        existingResult.rows[0];


    /*
    ---------------------------------------------------------
    Status already set
    ---------------------------------------------------------
    */

    if (

        String(
            existingUser.account_status ||
            ""
        )
        .trim()
        .toLowerCase()

        ===

        normalizedStatus

    ) {

        const error =
            new Error(
                "STATUS_ALREADY_SET"
            );


        throw error;

    }


    /*
    ---------------------------------------------------------
    Update status
    ---------------------------------------------------------
    */

    const result =
        await pool.query(

            `
            UPDATE users

            SET

                account_status = $1

            WHERE

                id = $2

            RETURNING

                id,

                public_user_id,

                full_name,

                email,

                role,

                account_status,

                last_login_at,

                created_at
            `,

            [

                normalizedStatus,

                userId

            ]

        );


    /*
    ---------------------------------------------------------
    Return updated user
    ---------------------------------------------------------
    */

    return result.rows[0];

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    getUsers,

    getUserDetails,

    updateUserStatus

};
