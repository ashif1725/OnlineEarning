async function updateUserStatus({
    userId,
    status,
    adminUserId,
    ipAddress,
    userAgent
}) {

    const allowedStatuses = [
        "active",
        "suspended",
        "frozen",
        "blocked"
    ];


    if (!allowedStatuses.includes(status)) {

        throw new Error(
            "INVALID_ACCOUNT_STATUS"
        );
    }


    const client =
        await pool.connect();


    try {

        await client.query("BEGIN");


        const current =
            await client.query(
                `
                SELECT
                    id,
                    public_user_id,
                    account_status

                FROM users

                WHERE id = $1

                FOR UPDATE
                `,
                [userId]
            );


        if (current.rowCount === 0) {

            throw new Error(
                "USER_NOT_FOUND"
            );
        }


        const before =
            current.rows[0];


        /*
         * Prevent unnecessary updates.
         */

        if (
            before.account_status ===
            status
        ) {

            throw new Error(
                "STATUS_ALREADY_SET"
            );
        }


        const updated =
            await client.query(
                `
                UPDATE users

                SET
                    account_status = $1,
                    updated_at = NOW()

                WHERE id = $2

                RETURNING
                    id,
                    public_user_id,
                    account_status
                `,
                [
                    status,
                    userId
                ]
            );


        await createAuditLog(
            client,
            {
                actorUserId:
                    adminUserId,

                action:
                    "USER_STATUS_CHANGED",

                entityType:
                    "USER",

                entityId:
                    before.public_user_id,

                beforeData: {
                    accountStatus:
                        before.account_status
                },

                afterData: {
                    accountStatus:
                        status
                },

                ipAddress,

                userAgent
            }
        );


        await client.query(
            "COMMIT"
        );


        return updated.rows[0];


    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        throw error;

    } finally {

        client.release();
    }
}
