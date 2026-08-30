"use strict";

const pool = require("../config/db");


async function getKycProfile(userId) {

    const result = await pool.query(
        `
        SELECT
            id,
            user_id,
            full_name,
            date_of_birth,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country,
            status,
            rejection_reason,
            admin_note,
            submitted_at,
            reviewed_at,
            created_at,
            updated_at

        FROM kyc_profiles

        WHERE user_id = $1

        LIMIT 1
        `,
        [userId]
    );


    if (result.rowCount === 0) {
        return null;
    }


    return result.rows[0];
}


async function createOrUpdateKyc({
    userId,
    fullName,
    dateOfBirth,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country
}) {

    const result = await pool.query(
        `
        INSERT INTO kyc_profiles (
            user_id,
            full_name,
            date_of_birth,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country,
            status
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            'NOT_SUBMITTED'
        )

        ON CONFLICT (user_id)

        DO UPDATE SET

            full_name = EXCLUDED.full_name,
            date_of_birth = EXCLUDED.date_of_birth,
            address_line1 = EXCLUDED.address_line1,
            address_line2 = EXCLUDED.address_line2,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            postal_code = EXCLUDED.postal_code,
            country = EXCLUDED.country,
            updated_at = NOW()

        WHERE kyc_profiles.status IN (
            'NOT_SUBMITTED',
            'REJECTED',
            'RESUBMISSION_REQUIRED'
        )

        RETURNING *
        `,
        [
            userId,
            fullName,
            dateOfBirth || null,
            addressLine1,
            addressLine2 || null,
            city,
            state,
            postalCode,
            country || "India"
        ]
    );


    if (result.rowCount === 0) {

        throw new Error(
            "KYC_CANNOT_BE_EDITED"
        );
    }


    return result.rows[0];
}


async function submitKyc(userId) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");


        const kyc = await client.query(
            `
            SELECT *
            FROM kyc_profiles
            WHERE user_id = $1
            FOR UPDATE
            `,
            [userId]
        );


        if (kyc.rowCount === 0) {

            throw new Error(
                "KYC_NOT_FOUND"
            );
        }


        const profile = kyc.rows[0];


        if (
            ![
                "NOT_SUBMITTED",
                "REJECTED",
                "RESUBMISSION_REQUIRED"
            ].includes(profile.status)
        ) {

            throw new Error(
                "KYC_ALREADY_SUBMITTED"
            );
        }


        const documents = await client.query(
            `
            SELECT
                id,
                document_type,
                status

            FROM kyc_documents

            WHERE kyc_id = $1
            `,
            [profile.id]
        );


        if (documents.rowCount === 0) {

            throw new Error(
                "KYC_DOCUMENTS_REQUIRED"
            );
        }


        await client.query(
            `
            UPDATE kyc_profiles

            SET
                status = 'PENDING',
                rejection_reason = NULL,
                admin_note = NULL,
                submitted_at = NOW(),
                updated_at = NOW()

            WHERE id = $1
            `,
            [profile.id]
        );


        await client.query("COMMIT");


        return {
            status: "PENDING"
        };


    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
}


module.exports = {
    getKycProfile,
    createOrUpdateKyc,
    submitKyc
};
