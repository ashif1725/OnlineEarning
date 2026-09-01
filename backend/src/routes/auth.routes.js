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


/*
|--------------------------------------------------------------------------
| REGISTER SCHEMA
|--------------------------------------------------------------------------
*/

const registerSchema =
    z.object({

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


/*
|--------------------------------------------------------------------------
| LOGIN SCHEMA
|--------------------------------------------------------------------------
*/

const loginSchema =
    z.object({

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


/*
|--------------------------------------------------------------------------
| VALIDATION MIDDLEWARE
|--------------------------------------------------------------------------
*/

function validate(schema) {

    return (req, res, next) => {

        const result =
            schema.safeParse(req.body);


        if (!result.success) {

            return res.status(400).json({

                success: false,

                error:
                    "INVALID_REQUEST",

                message:
                    "Please check the submitted information."

            });
        }


        req.body =
            result.data;


        next();
    };
}


/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

router.post(
    "/register",
    validate(registerSchema),
    register
);


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post(
    "/login",
    validate(loginSchema),
    login
);


/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

router.get(
    "/me",
    me
);


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

router.post(
    "/logout",
    logout
);


module.exports = router;
