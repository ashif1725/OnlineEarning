"use strict";

const express = require("express");
const { z } = require("zod");

const {
    register,
    login,
    logout,
    me
} = require("../controllers/auth.controller");

const router = express.Router();


/* =========================================================
   VALIDATION SCHEMAS
========================================================= */

const registerSchema = z.object({

    fullName:
        z.string()
            .trim()
            .min(2)
            .max(80),

    email:
        z.string()
            .trim()
            .email()
            .max(160),

    phone:
        z.string()
            .trim()
            .min(8)
            .max(20),

    password:
        z.string()
            .min(12)
            .max(128)

});


const loginSchema = z.object({

    email:
        z.string()
            .trim()
            .email()
            .max(160),

    password:
        z.string()
            .min(1)
            .max(128)

});


/* =========================================================
   VALIDATION MIDDLEWARE
========================================================= */

function validate(schema) {

    return (req, res, next) => {

        const result =
            schema.safeParse(req.body);

        if (!result.success) {

            return res.status(400).json({
                success: false,
                error: "INVALID_REQUEST"
            });
        }

        req.body = result.data;

        next();
    };
}


/* =========================================================
   AUTH ROUTES
========================================================= */

router.post(
    "/register",
    validate(registerSchema),
    register
);


router.post(
    "/login",
    validate(loginSchema),
    login
);


/*
 * Current logged-in user
 */
router.get(
    "/me",
    me
);


/*
 * Logout
 */
router.post(
    "/logout",
    logout
);


module.exports = router;
