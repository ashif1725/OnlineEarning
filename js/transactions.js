/*

* =========================================================
* SKILLEARN HUB
* TRANSACTIONS MODULE
* 
* FRONTEND / READ-ONLY DEMO LAYER
* 
* Important:
* Transaction status, wallet balance and financial records
* must be controlled by the secure backend.
* 
* This file only:
* - renders UI
* - filters records
* - opens details
* - handles pagination
* - prepares a CSV export from currently loaded records
* 
* It must NOT be treated as the source of truth.
* =========================================================
  */

"use strict";

/* =========================================================
DEMO DATA

This temporary array allows the UI to be tested before
the backend API is connected.
========================================================= */

const transactionData = [];

/* =========================================================
CONFIGURATION
========================================================= */

const PAGE_SIZE = 8;

let currentPage = 1;

/* =========================================================
ELEMENTS
========================================================= */

const tableBody =
document.getElementById(
"transactionTableBody"
);

const mobileList =
document.getElementById(
"transactionMobileList"
);

const emptyState =
document.getElementById(
"transactionEmpty"
);

const searchInput =
document.getElementById(
"transactionSearch"
);

const typeFilter =
document.getElementById(
"typeFilter"
);

const statusFilter =
document.getElementById(
"statusFilter"
);

const dateFilter =
document.getElementById(
"dateFilter"
);

const previousPage =
document.getElementById(
"previousPage"
);

const nextPage =
document.getElementById(
"nextPage"
);

const currentPageElement =
document.getElementById(
"currentPage"
);

const paginationInfo =
document.getElementById(
"paginationInfo"
);

const clearFilters =
document.getElementById(
"clearFilters"
);

const exportButton =
document.getElementById(
"exportButton"
);

/* =========================================================
MODAL ELEMENTS
========================================================= */

const transactionModal =
document.getElementById(
"transactionModal"
);

const closeTransactionModal =
document.getElementById(
"closeTransactionModal"
);

const modalTransactionIcon =
document.getElementById(
"modalTransactionIcon"
);

const modalTransactionTitle =
document.getElementById(
"transactionModalTitle"
);

const modalTransactionStatus =
document.getElementById(
"modalTransactionStatus"
);

const modalTransactionId =
document.getElementById(
"modalTransactionId"
);

const modalTransactionType =
document.getElementById(
"modalTransactionType"
);

const modalTransactionAmount =
document.getElementById(
"modalTransactionAmount"
);

const modalTransactionDate =
document.getElementById(
"modalTransactionDate"
);

const modalTransactionReference =
document.getElementById(
"modalTransactionReference"
);

const modalReasonContainer =
document.getElementById(
"modalReasonContainer"
);

const modalTransactionReason =
document.getElementById(
"modalTransactionReason"
);

/* =========================================================
SECURITY HELPERS
========================================================= */

function escapeHTML(value) {

return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

/* =========================================================
CURRENCY
========================================================= */

function formatCurrency(value) {

const number =
    Number(value) || 0;

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
DATE
========================================================= */

function formatDate(value) {

const date =
    new Date(value);

if (Number.isNaN(date.getTime())) {
    return "—";
}

return date.toLocaleDateString(
    "en-IN",
    {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }
);

}

function formatDateTime(value) {

const date =
    new Date(value);

if (Number.isNaN(date.getTime())) {
    return "—";
}

return date.toLocaleString(
    "en-IN",
    {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }
);

}

/* =========================================================
GET FILTERED DATA
========================================================= */

function getFilteredTransactions() {

const search =
    String(
        searchInput?.value || ""
    )
    .trim()
    .toLowerCase();

const type =
    typeFilter?.value || "all";

const status =
    statusFilter?.value || "all";

const dateRange =
    dateFilter?.value || "all";


let records =
    [...transactionData];


/* SEARCH */

if (search) {

    records =
        records.filter(transaction => {

            const id =
                String(
                    transaction.id || ""
                ).toLowerCase();

            const reference =
                String(
                    transaction.reference || ""
                ).toLowerCase();

            return (
                id.includes(search) ||
                reference.includes(search)
            );

        });

}


/* TYPE */

if (type !== "all") {

    records =
        records.filter(
            transaction =>
                transaction.type === type
        );

}


/* STATUS */

if (status !== "all") {

    records =
        records.filter(
            transaction =>
                transaction.status === status
        );

}


/* DATE */

if (dateRange !== "all") {

    const days =
        Number(dateRange);

    const cutoff =
        Date.now() -
        days *
        24 *
        60 *
        60 *
        1000;


    records =
        records.filter(transaction => {

            const timestamp =
                new Date(
                    transaction.createdAt
                ).getTime();

            return timestamp >= cutoff;

        });

}


return records;

}

/* =========================================================
SUMMARY
========================================================= */

function updateSummary() {

const totalElement =
    document.getElementById(
        "summaryTotal"
    );

const incomingElement =
    document.getElementById(
        "summaryIncoming"
    );

const outgoingElement =
    document.getElementById(
        "summaryOutgoing"
    );

const pendingElement =
    document.getElementById(
        "summaryPending"
    );


let incoming = 0;
let outgoing = 0;
let pending = 0;


transactionData.forEach(
    transaction => {

        const amount =
            Number(
                transaction.amount
            ) || 0;


        if (
            transaction.type ===
            "deposit"
        ) {
            incoming += amount;
        }


        if (
            transaction.type ===
            "withdrawal"
        ) {
            outgoing += amount;
        }


        if (
            transaction.status ===
            "pending"
        ) {
            pending++;
        }

    }
);


if (totalElement) {
    totalElement.textContent =
        transactionData.length;
}

if (incomingElement) {
    incomingElement.textContent =
        formatCurrency(incoming);
}

if (outgoingElement) {
    outgoingElement.textContent =
        formatCurrency(outgoing);
}

if (pendingElement) {
    pendingElement.textContent =
        pending;
}

}

/* =========================================================
STATUS CLASS
========================================================= */

function statusHTML(status) {

const safeStatus =
    escapeHTML(status || "pending");

return `
    <span class="status-badge ${safeStatus}">
        ${safeStatus.toUpperCase()}
    </span>
`;

}

/* =========================================================
DESKTOP ROW
========================================================= */

function renderTableRow(transaction) {

const isDeposit =
    transaction.type === "deposit";

const icon =
    isDeposit
        ? "+"
        : "−";

const typeLabel =
    isDeposit
        ? "Deposit"
        : "Withdrawal";

const amountClass =
    isDeposit
        ? "incoming"
        : "outgoing";

const amountPrefix =
    isDeposit
        ? "+"
        : "−";


return `
    <tr>

        <td>

            <div class="transaction-cell">

                <span
                    class="transaction-cell-icon ${
                        isDeposit
                            ? "deposit"
                            : "withdrawal"
                    }"
                >
                    ${icon}
                </span>

                <div class="transaction-cell-info">

                    <strong>
                        ${escapeHTML(
                            transaction.id
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            transaction.reference ||
                            "No reference"
                        )}
                    </small>

                </div>

            </div>

        </td>


        <td>

            <span
                class="transaction-type ${
                    isDeposit
                        ? "deposit"
                        : "withdrawal"
                }"
            >
                ${typeLabel}
            </span>

        </td>


        <td>
            ${formatDate(
                transaction.createdAt
            )}
        </td>


        <td>

            <span
                class="transaction-amount ${
                    amountClass
                }"
            >
                ${amountPrefix}
                ${formatCurrency(
                    transaction.amount
                )}
            </span>

        </td>


        <td>
            ${statusHTML(
                transaction.status
            )}
        </td>


        <td>

            <button
                type="button"
                class="transaction-view-button"
                data-transaction-id="${
                    escapeHTML(
                        transaction.id
                    )
                }"
            >
                View
            </button>

        </td>

    </tr>
`;

}

/* =========================================================
MOBILE CARD
========================================================= */

function renderMobileCard(transaction) {

const isDeposit =
    transaction.type === "deposit";

const icon =
    isDeposit
        ? "+"
        : "−";

const typeLabel =
    isDeposit
        ? "Deposit"
        : "Withdrawal";

const amountClass =
    isDeposit
        ? "incoming"
        : "outgoing";

const amountPrefix =
    isDeposit
        ? "+"
        : "−";


return `
    <article class="transaction-mobile-card">

        <div class="mobile-transaction-top">

            <div class="mobile-transaction-left">

                <span
                    class="transaction-cell-icon ${
                        isDeposit
                            ? "deposit"
                            : "withdrawal"
                    }"
                >
                    ${icon}
                </span>

                <div class="mobile-transaction-info">

                    <strong>
                        ${escapeHTML(
                            typeLabel
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            transaction.id
                        )}
                    </small>

                </div>

            </div>


            <strong
                class="mobile-transaction-amount ${
                    amountClass
                }"
            >
                ${amountPrefix}
                ${formatCurrency(
                    transaction.amount
                )}
            </strong>

        </div>


        <div class="mobile-transaction-bottom">

            <span>
                ${formatDateTime(
                    transaction.createdAt
                )}
            </span>

            ${statusHTML(
                transaction.status
            )}

        </div>


        <button
            type="button"
            class="transaction-view-button"
            data-transaction-id="${
                escapeHTML(
                    transaction.id
                )
            }"
            style="margin-top:10px;"
        >
            View details
        </button>

    </article>
`;

}

/* =========================================================
RENDER
========================================================= */

function renderTransactions() {

const filtered =
    getFilteredTransactions();


const totalPages =
    Math.max(
        1,
        Math.ceil(
            filtered.length /
            PAGE_SIZE
        )
    );


if (currentPage > totalPages) {
    currentPage = totalPages;
}


const start =
    (currentPage - 1) *
    PAGE_SIZE;

const pageRecords =
    filtered.slice(
        start,
        start + PAGE_SIZE
    );


if (!pageRecords.length) {

    tableBody.innerHTML = "";

    mobileList.innerHTML = "";

    emptyState.hidden = false;

} else {

    emptyState.hidden = true;

    tableBody.innerHTML =
        pageRecords
            .map(renderTableRow)
            .join("");

    mobileList.innerHTML =
        pageRecords
            .map(renderMobileCard)
            .join("");

}


if (filtered.length) {

    const from =
        start + 1;

    const to =
        Math.min(
            start + PAGE_SIZE,
            filtered.length
        );

    paginationInfo.textContent =
        `Showing ${from}–${to} of ${filtered.length}`;

} else {

    paginationInfo.textContent =
        "Showing 0 transactions";

}


currentPageElement.textContent =
    currentPage;

previousPage.disabled =
    currentPage <= 1;

nextPage.disabled =
    currentPage >= totalPages;


bindViewButtons();

}

/* =========================================================
VIEW DETAILS
========================================================= */

function bindViewButtons() {

document
    .querySelectorAll(
        "[data-transaction-id]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const id =
                    button.dataset
                        .transactionId;

                openTransactionDetails(id);

            }
        );

    });

}

function openTransactionDetails(id) {

const transaction =
    transactionData.find(
        item => item.id === id
    );


if (!transaction) {
    return;
}


const isDeposit =
    transaction.type === "deposit";


modalTransactionIcon.textContent =
    isDeposit
        ? "+"
        : "−";


modalTransactionIcon.style.color =
    isDeposit
        ? "#59dca5"
        : "#ff9696";


modalTransactionIcon.style.background =
    isDeposit
        ? "rgba(79,218,160,0.08)"
        : "rgba(255,113,113,0.07)";


modalTransactionTitle.textContent =
    isDeposit
        ? "Deposit"
        : "Withdrawal";


modalTransactionStatus.textContent =
    String(
        transaction.status || "pending"
    ).toUpperCase();


modalTransactionStatus.className =
    `status-badge ${
        transaction.status || "pending"
    }`;


modalTransactionId.textContent =
    transaction.id || "—";


modalTransactionType.textContent =
    isDeposit
        ? "Deposit"
        : "Withdrawal";


modalTransactionAmount.textContent =
    formatCurrency(
        transaction.amount
    );


modalTransactionDate.textContent =
    formatDateTime(
        transaction.createdAt
    );


modalTransactionReference.textContent =
    transaction.reference ||
    "—";


if (transaction.reason) {

    modalReasonContainer.hidden =
        false;

    modalTransactionReason.textContent =
        transaction.reason;

} else {

    modalReasonContainer.hidden =
        true;

}


transactionModal.classList.add(
    "active"
);

transactionModal.setAttribute(
    "aria-hidden",
    "false"
);

document.body.style.overflow =
    "hidden";

}

/* =========================================================
CLOSE MODAL
========================================================= */

function closeModal() {

transactionModal.classList.remove(
    "active"
);

transactionModal.setAttribute(
    "aria-hidden",
    "true"
);

document.body.style.overflow =
    "";

}

if (closeTransactionModal) {

closeTransactionModal.addEventListener(
    "click",
    closeModal
);

}

document
.querySelector(
".transaction-modal-backdrop"
)
?.addEventListener(
"click",
closeModal
);

document.addEventListener(
"keydown",
event => {

    if (
        event.key ===
        "Escape"
    ) {
        closeModal();
    }

}

);

/* =========================================================
FILTER EVENTS
========================================================= */

function resetToFirstPage() {

currentPage = 1;

renderTransactions();

}

searchInput?.addEventListener(
"input",
resetToFirstPage
);

typeFilter?.addEventListener(
"change",
resetToFirstPage
);

statusFilter?.addEventListener(
"change",
resetToFirstPage
);

dateFilter?.addEventListener(
"change",
resetToFirstPage
);

/* =========================================================
CLEAR FILTERS
========================================================= */

clearFilters?.addEventListener(
"click",
() => {

    searchInput.value = "";

    typeFilter.value =
        "all";

    statusFilter.value =
        "all";

    dateFilter.value =
        "all";

    currentPage = 1;

    renderTransactions();

}

);

/* =========================================================
PAGINATION
========================================================= */

previousPage?.addEventListener(
"click",
() => {

    if (currentPage > 1) {

        currentPage--;

        renderTransactions();

    }

}

);

nextPage?.addEventListener(
"click",
() => {

    const filtered =
        getFilteredTransactions();

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filtered.length /
                PAGE_SIZE
            )
        );


    if (
        currentPage <
        totalPages
    ) {

        currentPage++;

        renderTransactions();

    }

}

);

/* =========================================================
CSV EXPORT
========================================================= */

function csvEscape(value) {

const text =
    String(value ?? "");

return `"${text.replaceAll(
    '"',
    '""'
)}"`;

}

function exportTransactions() {

const records =
    getFilteredTransactions();


if (!records.length) {

    alert(
        "There are no transactions to export."
    );

    return;

}


const headers = [
    "Transaction ID",
    "Type",
    "Date",
    "Amount",
    "Status",
    "Reference"
];


const rows =
    records.map(
        transaction => [

            transaction.id,

            transaction.type,

            formatDateTime(
                transaction.createdAt
            ),

            transaction.amount,

            transaction.status,

            transaction.reference || ""

        ]
    );


const csv =
    [
        headers,
        ...rows
    ]
    .map(
        row =>
            row
                .map(csvEscape)
                .join(",")
    )
    .join("\n");


const blob =
    new Blob(
        [csv],
        {
            type:
                "text/csv;charset=utf-8;"
        }
    );


const url =
    URL.createObjectURL(
        blob
    );


const link =
    document.createElement(
        "a"
    );

link.href = url;

link.download =
    "skillearn-transactions.csv";

document.body.appendChild(
    link
);

link.click();

link.remove();

URL.revokeObjectURL(url);

}

exportButton?.addEventListener(
"click",
exportTransactions
);

/* =========================================================
INITIALIZE
========================================================= */

updateSummary();

renderTransactions();
