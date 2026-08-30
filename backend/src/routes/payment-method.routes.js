"use strict";

const express = require("express");
const pool = require("../config/db");

const router = express.Router();


router.get(
    "/active",
    async (req, res) => {

        try {

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        method_type,
                        display_name,
                        upi_id,
                        qr_image_url,
                        instructions

                    FROM payment_methods

                    WHERE is_active = TRUE

                    ORDER BY created_at ASC
                    `
                );


            res.json({
                success: true,
                methods: result.rows
            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                error:
                    "PAYMENT_METHOD_FETCH_FAILED"
            });
        }
    }
);


module.exports = router;
