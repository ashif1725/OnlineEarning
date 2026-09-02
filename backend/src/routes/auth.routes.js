"use strict";

/* =========================================================
   SkillEarn Hub
   Authentication Routes
========================================================= */

const express =
    require("express");

const { z } =
    require("zod");


const {

    register,

    login,

    logout,

    me

} = require(
    "../controllers/auth.controller"
);


const {

    requireAuth

} = require(
    "../middleware/auth.middleware"
);


/* =========================================================
   ROUTER
========================================================= */

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
                .min(
                    2,
                    "Full name must contain at least 2 characters."
                )
                .max(
                    80,
                    "Full name is too long."
                ),


        email:

            z.string()
                .trim()
                .email(
                    "Please enter a valid email address."
                )
                .max(
                    160,
                    "Email address is too long."
                ),


        phone:

            z.string()
                .trim()
                .min(
                    8,
                    "Please enter a valid mobile number."
                )
                .max(
                    20,
                    "Mobile number is too long."
                ),


        password:

            z.string()
                .min(
                    12,
                    "Password must contain at least 12 characters."
                )
                .max(
                    128,
                    "Password is too long."
                )

    });


/* =========================================================
   LOGIN VALIDATION
========================================================= */

const loginSchema =
    z.object({

        email:

            z.string()
                .trim()
                .email(
                    "Please enter a valid email address."
                )
                .max(
                    160,
                    "Email address is too long."
                ),


        password:

            z.string()
                .min(
                    1,
                    "Please enter your password."
                )
                .max(
                    128,
                    "Password is too long."
                )

    });


/* =========================================================
   VALIDATION MIDDLEWARE
========================================================= */

function validate(schema) {

    return function (
        req,
        res,
        next
    ) {

        try {

            const result =
                schema.safeParse(
                    req.body
                );


            if (
                !result.success
            ) {

                const firstIssue =
                    result.error?.issues?.[0];


                return res.status(400).json({

                    success:
                        false,

                    error:
                        "INVALID_REQUEST",

                    message:
                        firstIssue?.message ||
                        "Please check the submitted information."

                });

            }


            req.body =
                result.data;


            return next();


        } catch (error) {

            console.error(
                "VALIDATION ERROR:",
                error
            );


            return res.status(400).json({

                success:
                    false,

                error:
                    "INVALID_REQUEST",

                message:
                    "Please check the submitted information."

            });

        }

    };

}


/* =========================================================
   REGISTER

   POST /api/auth/register
========================================================= */

router.post(

    "/register",

    validate(
        registerSchema
    ),

    register

);


/* =========================================================
   LOGIN

   POST /api/auth/login
========================================================= */

router.post(

    "/login",

    validate(
        loginSchema
    ),

    login

);


/* =========================================================
   CURRENT USER

   GET /api/auth/me
========================================================= */

router.get(

    "/me",

    requireAuth,

    me

);


/* =========================================================
   LOGOUT

   POST /api/auth/logout
========================================================= */

router.post(

    "/logout",

    logout

);


/* =========================================================
   EXPORT
========================================================= */

module.exports =
    router;
