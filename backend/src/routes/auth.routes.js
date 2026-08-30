"use strict";

const express = require("express");
const { z } = require("zod");

const {
    register,
    login
} = require("../controllers/auth.controller");


const router = express.Router();


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


const loginSchema =
    z.object({

        email:
            z.string()
                .trim()
                .email(),

        password:
            z.string()
                .min(1)
                .max(128)

    });


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


module.exports = router;
