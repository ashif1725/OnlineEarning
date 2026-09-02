"use strict";


/* =========================================================
   SkillEarn Hub
   Account Routes

   Features:

   - Change Password
   - Verify Old Password
   - Validate New Password
   - Confirm Password
   - Reject Same Password
   - Hash New Password
   - Update Database
   - Revoke Other Active Sessions
   - Keep Current Session Active
   - Create Audit Log
   ========================================================= */


const express =
    require("express");


const {
    z
} =
    require("zod");


const pool =
    require(
        "../config/db"
    );


const {
    requireAuth
} =
    require(
        "../middleware/auth.middleware"
    );


const {
    hashPassword,
    verifyPassword
} =
    require(
        "../utils/security"
    );


const router =
    express.Router();


/* =========================================================
   PASSWORD VALIDATION SCHEMA
   ========================================================= */


const changePasswordSchema =
    z.object({

        oldPassword:

            z.string()
                .min(1)
                .max(128),


        newPassword:

            z.string()
                .min(12)
                .max(128),


        confirmPassword:

            z.string()
                .min(1)
                .max(128)

    })


    .superRefine(

        function (
            data,
            context
        ) {

            if (

                data.newPassword !==
                data.confirmPassword

            ) {

                context.addIssue({

                    code:
                        z.ZodIssueCode.custom,


                    path:
                        [
                            "confirmPassword"
                        ],


                    message:
                        "New password and confirm password do not match."

                });

            }


            if (

                data.oldPassword ===
                data.newPassword

            ) {

                context.addIssue({

                    code:
                        z.ZodIssueCode.custom,


                    path:
                        [
                            "newPassword"
                        ],


                    message:
                        "New password must be different from your old password."

                });

            }

        }

    );


/* =========================================================
   VALIDATE REQUEST
   ========================================================= */


function validate(
    schema
) {

    return function (
        req,
        res,
        next
    ) {

        const result =
            schema.safeParse(
                req.body
            );


        if (
            !result.success
        ) {

            const firstError =
                result.error
                    .issues
                    ?.[
                        0
                    ];


            return res
                .status(400)
                .json({

                    success:
                        false,


                    error:
                        "INVALID_REQUEST",


                    message:

                        firstError?.message ||

                        "Please check the submitted information."

                });

        }


        req.body =
            result.data;


        return next();

    };

}


/* =========================================================
   CHANGE PASSWORD

   PUT /api/account/change-password

   Request:

   {
       oldPassword: "...",
       newPassword: "...",
       confirmPassword: "..."
   }

   ========================================================= */


router.put(

    "/change-password",


    requireAuth,


    validate(
        changePasswordSchema
    ),


    async function (
        req,
        res
    ) {

        const client =
            await pool.connect();


        try {

            const userId =
                req.auth?.userId;


            const currentSessionId =
                req.auth?.sessionId;


            /*
            -------------------------------------------------
            Safety check
            -------------------------------------------------
            */

            if (
                !userId
            ) {

                return res
                    .status(401)
                    .json({

                        success:
                            false,


                        error:
                            "AUTHENTICATION_REQUIRED",


                        message:
                            "Please sign in again."

                    });

            }


            const {

                oldPassword,

                newPassword,

                confirmPassword

            } =
                req.body;


            /*
            -------------------------------------------------
            Extra confirmation safety
            -------------------------------------------------
            */

            if (

                newPassword !==
                confirmPassword

            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,


                        error:
                            "PASSWORD_CONFIRMATION_FAILED",


                        message:
                            "New password and confirm password do not match."

                    });

            }


            /*
            -------------------------------------------------
            Begin transaction
            -------------------------------------------------
            */

            await client.query(
                "BEGIN"
            );


            /*
            -------------------------------------------------
            Lock and fetch current password hash
            -------------------------------------------------
            */

            const userResult =
                await client.query(

                    `
                    SELECT

                        id,

                        password_hash,

                        account_status

                    FROM users

                    WHERE id = $1

                    FOR UPDATE
                    `,

                    [
                        userId
                    ]

                );


            /*
            -------------------------------------------------
            User not found
            -------------------------------------------------
            */

            if (
                userResult.rowCount === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );


                return res
                    .status(404)
                    .json({

                        success:
                            false,


                        error:
                            "USER_NOT_FOUND",


                        message:
                            "User account was not found."

                    });

            }


            const user =
                userResult.rows[0];


            /*
            -------------------------------------------------
            Account status check
            -------------------------------------------------
            */

            if (

                user.account_status !==
                "active"

            ) {

                await client.query(
                    "ROLLBACK"
                );


                return res
                    .status(403)
                    .json({

                        success:
                            false,


                        error:
                            "ACCOUNT_DISABLED",


                        message:
                            "Your account is not active."

                    });

            }


            /*
            -------------------------------------------------
            Verify old password
            -------------------------------------------------
            */

            const oldPasswordValid =
                await verifyPassword(

                    oldPassword,

                    user.password_hash

                );


            if (
                !oldPasswordValid
            ) {

                await client.query(
                    "ROLLBACK"
                );


                return res
                    .status(400)
                    .json({

                        success:
                            false,


                        error:
                            "INVALID_OLD_PASSWORD",


                        message:
                            "Your old password is incorrect."

                    });

            }


            /*
            -------------------------------------------------
            Verify new password is not same as old hash
            -------------------------------------------------
            */

            const samePassword =
                await verifyPassword(

                    newPassword,

                    user.password_hash

                );


            if (
                samePassword
            ) {

                await client.query(
                    "ROLLBACK"
                );


                return res
                    .status(400)
                    .json({

                        success:
                            false,


                        error:
                            "PASSWORD_UNCHANGED",


                        message:
                            "New password must be different from your old password."

                    });

            }


            /*
            -------------------------------------------------
            Hash new password
            -------------------------------------------------
            */

            const newPasswordHash =
                await hashPassword(
                    newPassword
                );


            /*
            -------------------------------------------------
            Update password
            -------------------------------------------------
            */

            await client.query(

                `
                UPDATE users

                SET

                    password_hash = $1,

                    updated_at = NOW()

                WHERE id = $2
                `,

                [

                    newPasswordHash,

                    userId

                ]

            );


            /*
            -------------------------------------------------
            Revoke all OTHER sessions

            Current session remains active.

            This prevents old sessions on other devices
            from continuing after a password change.
            -------------------------------------------------
            */

            if (
                currentSessionId
            ) {

                await client.query(

                    `
                    UPDATE user_sessions

                    SET

                        revoked_at = NOW()

                    WHERE

                        user_id = $1

                        AND id <> $2

                        AND revoked_at IS NULL
                    `,

                    [

                        userId,

                        currentSessionId

                    ]

                );

            }

            else {

                /*
                -------------------------------------------------
                Fallback:

                If current session ID is unavailable,
                revoke all sessions.
                -------------------------------------------------
                */

                await client.query(

                    `
                    UPDATE user_sessions

                    SET

                        revoked_at = NOW()

                    WHERE

                        user_id = $1

                        AND revoked_at IS NULL
                    `,

                    [
                        userId
                    ]

                );

            }


            /*
            -------------------------------------------------
            Create audit log

            Password itself is NEVER stored.
            -------------------------------------------------
            */

            await client.query(

                `
                INSERT INTO audit_logs (

                    actor_user_id,

                    action,

                    entity_type,

                    entity_id,

                    metadata,

                    ip_address,

                    user_agent

                )

                VALUES (

                    $1,

                    'PASSWORD_CHANGED',

                    'USER',

                    $1,

                    $2::jsonb,

                    $3,

                    $4

                )
                `,

                [

                    userId,


                    JSON.stringify({

                        currentSessionKept:

                            Boolean(
                                currentSessionId
                            ),


                        otherSessionsRevoked:
                            true

                    }),


                    req.ip ||
                    null,


                    req.get(
                        "user-agent"
                    ) ||
                    null

                ]

            );


            /*
            -------------------------------------------------
            Commit transaction
            -------------------------------------------------
            */

            await client.query(
                "COMMIT"
            );


            /*
            -------------------------------------------------
            Success
            -------------------------------------------------
            */

            return res
                .status(200)
                .json({

                    success:
                        true,


                    message:
                        "Password changed successfully."


                });


        } catch (
            error
        ) {

            /*
            -------------------------------------------------
            Rollback
            -------------------------------------------------
            */

            try {

                await client.query(
                    "ROLLBACK"
                );

            } catch (
                rollbackError
            ) {

                console.error(

                    "CHANGE PASSWORD ROLLBACK ERROR:",

                    rollbackError

                );

            }


            console.error(

                "CHANGE PASSWORD ERROR:",

                error

            );


            /*
            -------------------------------------------------
            Server error
            -------------------------------------------------
            */

            return res
                .status(500)
                .json({

                    success:
                        false,


                    error:
                        "PASSWORD_CHANGE_FAILED",


                    message:
                        "Unable to change password. Please try again."

                });


        } finally {

            client.release();

        }

    }

);


/* =========================================================
   EXPORT
   ========================================================= */


module.exports =
    router;
