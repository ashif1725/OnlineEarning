"use strict";


async function createAuditLog(
    client,
    {
        actorUserId,
        action,
        entityType,
        entityId,
        beforeData,
        afterData,
        ipAddress,
        userAgent
    }
) {

    await client.query(
        `
        INSERT INTO audit_logs (
            actor_user_id,
            action,
            entity_type,
            entity_id,
            before_data,
            after_data,
            ip_address,
            user_agent
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
        )
        `,
        [
            actorUserId || null,
            action,
            entityType,
            entityId || null,
            beforeData
                ? JSON.stringify(beforeData)
                : null,
            afterData
                ? JSON.stringify(afterData)
                : null,
            ipAddress || null,
            userAgent || null
        ]
    );
}


module.exports = {
    createAuditLog
};
