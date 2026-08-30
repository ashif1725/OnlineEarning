"use strict";

const express = require("express");

const {
    requireAuth
} = require("../middleware/auth");

const pool = require("../config/db");


const router = express.Router();


router.get(
    "/",
    requireAuth,
    async (req, res) => {

        try {

            const limit =
                Math.min(
                    Number(req.query.limit) || 20,
                    100
                );


            const offset =
                Math.max(
                    Number(req.query.offset) || 0,
                    0
                );


            const result =
                await pool.query(
                    `
                    SELECT
                        t.transaction_id,
                        t.type,
                        t.status,
                        t.currency,
                        t.amount,
                        t.description,
                        t.created_at,

                        sender.public_user_id
                            AS sender_user_id,

                        receiver.public_user_id
                            AS receiver_user_id

                    FROM transactions t

                    LEFT JOIN users sender
                        ON sender.id =
                           t.sender_user_id

                    LEFT JOIN users receiver
                        ON receiver.id =
                           t.receiver_user_id

                    WHERE
                        t.sender_user_id = $1
                        OR
                        t.receiver_user_id = $1

                    ORDER BY
                        t.created_at DESC

                    LIMIT $2
                    OFFSET $3
                    `,
                    [
                        req.user.id,
                        limit,
                        offset
                    ]
                );


            res.json({
                success: true,
                transactions:
                    result.rows
            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                error:
                    "TRANSACTION_HISTORY_FAILED"
            });
        }
    }
);


module.exports = router;
