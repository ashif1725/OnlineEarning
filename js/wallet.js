/*

* =========================================================
* SKILLEARN HUB
* WALLET UI
* 
* IMPORTANT:
* This file is UI-only.
* 
* It does NOT:
* - approve deposits
* - credit wallet balances
* - process withdrawals
* - store payment credentials
* - verify UTRs
* 
* Those operations must be performed server-side after
* authentication and authorization are implemented.
* =========================================================
  */

"use strict";

/* =========================================================
STATE
========================================================= */

const walletState = {
balance: 0,
totalDeposits: 0,
totalWithdrawals: 0,
pendingRequests: 0,
requests: []
};

/* =========================================================
ELEMENTS
========================================================= */

const depositModal =
document.getElementById("depositModal");

const withdrawModal =
document.getElementById("withdrawModal");

const openDeposit =
document.getElementById("openDeposit");

const openWithdraw =
document.getElementById("openWithdraw");

const depositForm =
document.getElementById("depositForm");

const withdrawForm =
document.getElementById("withdrawForm");

const withdrawMethod =
document.getElementById("withdrawMethod");

const upiField =
document.getElementById("upiField");

const bankFields =
document.getElementById("bankFields");

/* =========================================================
MODALS
========================================================= */

function openModal(modal) {

if (!modal) return;

modal.classList.add("active");
modal.setAttribute("aria-hidden", "false");

document.body.style.overflow = "hidden";

}

function closeModal(modal) {

if (!modal) return;

modal.classList.remove("active");
modal.setAttribute("aria-hidden", "true");

if (
    !depositModal.classList.contains("active") &&
    !withdrawModal.classList.contains("active")
) {
    document.body.style.overflow = "";
}

}

if (openDeposit) {

openDeposit.addEventListener("click", () => {
    openModal(depositModal);
});

}

if (openWithdraw) {

openWithdraw.addEventListener("click", () => {

    updateWithdrawBalance();

    openModal(withdrawModal);

});

}

/* =========================================================
CLOSE MODAL
========================================================= */

document.querySelectorAll("[data-close-modal]")
.forEach(button => {

    button.addEventListener("click", () => {

        const modal =
            button.closest(".wallet-modal");

        closeModal(modal);

    });

});

document.querySelectorAll(".modal-backdrop")
.forEach(backdrop => {

    backdrop.addEventListener("click", () => {

        const modal =
            backdrop.closest(".wallet-modal");

        closeModal(modal);

    });

});

document.addEventListener("keydown", event => {

if (event.key !== "Escape") return;

closeModal(depositModal);
closeModal(withdrawModal);

});

/* =========================================================
WITHDRAW METHOD
========================================================= */

function updateWithdrawalMethod() {

if (!withdrawMethod) return;

const method = withdrawMethod.value;

if (method === "upi") {

    upiField.classList.add("visible");
    bankFields.classList.remove("visible");

} else if (method === "bank") {

    upiField.classList.remove("visible");
    bankFields.classList.add("visible");

} else {

    upiField.classList.remove("visible");
    bankFields.classList.remove("visible");

}

}

if (withdrawMethod) {

withdrawMethod.addEventListener(
    "change",
    updateWithdrawalMethod
);

}

/* =========================================================
FORMAT CURRENCY
========================================================= */

function formatCurrency(value) {

const number = Number(value) || 0;

return new Intl.NumberFormat(
    "en-IN",
    {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    }
).format(number);

}

/* =========================================================
UPDATE UI
========================================================= */

function updateWalletUI() {

const balance =
    document.getElementById("walletBalance");

const deposits =
    document.getElementById("totalDeposits");

const withdrawals =
    document.getElementById("totalWithdrawals");

const pending =
    document.getElementById("pendingRequests");


if (balance) {
    balance.textContent =
        formatCurrency(walletState.balance);
}

if (deposits) {
    deposits.textContent =
        formatCurrency(walletState.totalDeposits);
}

if (withdrawals) {
    withdrawals.textContent =
        formatCurrency(walletState.totalWithdrawals);
}

if (pending) {
    pending.textContent =
        String(walletState.pendingRequests);
}

updateWithdrawBalance();

}

function updateWithdrawBalance() {

const element =
    document.getElementById("withdrawBalance");

if (element) {
    element.textContent =
        formatCurrency(walletState.balance);
}

}

/* =========================================================
ADMIN PAYMENT DISPLAY PLACEHOLDER
========================================================= */

function loadPaymentConfiguration() {

/*
 * In production this value must come from an
 * authenticated server endpoint.
 *
 * Never put secret payment credentials,
 * API keys or admin authorization tokens here.
 */

const adminUpiDisplay =
    document.getElementById("adminUpiDisplay");

if (adminUpiDisplay) {

    adminUpiDisplay.textContent =
        "Payment details will be provided securely";

}

}

/* =========================================================
DEPOSIT REQUEST
========================================================= */

if (depositForm) {

depositForm.addEventListener("submit", event => {

    event.preventDefault();

    const formData =
        new FormData(depositForm);

    const amount =
        Number(formData.get("amount"));

    const reference =
        String(
            formData.get("reference") || ""
        ).trim();


    if (!Number.isFinite(amount) || amount <= 0) {

        alert("Please enter a valid amount.");

        return;
    }


    if (!reference) {

        alert(
            "Please enter the transaction reference."
        );

        return;
    }


    /*
     * UI demonstration only.
     *
     * DO NOT directly increase wallet balance here.
     *
     * Production flow:
     *
     * Client
     *   ↓
     * Authenticated API
     *   ↓
     * Validate request
     *   ↓
     * Store pending deposit
     *   ↓
     * Admin review
     *   ↓
     * Server-side approval
     *   ↓
     * Atomic wallet ledger update
     */

    const request = {

        id:
            "DEP-" +
            Date.now(),

        type:
            "deposit",

        amount,

        reference,

        status:
            "pending",

        createdAt:
            new Date().toISOString()

    };


    walletState.requests.unshift(request);

    walletState.pendingRequests++;

    renderRequests();

    updateWalletUI();

    depositForm.reset();

    closeModal(depositModal);

    alert(
        "Deposit request submitted for review."
    );

});

}

/* =========================================================
WITHDRAW REQUEST
========================================================= */

if (withdrawForm) {

withdrawForm.addEventListener("submit", event => {

    event.preventDefault();

    const formData =
        new FormData(withdrawForm);

    const amount =
        Number(formData.get("amount"));

    const method =
        String(
            formData.get("method") || ""
        );


    if (!Number.isFinite(amount) || amount <= 0) {

        alert("Please enter a valid amount.");

        return;
    }


    if (!method) {

        alert(
            "Please select a withdrawal method."
        );

        return;
    }


    /*
     * Do not perform balance deduction here.
     *
     * The server must:
     *
     * 1. Authenticate the user.
     * 2. Validate the request.
     * 3. Check available balance.
     * 4. Create an immutable transaction record.
     * 5. Reserve/freeze the required amount.
     * 6. Send request to authorized review flow.
     * 7. Finalize or release the reservation atomically.
     */

    if (amount > walletState.balance) {

        alert(
            "Insufficient available balance."
        );

        return;
    }


    const request = {

        id:
            "WDR-" +
            Date.now(),

        type:
            "withdrawal",

        amount,

        method,

        status:
            "pending",

        createdAt:
            new Date().toISOString()

    };


    walletState.requests.unshift(request);

    walletState.pendingRequests++;

    renderRequests();

    updateWalletUI();

    withdrawForm.reset();

    updateWithdrawalMethod();

    closeModal(withdrawModal);

    alert(
        "Withdrawal request submitted for review."
    );

});

}

/* =========================================================
RENDER REQUESTS
========================================================= */

function renderRequests() {

const container =
    document.getElementById("walletHistory");

if (!container) return;


if (!walletState.requests.length) {

    container.innerHTML = `
        <div class="wallet-empty-state">
            <div class="empty-icon">◌</div>

            <h4>No wallet requests</h4>

            <p>
                Your deposit and withdrawal requests
                will appear here.
            </p>
        </div>
    `;

    return;
}


container.innerHTML =
    walletState.requests
        .slice(0, 8)
        .map(request => {

            const isDeposit =
                request.type === "deposit";

            const typeLabel =
                isDeposit
                    ? "Deposit"
                    : "Withdrawal";

            const icon =
                isDeposit
                    ? "+"
                    : "−";

            const amount =
                formatCurrency(request.amount);

            const date =
                new Date(
                    request.createdAt
                ).toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                );

            return `
                <div class="wallet-request-row">

                    <span
                        class="request-type-icon ${
                            isDeposit
                                ? "deposit"
                                : "withdraw"
                        }"
                    >
                        ${icon}
                    </span>

                    <div class="request-info">

                        <strong>
                            ${typeLabel}
                        </strong>

                        <small>
                            ${date}
                        </small>

                    </div>

                    <strong class="request-amount">
                        ${amount}
                    </strong>

                    <span
                        class="request-status ${
                            request.status
                        }"
                    >
                        ${request.status.toUpperCase()}
                    </span>

                </div>
            `;

        })
        .join("");

}

/* =========================================================
INITIALIZE
========================================================= */

loadPaymentConfiguration();

updateWalletUI();

renderRequests();

updateWithdrawalMethod();
