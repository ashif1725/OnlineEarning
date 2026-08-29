/*

* =========================================================
* SKILLEARN HUB
* CUSTOMER DASHBOARD
* =========================================================
  */

"use strict";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
doc,
getDoc,
collection,
query,
where,
orderBy,
limit,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
auth,
db,
logoutUser,
getUserProfile
} from "../firebase/firebase-auth.js";

/* =========================================================
DOM HELPERS
========================================================= */

function $(id) {
return document.getElementById(id);
}

/* =========================================================
FORMAT CURRENCY
========================================================= */

function formatCurrency(
amount
) {

const value =
    Number(amount || 0);


return new Intl.NumberFormat(
    "en-IN",
    {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }
).format(value);

}

/* =========================================================
SAFE TEXT
========================================================= */

function setText(
element,
value
) {

if (!element) {
    return;
}

element.textContent =
    value ?? "—";

}

/* =========================================================
DATE FORMAT
========================================================= */

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

/* =========================================================
NAME HELPERS
========================================================= */

function getFirstName(
name
) {

if (!name) {
    return "Member";
}


return name
    .trim()
    .split(/\s+/)[0] ||
    "Member";

}

/* =========================================================
INITIALIZE USER
========================================================= */

async function initializeDashboard(
user
) {

try {


    /* -------------------------------------------------
       USER PROFILE
       ------------------------------------------------- */

    const profile =
        await getUserProfile(
            user.uid
        );


    const displayName =
        profile?.displayName ||
        user.displayName ||
        "Member";


    const email =
        profile?.email ||
        user.email ||
        "—";


    const status =
        profile?.accountStatus ||
        "active";


    setText(
        $("welcomeName"),
        getFirstName(displayName)
    );


    setText(
        $("headerUserName"),
        displayName
    );


    setText(
        $("accountName"),
        displayName
    );


    setText(
        $("accountEmail"),
        email
    );


    setText(
        $("accountStatus"),
        status === "active"
            ? "Active"
            : status
    );


    if (
        profile?.createdAt
    ) {

        setText(
            $("memberSince"),
            formatDate(
                profile.createdAt
            )
        );

    } else if (
        user.metadata?.creationTime
    ) {

        setText(
            $("memberSince"),
            formatDate(
                user.metadata.creationTime
            )
        );

    }


    /* -------------------------------------------------
       AVATAR
       ------------------------------------------------- */

    const avatarLetter =
        getFirstName(
            displayName
        ).charAt(0)
        .toUpperCase();


    setText(
        $("userAvatar"),
        avatarLetter
    );


    /* -------------------------------------------------
       ACCOUNT STATUS
       ------------------------------------------------- */

    if (
        status !== "active"
    ) {

        const statusElement =
            document.querySelector(
                ".account-status"
            );


        if (statusElement) {

            statusElement.innerHTML =
                `<span class="status-dot"></span>${status}`;

        }

    }


    /* -------------------------------------------------
       WALLET
       -------------------------------------------------
       IMPORTANT:
       Wallet is read-only on customer side.
       */

    await loadWallet(
        user.uid
    );


    /* -------------------------------------------------
       RECENT TRANSACTIONS
       ------------------------------------------------- */

    await loadRecentTransactions(
        user.uid
    );


} catch (error) {

    console.error(
        "Dashboard initialization error:",
        error
    );

}

}

/* =========================================================
LOAD WALLET
========================================================= */

async function loadWallet(
uid
) {

const balanceElement =
    $("walletBalance");


try {

    const walletRef =
        doc(
            db,
            "wallets",
            uid
        );


    const walletSnapshot =
        await getDoc(
            walletRef
        );


    if (
        !walletSnapshot.exists()
    ) {

        setText(
            balanceElement,
            formatCurrency(0)
        );

        return;

    }


    const wallet =
        walletSnapshot.data();


    /*
     * Balance is displayed only.
     *
     * There is intentionally NO
     * client-side update operation.
     */

    const balance =
        Number(
            wallet.balance || 0
        );


    setText(
        balanceElement,
        formatCurrency(balance)
    );


} catch (error) {

    console.error(
        "Wallet loading error:",
        error
    );


    setText(
        balanceElement,
        "₹0.00"
    );

}

}

/* =========================================================
LOAD RECENT TRANSACTIONS
========================================================= */

async function loadRecentTransactions(
uid
) {

const container =
    $("recentTransactions");


if (!container) {
    return;
}


try {


    const transactionsRef =
        collection(
            db,
            "transactions"
        );


    const transactionQuery =
        query(
            transactionsRef,
            where(
                "userId",
                "==",
                uid
            ),
            orderBy(
                "createdAt",
                "desc"
            ),
            limit(5)
        );


    const snapshot =
        await getDocs(
            transactionQuery
        );


    if (
        snapshot.empty
    ) {

        return;

    }


    container.innerHTML =
        "";


    snapshot.forEach(
        transaction => {

            const data =
                transaction.data();


            const type =
                data.type ||
                "transaction";


            const amount =
                Number(
                    data.amount || 0
                );


            const status =
                data.status ||
                "pending";


            const isCredit =
                type === "deposit" ||
                type === "credit";


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "transaction-row";


            row.innerHTML = `
                <div class="transaction-main">
                    <span class="transaction-icon">
                        ${isCredit ? "+" : "↗"}
                    </span>

                    <div>
                        <strong>
                            ${formatTransactionType(type)}
                        </strong>

                        <small>
                            ${formatDate(data.createdAt)}
                        </small>
                    </div>
                </div>

                <div class="transaction-value">
                    <strong class="${isCredit ? "credit" : "debit"}">
                        ${isCredit ? "+" : "-"}${formatCurrency(amount)}
                    </strong>

                    <small>
                        ${escapeText(status)}
                    </small>
                </div>
            `;


            container.appendChild(
                row
            );

        }
    );


} catch (error) {

    /*
     * Firestore may require an index for
     * the userId + createdAt query.
     *
     * Dashboard remains usable even when
     * transaction history is unavailable.
     */

    console.error(
        "Transaction loading error:",
        error
    );

}

}

/* =========================================================
TRANSACTION TYPE
========================================================= */

function formatTransactionType(
type
) {

const labels = {

    deposit:
        "Deposit",

    withdrawal:
        "Withdrawal",

    credit:
        "Wallet credit",

    debit:
        "Wallet debit"

};


return (
    labels[type] ||
    "Transaction"
);

}

/* =========================================================
ESCAPE TEXT
========================================================= */

function escapeText(
value
) {

return String(
    value ?? ""
)
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );

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
AUTH GUARD
========================================================= */

onAuthStateChanged(
auth,
async user => {

    if (!user) {

        window.location.href =
            "../auth/login.html";

        return;

    }


    await initializeDashboard(
        user
    );

}

);
