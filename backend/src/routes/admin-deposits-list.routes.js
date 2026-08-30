"use strict";

const express = require("express");

const pool = require("../config/db");

const {
    requireAuth
} = require("../middleware/auth");

const {
    requireAdmin
} = require("../middleware/admin");


const router = express.Router();


router.get(
    "/",
    requireAuth,
    requireAdmin,

    async (req, res) => {

        try {

            const status =
                req.query.status ||
                "PENDING";


            const result =
                await pool.query(
                    `
                    SELECT
                        d.deposit_id,
                        d.amount,
                        d.currency,
                        d.utr_number,
                        d.status,
                        d.user_note,
                        d.admin_note,
                        d.submitted_at,
                        d.reviewed_at,

                        u.public_user_id,
                        u.full_name,
                        u.email

                    FROM deposits d

                    JOIN users u
                        ON u.id = d.user_id

                    WHERE d.status = $1

                    ORDER BY
                        d.created_at DESC

                    LIMIT 100
                    `,
                    [status]
                );


            res.json({
                success: true,
                deposits: result.rows
            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                error:
                    "ADMIN_DEPOSITS_FETCH_FAILED"
            });
        }
    }
);


module.exports = router;
