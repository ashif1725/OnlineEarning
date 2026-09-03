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

    if (

        search &&

        String(search).trim()

    ) {

        values.push(
            `%${String(search).trim()}%`
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
    Account status filter
    ---------------------------------------------------------
    */

    if (

        status &&

        String(status).trim()

    ) {

        values.push(
            String(status)
                .trim()
                .toLowerCase()
        );


        conditions.push(

            `u.account_status = $${values.length}`

        );

    }


    /*
    ---------------------------------------------------------
    WHERE clause
    ---------------------------------------------------------
    */

    const whereClause =

        conditions.length

            ? `WHERE ${conditions.join(" AND ")}`

            : "";


    /*
    ---------------------------------------------------------
    Limit
    ---------------------------------------------------------
    */

    values.push(
        limit
    );


    const limitIndex =
        values.length;


    /*
    ---------------------------------------------------------
    Offset
    ---------------------------------------------------------
    */

    values.push(
        offset
    );


    const offsetIndex =
        values.length;


    /*
    ---------------------------------------------------------
    Query
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

        throw new Error(
            "USER_NOT_FOUND"
        );

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

            "suspended",

            "blocked"

        ];


    if (

        !allowedStatuses.includes(
            normalizedStatus
        )

    ) {

        throw new Error(
            "INVALID_ACCOUNT_STATUS"
        );

    }


    /*
    ---------------------------------------------------------
    Get current user
    ---------------------------------------------------------
    */

    const currentResult =
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
        currentResult.rowCount === 0
    ) {

        throw new Error(
            "USER_NOT_FOUND"
        );

    }


    const currentUser =
        currentResult.rows[0];


    /*
    ---------------------------------------------------------
    Same status
    ---------------------------------------------------------
    */

    const currentStatus =
        String(

            currentUser.account_status ||
            ""

        )
        .trim()
        .toLowerCase();


    if (

        currentStatus ===
        normalizedStatus

    ) {

        throw new Error(
            "STATUS_ALREADY_SET"
        );

    }


    /*
    ---------------------------------------------------------
    Update
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

module.exports =
    {

        getUsers,

        getUserDetails,

        updateUserStatus

    };
