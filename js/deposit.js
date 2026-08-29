/*

* =========================================================
* SKILLEARN HUB
* DEPOSIT REQUEST MODULE
* 
* IMPORTANT:
* - Customer can create a deposit request only.
* - Customer cannot credit their own wallet.
* - Admin/server-side trusted logic handles approval.
* =========================================================
  */

"use strict";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
collection,
addDoc,
getDocs,
query,
where,
orderBy,
limit,
doc,
getDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
auth,
db,
logoutUser,
getUserProfile
} from "../firebase/firebase-auth.js";

/* =========================================================
HELPERS
========================================================= */

function $(id) {
return document.getElementById(id);
}

function setText(
element,
value
) {

if (element) {
    element.textContent =
        value ?? "—";
}

}

function formatCurrency(
amount
) {

return new Intl.NumberFormat(
    "en-IN",
    {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }
).format(
    Number(amount || 0)
);

}

function formatDate(
timestamp
) {

if (!timestamp) {
    return "—";
}


let date;


if (
    typeof timestamp.toDate ===
    "function"
) {

    date =
        timestamp.toDate();

} else {

    date =
        new Date(timestamp);

}


if (
    Number.isNaN(
        date.getTime()
    )
) {

    return "—";

}


return new Intl.DateTimeFormat(
    "en-IN",
    {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }
).format(date);

}

function escapeText(
value
) {

return String(
    value ?? ""
)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

/* =========================================================
STATE
========================================================= */

let currentUser = null;

let paymentSettings = {
upiId: "",
qrUrl: "",
minDeposit: 1,
maxDeposit: 100000
};

/* =========================================================
USER
========================================================= */

async function loadUser(
user
) {

currentUser =
    user;


try {

    const profile =
        await getUserProfile(
            user.uid
        );


    const displayName =
        profile?.displayName ||
        user.displayName ||
        "Member";


    setText(
        $("headerUserName"),
        displayName
    );


    setText(
        $("userAvatar"),
        displayName
            .trim()
            .charAt(0)
            .toUpperCase() ||
            "M"
    );


} catch (error) {

    console.error(
        "Profile loading error:",
        error
    );

}

}

/* =========================================================
LOAD PAYMENT SETTINGS
========================================================= */

async function loadPaymentSettings() {

try {

    /*
     * Expected document:
     *
     * settings/payment
     *
     * Example fields:
     *
     * upiId
     * qrUrl
     * minDeposit
     * maxDeposit
     */

    const settingsRef =
        doc(
            db,
            "settings",
            "payment"
        );


    const snapshot =
        await getDoc(
            settingsRef
        );


    if (
        !snapshot.exists()
    ) {

        showPaymentUnavailable();

        return;

    }


    const data =
        snapshot.data();


    paymentSettings = {

        upiId:
            String(
                data.upiId || ""
            ).trim(),

        qrUrl:
            String(
                data.qrUrl || ""
            ).trim(),

        minDeposit:
            Number(
                data.minDeposit ?? 1
            ),

        maxDeposit:
            Number(
                data.maxDeposit ??
                100000
            )

    };


    setText(
        $("upiId"),
        paymentSettings.upiId ||
        "Payment details unavailable"
    );


    updateAmountHelp();


    loadQr(
        paymentSettings.qrUrl
    );


} catch (error) {

    console.error(
        "Payment settings error:",
        error
    );


    showPaymentUnavailable();

}

}

/* =========================================================
QR
========================================================= */

function loadQr(
qrUrl
) {

const qr =
    $("paymentQr");

const loading =
    $("qrLoading");

const unavailable =
    $("qrUnavailable");


if (!qr) {
    return;
}


if (!qrUrl) {

    if (loading) {
        loading.hidden = true;
    }

    if (unavailable) {
        unavailable.hidden = false;
    }

    return;

}


qr.onload =
    () => {

        if (loading) {
            loading.hidden = true;
        }

        qr.hidden = false;

    };


qr.onerror =
    () => {

        if (loading) {
            loading.hidden = true;
        }

        qr.hidden = true;

        if (unavailable) {
            unavailable.hidden = false;
        }

    };


qr.src =
    qrUrl;

}

/* =========================================================
PAYMENT UNAVAILABLE
========================================================= */

function showPaymentUnavailable() {

setText(
    $("upiId"),
    "Payment details unavailable"
);


setText(
    $("amountHelp"),
    "Please try again later."
);


const loading =
    $("qrLoading");

const unavailable =
    $("qrUnavailable");


if (loading) {
    loading.hidden = true;
}


if (unavailable) {
    unavailable.hidden = false;
}

}

/* =========================================================
AMOUNT HELP
========================================================= */

function updateAmountHelp() {

const min =
    paymentSettings.minDeposit;

const max =
    paymentSettings.maxDeposit;


setText(
    $("amountHelp"),
    `Minimum ${formatCurrency(min)} • Maximum ${formatCurrency(max)}`
);

}

/* =========================================================
COPY UPI
========================================================= */

$("copyUpiButton")
?.addEventListener(
"click",
async () => {

        const upi =
            paymentSettings.upiId;


        if (!upi) {
            return;
        }


        try {

            await navigator.clipboard.writeText(
                upi
            );


            const button =
                $("copyUpiButton");


            const oldText =
                button.textContent;


            button.textContent =
                "Copied";


            setTimeout(
                () => {

                    button.textContent =
                        oldText;

                },
                1400
            );


        } catch (error) {

            console.error(
                "Copy error:",
                error
            );

        }

    }
);

/* =========================================================
FORM ERROR
========================================================= */

function showError(
message
) {

const errorBox =
    $("formError");


if (!errorBox) {
    return;
}


errorBox.textContent =
    message;


errorBox.hidden =
    false;

}

function clearMessages() {

const errorBox =
    $("formError");

const successBox =
    $("formSuccess");


if (errorBox) {
    errorBox.hidden =
        true;

    errorBox.textContent =
        "";
}


if (successBox) {
    successBox.hidden =
        true;
}

}

/* =========================================================
VALIDATION
========================================================= */

function validateAmount(
amount
) {

if (
    !Number.isFinite(amount)
) {

    return "Please enter a valid amount.";

}


if (
    amount <= 0
) {

    return "Amount must be greater than zero.";

}


if (
    amount <
    paymentSettings.minDeposit
) {

    return `Minimum deposit is ${formatCurrency(paymentSettings.minDeposit)}.`;

}


if (
    amount >
    paymentSettings.maxDeposit
) {

    return `Maximum deposit is ${formatCurrency(paymentSettings.maxDeposit)}.`;

}


return null;

}

function validateUtr(
utr
) {

const value =
    utr.trim();


if (!value) {
    return "Please enter your UTR or transaction reference.";
}


if (
    value.length < 4
) {

    return "Transaction reference is too short.";

}


if (
    value.length > 64
) {

    return "Transaction reference is too long.";

}


/*
 * Allow common reference characters.
 * This is validation, not proof of payment.
 */

if (
    !/^[A-Za-z0-9._\-/ ]+$/.test(
        value
    )
) {

    return "Transaction reference contains unsupported characters.";

}


return null;

}

/* =========================================================
SUBMIT DEPOSIT
========================================================= */

$("depositForm")
?.addEventListener(
"submit",
async event => {

        event.preventDefault();


        clearMessages();


        if (!currentUser) {

            showError(
                "Your session has expired. Please sign in again."
            );

            return;

        }


        const amount =
            Number(
                $("amount")?.value
            );


        const utr =
            String(
                $("utr")?.value || ""
            ).trim();


        const note =
            String(
                $("note")?.value || ""
            ).trim();


        const amountError =
            validateAmount(
                amount
            );


        if (amountError) {

            showError(
                amountError
            );

            return;

        }


        const utrError =
            validateUtr(
                utr
            );


        if (utrError) {

            showError(
                utrError
            );

            return;

        }


        const submitButton =
            $("submitDeposit");


        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Submitting...";

        }


        try {


            /*
             * SECURITY:
             *
             * This creates ONLY a pending request.
             * It does NOT update wallets/{uid}.
             */

            const depositRef =
                await addDoc(
                    collection(
                        db,
                        "deposits"
                    ),
                    {

                        userId:
                            currentUser.uid,

                        amount:
                            amount,

                        utr:
                            utr,

                        note:
                            note,

                        status:
                            "pending",

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    }
                );


            console.log(
                "Deposit request created:",
                depositRef.id
            );


            const successBox =
                $("formSuccess");


            if (successBox) {
                successBox.hidden =
                    false;
            }


            $("depositForm")
                .reset();


            await loadRecentRequests();


        } catch (error) {

            console.error(
                "Deposit submission error:",
                error
            );


            showError(
                "Unable to submit the deposit request. Please try again."
            );

        } finally {

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Submit deposit request";

            }

        }

    }
);

/* =========================================================
RECENT DEPOSIT REQUESTS
========================================================= */

async function loadRecentRequests() {

if (!currentUser) {
    return;
}


const container =
    $("depositRequests");


if (!container) {
    return;
}


try {

    const depositsRef =
        collection(
            db,
            "deposits"
        );


    const requestsQuery =
        query(
            depositsRef,
            where(
                "userId",
                "==",
                currentUser.uid
            ),
            orderBy(
                "createdAt",
                "desc"
            ),
            limit(5)
        );


    const snapshot =
        await getDocs(
            requestsQuery
        );


    if (
        snapshot.empty
    ) {

        container.innerHTML = `
            <div class="requests-empty">
                <span>≡</span>
                <strong>No deposit requests</strong>
                <p>Your submitted requests will appear here.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        "";


    snapshot.forEach(
        request => {

            const data =
                request.data();


            const amount =
                Number(
                    data.amount || 0
                );


            const status =
                String(
                    data.status ||
                    "pending"
                ).toLowerCase();


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "deposit-request-row";


            row.innerHTML = `

                <div class="request-left">

                    <span class="request-icon">
                        +
                    </span>

                    <div>

                        <strong>
                            Deposit request
                        </strong>

                        <small>
                            ${escapeText(
                                formatDate(
                                    data.createdAt
                                )
                            )}
                        </small>

                    </div>

                </div>


                <div class="request-right">

                    <strong>
                        ${escapeText(
                            formatCurrency(
                                amount
                            )
                        )}
                    </strong>

                    <span class="request-status ${escapeText(status)}">
                        ${escapeText(status)}
                    </span>

                </div>

            `;


            container.appendChild(
                row
            );

        }
    );


} catch (error) {

    console.error(
        "Recent requests error:",
        error
    );


    /*
     * If Firestore asks for a composite index,
     * the page itself still remains functional.
     */

    container.innerHTML = `
        <div class="requests-empty">
            <span>!</span>
            <strong>History temporarily unavailable</strong>
            <p>Your deposit form is still available.</p>
        </div>
    `;

}

}

/* =========================================================
LOGOUT
========================================================= */

$("logoutButton")
?.addEventListener(
"click",
async () => {

        const button =
            $("logoutButton");


        if (button) {
            button.disabled =
                true;
        }


        try {

            await logoutUser();


            window.location.href =
                "../auth/login.html";


        } catch (error) {

            console.error(
                "Logout error:",
                error
            );


            if (button) {
                button.disabled =
                    false;
            }

        }

    }
);

/* =========================================================
MOBILE SIDEBAR
========================================================= */

const sidebar =
$("dashboardSidebar");

const overlay =
$("sidebarOverlay");

function openSidebar() {

sidebar?.classList.add(
    "open"
);

overlay?.classList.add(
    "visible"
);

}

function closeSidebar() {

sidebar?.classList.remove(
    "open"
);

overlay?.classList.remove(
    "visible"
);

}

$("openSidebar")
?.addEventListener(
"click",
openSidebar
);

$("closeSidebar")
?.addEventListener(
"click",
closeSidebar
);

overlay?.addEventListener(
"click",
closeSidebar
);

/* =========================================================
AUTH GUARD + INIT
========================================================= */

onAuthStateChanged(
auth,
async user => {

    if (!user) {

        window.location.href =
            "../auth/login.html";

        return;

    }


    await loadUser(
        user
    );


    await loadPaymentSettings();


    await loadRecentRequests();

}

);
