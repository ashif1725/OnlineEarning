/*
 * =========================================================
 * SKILLEARN HUB
 * ADMIN DEPOSIT REQUESTS
 *
 * SECURITY MODEL
 * ---------------------------------------------------------
 * 1. Admin authentication is required.
 * 2. Admin authorization must be enforced by Firestore
 *    Security Rules and/or trusted backend.
 * 3. Browser NEVER directly changes wallet balance.
 * 4. Approve/Reject calls a trusted backend endpoint.
 * 5. Backend must verify admin privileges again.
 * 6. Backend must perform atomic/idempotent wallet changes.
 * =========================================================
 */

"use strict";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


import {
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


import {
    auth,
    db,
    logoutUser,
    getUserProfile
} from "../firebase/firebase-auth.js";



/* =========================================================
   CONFIGURATION
   ========================================================= */

/*
 * IMPORTANT:
 *
 * Replace this with your deployed trusted backend endpoint
 * when the backend is created.
 *
 * Do NOT put secret API keys here.
 */

const APPROVAL_API_URL =
    "/api/admin/deposit-review";



/*
 * Maximum requests loaded by the browser.
 *
 * For a production system with a large database,
 * server-side pagination should be used.
 */

const MAX_REQUESTS =
    100;



/* =========================================================
   STATE
   ========================================================= */

let currentAdmin =
    null;


let currentAdminProfile =
    null;


let allRequests =
    [];


let filteredRequests =
    [];


let selectedRequest =
    null;



/* =========================================================
   DOM HELPER
   ========================================================= */

function $(id) {

    return document.getElementById(id);

}



/* =========================================================
   TEXT HELPER
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
   HTML ESCAPING
   ========================================================= */

function escapeHTML(
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
   CURRENCY
   ========================================================= */

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



/* =========================================================
   DATE
   ========================================================= */

function formatDate(
    timestamp
) {

    if (!timestamp) {
        return "—";
    }


    let date;


    try {

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

    } catch {

        return "—";

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
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(
        date
    );

}



/* =========================================================
   TIMESTAMP TO DATE VALUE
   ========================================================= */

function timestampValue(
    timestamp
) {

    if (!timestamp) {
        return 0;
    }


    try {

        if (
            typeof timestamp.toMillis ===
            "function"
        ) {

            return timestamp.toMillis();

        }


        if (
            typeof timestamp.toDate ===
            "function"
        ) {

            return timestamp.toDate()
                .getTime();

        }


        const value =
            new Date(timestamp)
                .getTime();


        return Number.isFinite(value)
            ? value
            : 0;

    } catch {

        return 0;

    }

}



/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function showAdminError(
    message
) {

    const errorBox =
        $("adminError");


    if (!errorBox) {
        return;
    }


    errorBox.textContent =
        message;


    errorBox.hidden =
        false;

}



function clearAdminError() {

    const errorBox =
        $("adminError");


    if (!errorBox) {
        return;
    }


    errorBox.textContent =
        "";


    errorBox.hidden =
        true;

}



/* =========================================================
   MODAL ERROR
   ========================================================= */

function showModalError(
    message
) {

    const box =
        $("modalError");


    if (!box) {
        return;
    }


    box.textContent =
        message;


    box.hidden =
        false;

}



function clearModalError() {

    const box =
        $("modalError");


    if (!box) {
        return;
    }


    box.textContent =
        "";


    box.hidden =
        true;

}



/* =========================================================
   ADMIN AUTHORIZATION
   ========================================================= */

async function verifyAdmin(
    user
) {

    /*
     * The frontend check is NOT a security boundary.
     *
     * Real protection must also exist in:
     *
     * - Firestore Security Rules
     * - Firebase custom claims
     * - trusted backend
     */

    const profile =
        await getUserProfile(
            user.uid
        );


    if (!profile) {

        throw new Error(
            "Admin profile could not be loaded."
        );

    }


    /*
     * Your user profile should contain
     * something like:
     *
     * role: "admin"
     *
     * or another controlled admin flag.
     */

    const role =
        String(
            profile.role || ""
        ).toLowerCase();


    if (
        role !== "admin"
    ) {

        throw new Error(
            "You are not authorized to access the admin panel."
        );

    }


    currentAdminProfile =
        profile;


    return true;

}



/* =========================================================
   LOAD ADMIN
   ========================================================= */

async function loadAdmin(
    user
) {

    currentAdmin =
        user;


    const profile =
        currentAdminProfile ||
        await getUserProfile(
            user.uid
        );


    const name =
        profile?.displayName ||
        user.displayName ||
        "Admin";


    setText(
        $("adminName"),
        name
    );


    setText(
        $("adminEmail"),
        user.email ||
        "—"
    );


    setText(
        $("adminAvatar"),
        name
            .trim()
            .charAt(0)
            .toUpperCase() ||
            "A"
    );

}



/* =========================================================
   LOAD DEPOSIT REQUESTS
   ========================================================= */

async function loadDepositRequests() {

    clearAdminError();


    const tableBody =
        $("requestsTableBody");


    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="table-loading"
                >
                    Loading requests...
                </td>
            </tr>
        `;

    }


    try {

        /*
         * IMPORTANT:
         *
         * Firestore Security Rules must ensure that only
         * authorized admin users can read this collection.
         */

        const depositsRef =
            collection(
                db,
                "deposits"
            );


        const requestsQuery =
            query(
                depositsRef,
                orderBy(
                    "createdAt",
                    "desc"
                ),
                limit(
                    MAX_REQUESTS
                )
            );


        const snapshot =
            await getDocs(
                requestsQuery
            );


        allRequests =
            snapshot.docs.map(
                item => ({

                    id:
                        item.id,

                    ...item.data()

                })
            );


        updateStatistics();


        applyFilters();


    } catch (error) {

        console.error(
            "Deposit request loading error:",
            error
        );


        if (
            error?.code ===
            "failed-precondition"
        ) {

            showAdminError(
                "Firestore needs the required index for this query."
            );

        } else if (
            error?.code ===
            "permission-denied"
        ) {

            showAdminError(
                "Access denied. Verify your admin role and Firestore Security Rules."
            );

        } else {

            showAdminError(
                "Unable to load deposit requests."
            );

        }


        allRequests =
            [];


        updateStatistics();


        renderRequests();

    }

}



/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {

    let pending =
        0;

    let approved =
        0;

    let rejected =
        0;

    let pendingAmount =
        0;


    for (
        const request of allRequests
    ) {

        const status =
            String(
                request.status ||
                "pending"
            ).toLowerCase();


        if (
            status ===
            "pending"
        ) {

            pending += 1;

            pendingAmount +=
                Number(
                    request.amount || 0
                );

        } else if (
            status ===
            "approved"
        ) {

            approved += 1;

        } else if (
            status ===
            "rejected"
        ) {

            rejected += 1;

        }

    }


    setText(
        $("pendingCount"),
        pending
    );


    setText(
        $("approvedCount"),
        approved
    );


    setText(
        $("rejectedCount"),
        rejected
    );


    setText(
        $("pendingAmount"),
        formatCurrency(
            pendingAmount
        )
    );


    setText(
        $("sidebarPendingCount"),
        pending
    );

}



/* =========================================================
   FILTERS
   ========================================================= */

function applyFilters() {

    const search =
        String(
            $("searchInput")?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const status =
        String(
            $("statusFilter")?.value ||
            "all"
        );


    const sort =
        String(
            $("sortFilter")?.value ||
            "newest"
        );


    filteredRequests =
        allRequests.filter(
            request => {

                const requestStatus =
                    String(
                        request.status ||
                        "pending"
                    ).toLowerCase();


                if (
                    status !==
                    "all" &&
                    requestStatus !==
                    status
                ) {

                    return false;

                }


                if (!search) {
                    return true;
                }


                const searchable =
                    [

                        request.id,

                        request.userId,

                        request.utr,

                        request.note

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                return searchable.includes(
                    search
                );

            }
        );


    filteredRequests.sort(
        (a, b) => {

            if (
                sort ===
                "highest"
            ) {

                return (
                    Number(b.amount || 0) -
                    Number(a.amount || 0)
                );

            }


            if (
                sort ===
                "lowest"
            ) {

                return (
                    Number(a.amount || 0) -
                    Number(b.amount || 0)
                );

            }


            const aDate =
                timestampValue(
                    a.createdAt
                );


            const bDate =
                timestampValue(
                    b.createdAt
                );


            if (
                sort ===
                "oldest"
            ) {

                return (
                    aDate -
                    bDate
                );

            }


            return (
                bDate -
                aDate
            );

        }
    );


    renderRequests();

}



/* =========================================================
   RENDER TABLE
   ========================================================= */

function renderRequests() {

    const tableBody =
        $("requestsTableBody");


    const mobileList =
        $("mobileRequestList");


    setText(
        $("resultCount"),
        `${filteredRequests.length} request${filteredRequests.length === 1 ? "" : "s"}`
    );


    if (
        !filteredRequests.length
    ) {

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="table-empty"
                    >
                        No deposit requests found.
                    </td>
                </tr>
            `;

        }


        if (mobileList) {

            mobileList.innerHTML = `
                <div class="table-empty">
                    No deposit requests found.
                </div>
            `;

        }


        return;

    }


    if (tableBody) {

        tableBody.innerHTML =
            filteredRequests
                .map(
                    request =>
                        renderTableRow(
                            request
                        )
                )
                .join("");

    }


    if (mobileList) {

        mobileList.innerHTML =
            filteredRequests
                .map(
                    request =>
                        renderMobileRequest(
                            request
                        )
                )
                .join("");

    }


    attachRequestButtons();

}



/* =========================================================
   TABLE ROW
   ========================================================= */

function renderTableRow(
    request
) {

    const status =
        String(
            request.status ||
            "pending"
        ).toLowerCase();


    const amount =
        Number(
            request.amount || 0
        );


    const userId =
        String(
            request.userId ||
            "Unknown"
        );


    const utr =
        String(
            request.utr ||
            "—"
        );


    const email =
        String(
            request.userEmail ||
            request.email ||
            "User account"
        );


    const requestShortId =
        request.id.length > 12
            ? `${request.id.slice(0, 12)}…`
            : request.id;


    const action =
        status === "pending"
            ? `
                <button
                    type="button"
                    class="action-button"
                    data-review-id="${escapeHTML(request.id)}"
                >
                    Review
                </button>
            `
            : `
                <button
                    type="button"
                    class="action-button view"
                    data-review-id="${escapeHTML(request.id)}"
                >
                    View
                </button>
            `;


    return `

        <tr>

            <td>

                <div class="request-cell">

                    <strong>
                        ${escapeHTML(requestShortId)}
                    </strong>

                    <small>
                        ${escapeHTML(request.id)}
                    </small>

                </div>

            </td>


            <td>

                <div class="customer-cell">

                    <strong>
                        ${escapeHTML(userId)}
                    </strong>

                    <small>
                        ${escapeHTML(email)}
                    </small>

                </div>

            </td>


            <td class="amount-cell">
                ${escapeHTML(
                    formatCurrency(amount)
                )}
            </td>


            <td
                class="utr-cell"
                title="${escapeHTML(utr)}"
            >
                ${escapeHTML(utr)}
            </td>


            <td class="date-cell">
                ${escapeHTML(
                    formatDate(
                        request.createdAt
                    )
                )}
            </td>


            <td>

                <span
                    class="status-badge ${escapeHTML(status)}"
                >
                    ${escapeHTML(status)}
                </span>

            </td>


            <td>
                ${action}
            </td>

        </tr>

    `;

}



/* =========================================================
   MOBILE REQUEST
   ========================================================= */

function renderMobileRequest(
    request
) {

    const status =
        String(
            request.status ||
            "pending"
        ).toLowerCase();


    const amount =
        Number(
            request.amount || 0
        );


    const userId =
        String(
            request.userId ||
            "Unknown"
        );


    const utr =
        String(
            request.utr ||
            "—"
        );


    return `

        <article
            class="mobile-request"
        >

            <div
                class="mobile-request-top"
            >

                <div>

                    <div
                        class="mobile-request-id"
                    >
                        ${escapeHTML(
                            request.id
                        )}
                    </div>

                    <div
                        class="mobile-request-date"
                    >
                        ${escapeHTML(
                            formatDate(
                                request.createdAt
                            )
                        )}
                    </div>

                </div>


                <span
                    class="status-badge ${escapeHTML(status)}"
                >
                    ${escapeHTML(status)}
                </span>

            </div>


            <div
                class="mobile-request-grid"
            >

                <div
                    class="mobile-request-field"
                >

                    <span>
                        Customer
                    </span>

                    <strong>
                        ${escapeHTML(userId)}
                    </strong>

                </div>


                <div
                    class="mobile-request-field"
                >

                    <span>
                        Amount
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatCurrency(
                                amount
                            )
                        )}
                    </strong>

                </div>


                <div
                    class="mobile-request-field"
                >

                    <span>
                        UTR
                    </span>

                    <strong>
                        ${escapeHTML(utr)}
                    </strong>

                </div>


                <div
                    class="mobile-request-field"
                >

                    <span>
                        Request ID
                    </span>

                    <strong>
                        ${escapeHTML(
                            request.id
                        )}
                    </strong>

                </div>

            </div>


            <button
                type="button"
                class="action-button mobile-request-action"
                data-review-id="${escapeHTML(request.id)}"
            >
                ${status === "pending" ? "Review request" : "View request"}
            </button>

        </article>

    `;

}



/* =========================================================
   ATTACH REVIEW BUTTONS
   ========================================================= */

function attachRequestButtons() {

    document
        .querySelectorAll(
            "[data-review-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const requestId =
                            button.dataset.reviewId;


                        openReviewModal(
                            requestId
                        );

                    }
                );

            }
        );

}



/* =========================================================
   OPEN MODAL
   ========================================================= */

function openReviewModal(
    requestId
) {

    selectedRequest =
        allRequests.find(
            request =>
                request.id ===
                requestId
        );


    if (!selectedRequest) {

        showAdminError(
            "The selected request could not be found."
        );

        return;

    }


    clearModalError();


    setText(
        $("modalAmount"),
        formatCurrency(
            selectedRequest.amount
        )
    );


    setText(
        $("modalUtr"),
        selectedRequest.utr ||
        "—"
    );


    setText(
        $("modalUserId"),
        selectedRequest.userId ||
        "—"
    );


    setText(
        $("modalRequestId"),
        selectedRequest.id
    );


    const noteWrapper =
        $("modalNoteWrapper");


    const note =
        String(
            selectedRequest.note ||
            ""
        ).trim();


    if (note) {

        setText(
            $("modalNote"),
            note
        );


        if (noteWrapper) {
            noteWrapper.hidden =
                false;
        }

    } else {

        if (noteWrapper) {
            noteWrapper.hidden =
                true;
        }

    }


    const status =
        String(
            selectedRequest.status ||
            "pending"
        ).toLowerCase();


    const approveButton =
        $("approveDeposit");

    const rejectButton =
        $("rejectDeposit");

    const reasonGroup =
        $("rejectReasonGroup");


    if (
        status ===
        "pending"
    ) {

        if (approveButton) {
            approveButton.hidden =
                false;
        }

        if (rejectButton) {
            rejectButton.hidden =
                false;
        }

        if (reasonGroup) {
            reasonGroup.hidden =
                false;
        }

    } else {

        if (approveButton) {
            approveButton.hidden =
                true;
        }

        if (rejectButton) {
            rejectButton.hidden =
                true;
        }

        if (reasonGroup) {
            reasonGroup.hidden =
                true;
        }

    }


    const reason =
        $("rejectReason");


    if (reason) {
        reason.value =
            selectedRequest.rejectionReason ||
            "";
    }


    const modal =
        $("reviewModal");


    if (modal) {

        modal.hidden =
            false;

        document.body.style.overflow =
            "hidden";

    }

}



/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeReviewModal() {

    const modal =
        $("reviewModal");


    if (modal) {
        modal.hidden =
            true;
    }


    document.body.style.overflow =
        "";


    selectedRequest =
        null;


    clearModalError();

}



/* =========================================================
   SECURE REVIEW REQUEST
   ========================================================= */

async function submitReview(
    action
) {

    if (!selectedRequest) {

        showModalError(
            "No deposit request is selected."
        );

        return;

    }


    if (!currentAdmin) {

        showModalError(
            "Your admin session has expired."
        );

        return;

    }


    const currentStatus =
        String(
            selectedRequest.status ||
            "pending"
        ).toLowerCase();


    if (
        currentStatus !==
        "pending"
    ) {

        showModalError(
            "This request has already been processed."
        );

        return;

    }


    let rejectionReason =
        "";


    if (
        action ===
        "reject"
    ) {

        rejectionReason =
            String(
                $("rejectReason")?.value ||
                ""
            ).trim();


        if (
            rejectionReason.length <
            3
        ) {

            showModalError(
                "Please enter a clear rejection reason."
            );

            return;

        }


        if (
            rejectionReason.length >
            500
        ) {

            showModalError(
                "Rejection reason is too long."
            );

            return;

        }

    }


    clearModalError();


    const approveButton =
        $("approveDeposit");

    const rejectButton =
        $("rejectDeposit");


    if (approveButton) {
        approveButton.disabled =
            true;
    }


    if (rejectButton) {
        rejectButton.disabled =
            true;
    }


    const originalApproveText =
        approveButton?.textContent ||
        "Approve";


    const originalRejectText =
        rejectButton?.textContent ||
        "Reject";


    if (
        action ===
        "approve"
    ) {

        if (approveButton) {
            approveButton.textContent =
                "Processing...";
        }

    } else {

        if (rejectButton) {
            rejectButton.textContent =
                "Processing...";
        }

    }


    try {

        /*
         * Get a fresh Firebase ID token.
         *
         * The backend must verify this token itself.
         */

        const idToken =
            await currentAdmin.getIdToken(
                true
            );


        /*
         * NO wallet update is performed here.
         *
         * The trusted backend receives the request.
         */

        const response =
            await fetch(
                APPROVAL_API_URL,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${idToken}`

                    },

                    body:
                        JSON.stringify({

                            requestId:
                                selectedRequest.id,

                            action:
                                action,

                            rejectionReason:
                                action ===
                                "reject"
                                    ? rejectionReason
                                    : null

                        })

                }
            );


        let result =
            null;


        try {

            result =
                await response.json();

        } catch {

            result =
                null;

        }


        if (
            !response.ok
        ) {

            throw new Error(
                result?.message ||
                "The server rejected the request."
            );

        }


        /*
         * Backend should return a success response only after
         * its transaction is safely committed.
         */

        closeReviewModal();


        await loadDepositRequests();


    } catch (error) {

        console.error(
            "Deposit review error:",
            error
        );


        showModalError(
            error?.message ||
            "Unable to process this request."
        );

    } finally {

        if (approveButton) {

            approveButton.disabled =
                false;

            approveButton.textContent =
                originalApproveText;

        }


        if (rejectButton) {

            rejectButton.disabled =
                false;

            rejectButton.textContent =
                originalRejectText;

        }

    }

}



/* =========================================================
   EVENTS
   ========================================================= */

$("searchInput")
    ?.addEventListener(
        "input",
        applyFilters
    );


$("statusFilter")
    ?.addEventListener(
        "change",
        applyFilters
    );


$("sortFilter")
    ?.addEventListener(
        "change",
        applyFilters
    );


$("refreshButton")
    ?.addEventListener(
        "click",
        async () => {

            const button =
                $("refreshButton");


            if (button) {
                button.disabled =
                    true;
            }


            await loadDepositRequests();


            if (button) {
                button.disabled =
                    false;
            }

        }
    );



/* =========================================================
   MODAL EVENTS
   ========================================================= */

$("closeReviewModal")
    ?.addEventListener(
        "click",
        closeReviewModal
    );


$("cancelReview")
    ?.addEventListener(
        "click",
        closeReviewModal
    );


$("approveDeposit")
    ?.addEventListener(
        "click",
        () => {

            submitReview(
                "approve"
            );

        }
    );


$("rejectDeposit")
    ?.addEventListener(
        "click",
        () => {

            submitReview(
                "reject"
            );

        }
    );


$("reviewModal")
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("reviewModal")
            ) {

                closeReviewModal();

            }

        }
    );



/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            const modal =
                $("reviewModal");


            if (
                modal &&
                !modal.hidden
            ) {

                closeReviewModal();

            }

        }

    }
);



/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

const sidebar =
    $("adminSidebar");

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
   AUTH INITIALIZATION
   ========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../auth/login.html";

            return;

        }


        try {

            /*
             * Frontend role check.
             * Backend must independently verify the admin.
             */

            await verifyAdmin(
                user
            );


            await loadAdmin(
                user
            );


            await loadDepositRequests();


        } catch (error) {

            console.error(
                "Admin initialization error:",
                error
            );


            showAdminError(
                error?.message ||
                "Admin authorization failed."
            );


            /*
             * Do not expose the admin interface to
             * unauthorized accounts.
             */

            setTimeout(
                () => {

                    window.location.href =
                        "../index.html";

                },
                1800
            );

        }

    }
);
