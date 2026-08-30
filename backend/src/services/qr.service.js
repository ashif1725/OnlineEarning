"use strict";

const QRCode = require("qrcode");


async function generateUserQr(
    publicUserId
) {

    const payload = JSON.stringify({
        version: 1,
        type: "INTERNAL_WALLET_USER",
        userId: publicUserId
    });


    const qrDataUrl =
        await QRCode.toDataURL(
            payload,
            {
                errorCorrectionLevel: "M",
                margin: 2,
                width: 420
            }
        );


    return {
        type: "INTERNAL_WALLET_USER",
        userId: publicUserId,
        qrDataUrl
    };
}


module.exports = {
    generateUserQr
};
