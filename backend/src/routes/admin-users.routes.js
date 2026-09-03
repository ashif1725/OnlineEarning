"use strict";


/*
|--------------------------------------------------------------------------
| EXPRESS
|--------------------------------------------------------------------------
*/

const express =
    require(
        "express"
    );


const router =
    express.Router();


/*
|--------------------------------------------------------------------------
| AUTH MIDDLEWARE
|--------------------------------------------------------------------------
*/

const {

    requireAuth,

    requireAdmin

} =
    require(
        "../middleware/auth.middleware"
    );


/*
|--------------------------------------------------------------------------
| ADMIN USERS SERVICE
|--------------------------------------------------------------------------
*/

const {

    getUsers,

    getUserDetails,

    updateUserStatus

} =
    require(
        "../services/admin-users.service"
    );


/*
|--------------------------------------------------------------------------
| GET USERS
|--------------------------------------------------------------------------
|
| GET /api/admin/users
|
*/

router.get(

    "/",

    requireAuth,

    requireAdmin,

    async function (
        req,
        res
    ) {

        try {

            const search =
                req.query.search ||
                null;


            const status =
                req.query.status ||
                null;


            const limit =
                Math.min(

                    Math.max(

                        Number(
                            req.query.limit
                        ) || 25,

                        1

                    ),

                    100

                );


            const offset =
                Math.max(

                    Number(
                        req.query.offset
                    ) || 0,

                    0

                );


            const users =
                await getUsers({

                    search,

                    status,

                    limit,

                    offset

                });


            return res.json({

                success:
                    true,

                users

            });

        } catch (error) {

            console.error(
                "GET USERS ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                error:
                    "GET_USERS_FAILED"

            });

        }

    }

);


/*
|--------------------------------------------------------------------------
| GET USER DETAILS
|--------------------------------------------------------------------------
|
| GET /api/admin/users/:userId
|
*/

router.get(

    "/:userId",

    requireAuth,

    requireAdmin,

    async function (
        req,
        res
    ) {

        try {

            const user =
                await getUserDetails(

                    req.params.userId

                );


            if (!user) {

                return res.status(404).json({

                    success:
                        false,

                    error:
                        "USER_NOT_FOUND"

                });

            }


            return res.json({

                success:
                    true,

                user

            });

        } catch (error) {

            console.error(
                "GET USER DETAILS ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                error:
                    "GET_USER_DETAILS_FAILED"

            });

        }

    }

);


/*
|--------------------------------------------------------------------------
| UPDATE USER STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/users/:userId/status
|
*/

router.patch(

    "/:userId/status",

    requireAuth,

    requireAdmin,

    async function (
        req,
        res
    ) {

        try {

            const result =
                await updateUserStatus({

                    userId:
                        req.params.userId,


                    status:
                        req.body.status,


                    adminUserId:
                        req.user.id,


                    ipAddress:
                        req.ip,


                    userAgent:
                        req.get(
                            "user-agent"
                        )

                });


            return res.json({

                success:
                    true,

                user:
                    result

            });

        } catch (error) {

            console.error(
                "UPDATE USER STATUS ERROR:",
                error
            );


            const statusMap = {

                USER_NOT_FOUND:
                    404,


                INVALID_ACCOUNT_STATUS:
                    400,


                STATUS_ALREADY_SET:
                    409

            };


            const statusCode =
                statusMap[
                    error.message
                ]
                ||
                500;


            return res
                .status(
                    statusCode
                )
                .json({

                    success:
                        false,


                    error:

                        statusCode === 500

                            ? "STATUS_UPDATE_FAILED"

                            : error.message

                });

        }

    }

);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Express Router directly export होना चाहिए.
| Object export नहीं होना चाहिए.
|
*/

module.exports =
    router;
