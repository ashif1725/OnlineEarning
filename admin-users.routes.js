const {
    getUsers,
    getUserDetails,
    updateUserStatus
} = require("../services/admin-users.service");


router.patch(
    "/:userId/status",
    requireAuth,
    requireAdmin,

    async (req, res) => {

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


            res.json({

                success: true,

                user: result

            });


        } catch (error) {

            const statusMap = {

                USER_NOT_FOUND: 404,

                INVALID_ACCOUNT_STATUS: 400,

                STATUS_ALREADY_SET: 409

            };


            const status =
                statusMap[
                    error.message
                ] || 500;


            res.status(status).json({

                success: false,

                error:
                    status === 500
                        ? "STATUS_UPDATE_FAILED"
                        : error.message

            });
        }
    }
);
