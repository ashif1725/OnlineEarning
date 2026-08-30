"use strict";

const pool = require("../config/db");

const {
    createAuditLog
} = require("./audit.service");


async function reviewKyc({
    kycId,
    adminUserId,
    decision,
    adminNote,
    rejectionReason,
    ipAddress,
    userAgent
}) {

    const allowed = [
        "VERIFIED",
        "REJECTED",
        "RESUBMISSION_REQUIRED"
    ];


    if (!allowed.includes(decision)) {

        throw new Error(
            "INVALID_KYC_DECISION"
        );
    }


    if (
        decision === "REJECTED" &&
        !rejectionReason
    ) {

        throw new Error(
            "REJECTION_REASON_REQUIRED"
        );
    }


    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        const result =
            await client.query(
                `
                SELECT
                    id,
                    user_id,
                    status

                FROM kyc_profiles

                WHERE id = $1

                FOR UPDATE
                `,
                [kycId]
            );


        if (result.rowCount === 0) {

            throw new Error(
                "KYC_NOT_FOUND"
            );
        }


        const before =
            result.rows[0];


        if (
            ![
                "PENDING",
                "UNDER_REVIEW"
            ].includes(
                before.status
            )
        ) {

            throw new Error(
                "KYC_ALREADY_REVIEWED"
            );
        }


        const updated =
            await client.query(
                `
                UPDATE kyc_profiles

                SET
                    status = $1,
                    admin_note = $2,
                    rejection_reason = $3,
                    reviewed_by = $4,
                    reviewed_at = NOW(),
                    updated_at = NOW()

                WHERE id = $5

                RETURNING
                    id,
                    user_id,
                    status,
                    admin_note,
                    rejection_reason,
                    reviewed_at
                `,
                [
                    decision,
                    adminNote || null,
                    rejectionReason || null,
                    adminUserId,
                    kycId
                ]
            );


        await createAuditLog(
            client,
            {
                actorUserId:
                    adminUserId,

                action:
                    `KYC_${decision}`,

                entityType:
                    "KYC",

                entityId:
                    kycId,

                beforeData: {
                    status:
                        before.status
                },

                afterData: {
                    status:
                        decision
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


module.exports = {
    reviewKyc
};
