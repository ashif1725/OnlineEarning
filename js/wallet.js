/* =========================================================
   SkillEarn Hub - Wallet
   Firebase Compat SDK
   ========================================================= */

(function () {
    "use strict";

    // Firebase check
    if (typeof firebase === "undefined") {
        console.error("Firebase SDK is not loaded.");
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    let currentUser = null;


    /* =====================================================
       DOM HELPERS
       ===================================================== */

    function getElement(...ids) {
        for (const id of ids) {
            const element = document.getElementById(id);
            if (element) return element;
        }
        return null;
    }


    function setText(ids, value) {
        const element = getElement(...ids);

        if (element) {
            element.textContent = value;
        }
    }


    function formatMoney(amount) {
        const value = Number(amount || 0);

        return "₹" + value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }


    function showMessage(message, type = "info") {
        const element = getElement(
            "walletMessage",
            "wallet-message"
        );

        if (!element) {
            console.log(message);
            return;
        }

        element.textContent = message;
        element.className = "wallet-message " + type;
        element.style.display = "block";
    }


    /* =====================================================
       LOAD WALLET
       ===================================================== */

    async function loadWallet(user) {

        if (!user) {
            setText(
                ["walletBalance", "balance", "userWalletBalance"],
                "₹0.00"
            );

            return;
        }

        currentUser = user;

        try {

            const walletRef = db
                .collection("wallets")
                .doc(user.uid);

            const walletSnap = await walletRef.get();

            let balance = 0;

            if (walletSnap.exists) {
                const data = walletSnap.data();

                balance = Number(
                    data.balance || 0
                );
            }

            setText(
                ["walletBalance", "balance", "userWalletBalance"],
                formatMoney(balance)
            );

            await loadTransactions(user.uid);

        } catch (error) {

            console.error(
                "Wallet loading error:",
                error
            );

            showMessage(
                "Wallet load nahi ho saka.",
                "error"
            );
        }
    }


    /* =====================================================
       CREATE WALLET DOCUMENT
       ===================================================== */

    async function createWalletIfMissing(user) {

        if (!user) return;

        const walletRef = db
            .collection("wallets")
            .doc(user.uid);

        const walletSnap = await walletRef.get();

        if (!walletSnap.exists) {

            /*
             * IMPORTANT:
             * This only creates a zero-balance wallet.
             * It does NOT add money.
             */

            try {

                await walletRef.set({
                    balance: 0,
                    currency: "INR",
                    createdAt:
                        firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt:
                        firebase.firestore.FieldValue.serverTimestamp()
                });

            } catch (error) {

                /*
                 * With secure Firestore rules, normal users
                 * may not be allowed to create wallet documents.
                 * In that case an admin/backend should create it.
                 */

                console.warn(
                    "Wallet creation handled by server/admin:",
                    error
                );
            }
        }
    }


    /* =====================================================
       LOAD TRANSACTIONS
       ===================================================== */

    async function loadTransactions(uid) {

        const container = getElement(
            "walletTransactions",
            "transactionsList",
            "walletHistory"
        );

        if (!container) return;

        try {

            const snapshot = await db
                .collection("walletTransactions")
                .where("userId", "==", uid)
                .get();

            if (snapshot.empty) {

                container.innerHTML = `
                    <div class="wallet-empty">
                        No wallet transactions yet.
                    </div>
                `;

                return;
            }

            const transactions = [];

            snapshot.forEach(doc => {

                transactions.push({
                    id: doc.id,
                    ...doc.data()
                });

            });

            // Newest first on client side
            transactions.sort((a, b) => {

                const aTime =
                    a.createdAt &&
                    typeof a.createdAt.toMillis === "function"
                        ? a.createdAt.toMillis()
                        : 0;

                const bTime =
                    b.createdAt &&
                    typeof b.createdAt.toMillis === "function"
                        ? b.createdAt.toMillis()
                        : 0;

                return bTime - aTime;
            });


            container.innerHTML =
                transactions.map(transaction => {

                    const amount =
                        Number(transaction.amount || 0);

                    const type =
                        String(
                            transaction.type || "credit"
                        ).toLowerCase();

                    const isCredit =
                        type === "credit" ||
                        type === "bonus" ||
                        type === "refund";

                    const sign =
                        isCredit ? "+" : "-";

                    const date =
                        formatDate(
                            transaction.createdAt
                        );

                    return `
                        <div class="wallet-transaction">

                            <div class="wallet-transaction-info">

                                <strong>
                                    ${escapeHTML(
                                        transaction.description ||
                                        "Wallet transaction"
                                    )}
                                </strong>

                                <small>
                                    ${date}
                                </small>

                            </div>

                            <div class="wallet-amount ${
                                isCredit
                                    ? "credit"
                                    : "debit"
                            }">

                                ${sign}${formatMoney(amount)}

                            </div>

                        </div>
                    `;

                }).join("");

        } catch (error) {

            console.error(
                "Transaction loading error:",
                error
            );

            container.innerHTML = `
                <div class="wallet-empty">
                    Unable to load transactions.
                </div>
            `;
        }
    }


    /* =====================================================
       DATE
       ===================================================== */

    function formatDate(timestamp) {

        if (
            timestamp &&
            typeof timestamp.toDate === "function"
        ) {

            return timestamp
                .toDate()
                .toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short"
                });
        }

        return "Date unavailable";
    }


    /* =====================================================
       AUTH STATE
       ===================================================== */

    auth.onAuthStateChanged(async function (user) {

        currentUser = user || null;

        if (!user) {

            setText(
                ["walletBalance", "balance", "userWalletBalance"],
                "₹0.00"
            );

            return;
        }

        await createWalletIfMissing(user);
        await loadWallet(user);
    });


    /* =====================================================
       REFRESH WALLET
       ===================================================== */

    async function refreshWallet() {

        if (!currentUser) {
            showMessage(
                "Please login first.",
                "error"
            );
            return;
        }

        await loadWallet(currentUser);
    }


    /* =====================================================
       HTML ESCAPE
       ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    /* =====================================================
       GLOBAL API
       ===================================================== */

    window.SkillEarnWallet = {

        loadWallet,
        loadTransactions,
        refreshWallet,

        getCurrentUser: function () {
            return currentUser;
        }

    };


    /* =====================================================
       REFRESH BUTTON
       ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            const refreshButton =
                getElement(
                    "refreshWallet",
                    "refreshWalletBtn"
                );

            if (refreshButton) {

                refreshButton.addEventListener(
                    "click",
                    refreshWallet
                );
            }
        }
    );

})();
