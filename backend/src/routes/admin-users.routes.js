"use strict";

const express = require("express");

const {
    requireAuth
} = require("../middleware/auth");

const {
    requireAdmin
} = require("../middleware/admin");

const {
    getUsers,
    getUserDetails
} = require("../services/admin-users.service");


const router = express.Router();


router.get(
    "/",
    requireAuth,
    requireAdmin,

    async (req, res) => {

        try {

            const limit =
                Math.min(
                    Math.max(
                        Number(req.query.limit) || 25,
                        1
                    ),
                    100
                );


            const offset =
                Math.max(
                    Number(req.query.offset) || 0,
                    0
                );


            const users =
                await getUsers({

                    search:
                        req.query.search,

                    status:
                        req.query.status,

                    limit,

                    offset
                });


            res.json({

                success: true,

                users,

                pagination: {
                    limit,
                    offset,
                    count: users.length
                }

            });


        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "ADMIN_USERS_FETCH_FAILED"
            });
        }
    }
);


router.get(
    "/:userId",
    requireAuth,
    requireAdmin,

    async (req, res) => {

        try {

            const user =
                await getUserDetails(
                    req.params.userId
                );


            if (!user) {

                return res.status(404).json({

                    success: false,

                    error:
                        "USER_NOT_FOUND"
                });
            }


            res.json({

                success: true,

                user

            });


        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "ADMIN_USER_FETCH_FAILED"
            });
        }
    }
);


module.exports = router;
