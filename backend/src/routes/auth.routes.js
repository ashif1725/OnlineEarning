"use strict";

const express =
    require("express");

const { z } =
    require("zod");

const {
    register,
    login,
    logout,
    me
} =
    require("../controllers/auth.controller");

const {
    requireAuth
} =
    require("../middleware/auth.middleware");


const router =
    express.Router();


/* =========================================================
   REGISTER VALIDATION
   ========================================================= */

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


/* =========================================================
   LOGIN VALIDATION
   ========================================================= */

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


/* =========================================================
   VALIDATOR
   ========================================================= */

function validate(schema) {

    return (
        req,
        res,
        next
    ) => {

        const result =
            schema.safeParse(
                req.body
            );


        if (!result.success) {

            return res.status(400).json({

                success: false,

                error:
                    "INVALID_REQUEST"

            });
        }


        req.body =
            result.data;


        next();
    };
}


/* =========================================================
   PUBLIC ROUTES
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


/* =========================================================
   PROTECTED ROUTES
   ========================================================= */

router.post(
    "/logout",
    logout
);


router.get(
    "/me",
    requireAuth,
    me
);


module.exports =
    router;
