/* =========================================================
   SKILLEARN HUB
   Main Website JavaScript
   ========================================================= */


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    initializeMobileMenu();
    initializeScrollEffects();
    initializeFAQ();
    initializeCounters();
    initializeCourseSearch();
    initializePasswordToggle();
    initializeCurrentYear();

});


/* =========================================================
   MOBILE MENU
   ========================================================= */

function initializeMobileMenu() {

    const menuButton =
        document.getElementById("menuButton");

    const mobileMenu =
        document.getElementById("mobileMenu");

    if (!menuButton || !mobileMenu) {
        return;
    }

    menuButton.addEventListener(
        "click",
        function () {

            mobileMenu.classList.toggle("active");

            menuButton.classList.toggle("active");

        }
    );


    const menuLinks =
        mobileMenu.querySelectorAll("a");

    menuLinks.forEach(function (link) {

        link.addEventListener(
            "click",
            function () {

                mobileMenu.classList.remove(
                    "active"
                );

                menuButton.classList.remove(
                    "active"
                );

            }
        );

    });

}


/* =========================================================
   SCROLL EFFECTS
   ========================================================= */

function initializeScrollEffects() {

    const header =
        document.querySelector(".header");

    if (!header) {
        return;
    }

    window.addEventListener(
        "scroll",
        function () {

            if (window.scrollY > 50) {

                header.classList.add(
                    "scrolled"
                );

            } else {

                header.classList.remove(
                    "scrolled"
                );

            }

        }
    );

}


/* =========================================================
   FAQ ACCORDION
   ========================================================= */

function initializeFAQ() {

    const faqItems =
        document.querySelectorAll(".faq-item");

    faqItems.forEach(function (item) {

        const question =
            item.querySelector(".faq-question");

        if (!question) {
            return;
        }

        question.addEventListener(
            "click",
            function () {

                const currentlyOpen =
                    item.classList.contains(
                        "active"
                    );


                /* Close all */

                faqItems.forEach(
                    function (otherItem) {

                        otherItem.classList.remove(
                            "active"
                        );

                    }
                );


                /* Open clicked */

                if (!currentlyOpen) {

                    item.classList.add(
                        "active"
                    );

                }

            }
        );

    });

}


/* =========================================================
   ANIMATED COUNTERS
   ========================================================= */

function initializeCounters() {

    const counters =
        document.querySelectorAll(
            "[data-counter]"
        );

    if (!counters.length) {
        return;
    }


    const observer =
        new IntersectionObserver(
            function (entries) {

                entries.forEach(
                    function (entry) {

                        if (
                            !entry.isIntersecting
                        ) {
                            return;
                        }

                        animateCounter(
                            entry.target
                        );

                        observer.unobserve(
                            entry.target
                        );

                    }
                );

            },
            {
                threshold: 0.5
            }
        );


    counters.forEach(function (counter) {

        observer.observe(counter);

    });

}


function animateCounter(element) {

    const target =
        parseInt(
            element.dataset.counter,
            10
        ) || 0;

    const duration = 1500;

    const startTime =
        performance.now();


    function updateCounter(
        currentTime
    ) {

        const elapsed =
            currentTime - startTime;

        const progress =
            Math.min(
                elapsed / duration,
                1
            );


        const value =
            Math.floor(
                progress * target
            );


        element.textContent =
            value.toLocaleString();


        if (progress < 1) {

            requestAnimationFrame(
                updateCounter
            );

        }

    }


    requestAnimationFrame(
        updateCounter
    );

}


/* =========================================================
   COURSE SEARCH
   ========================================================= */

function initializeCourseSearch() {

    const searchInput =
        document.getElementById(
            "courseSearch"
        );

    const courseCards =
        document.querySelectorAll(
            ".course-card"
        );


    if (
        !searchInput ||
        !courseCards.length
    ) {
        return;
    }


    searchInput.addEventListener(
        "input",
        function () {

            const searchTerm =
                searchInput.value
                    .trim()
                    .toLowerCase();


            courseCards.forEach(
                function (card) {

                    const text =
                        card.textContent
                            .toLowerCase();


                    if (
                        text.includes(
                            searchTerm
                        )
                    ) {

                        card.style.display =
                            "";

                    } else {

                        card.style.display =
                            "none";

                    }

                }
            );

        }
    );

}


/* =========================================================
   PASSWORD SHOW / HIDE
   ========================================================= */

function initializePasswordToggle() {

    const toggleButtons =
        document.querySelectorAll(
            "[data-password-toggle]"
        );


    toggleButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const targetId =
                        button.dataset
                            .passwordToggle;


                    const passwordInput =
                        document.getElementById(
                            targetId
                        );


                    if (!passwordInput) {
                        return;
                    }


                    if (
                        passwordInput.type ===
                        "password"
                    ) {

                        passwordInput.type =
                            "text";

                        button.textContent =
                            "Hide";

                    } else {

                        passwordInput.type =
                            "password";

                        button.textContent =
                            "Show";

                    }

                }
            );

        }
    );

}


/* =========================================================
   SMOOTH SCROLL
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const link =
            event.target.closest(
                'a[href^="#"]'
            );


        if (!link) {
            return;
        }


        const targetId =
            link.getAttribute("href");


        if (
            !targetId ||
            targetId === "#"
        ) {
            return;
        }


        const target =
            document.querySelector(
                targetId
            );


        if (!target) {
            return;
        }


        event.preventDefault();


        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
);


/* =========================================================
   BACK TO TOP BUTTON
   ========================================================= */

function initializeBackToTop() {

    const button =
        document.getElementById(
            "backToTop"
        );


    if (!button) {
        return;
    }


    window.addEventListener(
        "scroll",
        function () {

            if (window.scrollY > 400) {

                button.classList.add(
                    "show"
                );

            } else {

                button.classList.remove(
                    "show"
                );

            }

        }
    );


    button.addEventListener(
        "click",
        function () {

            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }
    );

}


document.addEventListener(
    "DOMContentLoaded",
    initializeBackToTop
);


/* =========================================================
   TOAST NOTIFICATION
   ========================================================= */

function showToast(
    message,
    type = "success"
) {

    let toast =
        document.getElementById(
            "siteToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "siteToast";

        toast.className =
            "site-toast";

        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.className =
        "site-toast " + type;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   COPY TO CLIPBOARD
   ========================================================= */

async function copyToClipboard(
    text,
    successMessage = "Copied successfully!"
) {

    if (!text) {
        return;
    }


    try {

        await navigator.clipboard.writeText(
            text
        );

        showToast(
            successMessage,
            "success"
        );

    } catch (error) {

        console.error(
            "Clipboard error:",
            error
        );

        showToast(
            "Unable to copy. Please copy manually.",
            "error"
        );

    }

}


/* =========================================================
   COPY BUTTONS
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                "[data-copy]"
            );


        if (!button) {
            return;
        }


        const text =
            button.dataset.copy;


        copyToClipboard(text);

    }
);


/* =========================================================
   CONFIRM ACTION
   ========================================================= */

function confirmAction(
    message,
    callback
) {

    if (
        window.confirm(message)
    ) {

        if (
            typeof callback ===
            "function"
        ) {

            callback();

        }

    }

}


/* =========================================================
   AUTH USER UI
   ========================================================= */

function initializeUserUI() {

    if (
        typeof firebase ===
        "undefined" ||
        typeof firebase.auth !==
        "function"
    ) {
        return;
    }


    firebase.auth().onAuthStateChanged(
        function (user) {

            const loggedInElements =
                document.querySelectorAll(
                    "[data-auth='logged-in']"
                );


            const loggedOutElements =
                document.querySelectorAll(
                    "[data-auth='logged-out']"
                );


            if (user) {

                loggedInElements.forEach(
                    function (element) {

                        element.style.display =
                            "";

                    }
                );


                loggedOutElements.forEach(
                    function (element) {

                        element.style.display =
                            "none";

                    }
                );


                /* User name */

                document
                    .querySelectorAll(
                        "[data-user-name]"
                    )
                    .forEach(
                        function (element) {

                            element.textContent =
                                user.displayName ||
                                "SkillEarn User";

                        }
                    );


                /* User email */

                document
                    .querySelectorAll(
                        "[data-user-email]"
                    )
                    .forEach(
                        function (element) {

                            element.textContent =
                                user.email || "";

                        }
                    );


                /* User photo */

                document
                    .querySelectorAll(
                        "[data-user-photo]"
                    )
                    .forEach(
                        function (element) {

                            if (
                                user.photoURL
                            ) {

                                element.src =
                                    user.photoURL;

                            }

                        }
                    );

            } else {

                loggedInElements.forEach(
                    function (element) {

                        element.style.display =
                            "none";

                    }
                );


                loggedOutElements.forEach(
                    function (element) {

                        element.style.display =
                            "";

                    }
                );

            }

        }
    );

}


document.addEventListener(
    "DOMContentLoaded",
    initializeUserUI
);


/* =========================================================
   CURRENT YEAR
   ========================================================= */

function initializeCurrentYear() {

    const yearElements =
        document.querySelectorAll(
            "[data-current-year]"
        );


    yearElements.forEach(
        function (element) {

            element.textContent =
                new Date().getFullYear();

        }
    );

}


/* =========================================================
   PAGE LOADER
   ========================================================= */

function hidePageLoader() {

    const loader =
        document.getElementById(
            "pageLoader"
        );


    if (!loader) {
        return;
    }


    loader.classList.add(
        "hidden"
    );


    setTimeout(
        function () {

            loader.style.display =
                "none";

        },
        400
    );

}


window.addEventListener(
    "load",
    function () {

        hidePageLoader();

    }
);


/* =========================================================
   FORM DOUBLE-SUBMIT PROTECTION
   ========================================================= */

document.addEventListener(
    "submit",
    function (event) {

        const form =
            event.target;


        if (!form || !form.matches(
            "form"
        )) {
            return;
        }


        if (
            form.dataset.submitting ===
            "true"
        ) {

            event.preventDefault();

            return;

        }


        /* Don't interfere with Firebase auth
           forms handled by auth.js */

        if (
            form.id === "loginForm" ||
            form.id === "registerForm"
        ) {
            return;
        }


        form.dataset.submitting =
            "true";


        const button =
            form.querySelector(
                'button[type="submit"]'
            );


        if (button) {

            button.disabled =
                true;

        }


        setTimeout(
            function () {

                form.dataset.submitting =
                    "false";


                if (button) {

                    button.disabled =
                        false;

                }

            },
            5000
        );

    }
);


/* =========================================================
   ONLINE / OFFLINE STATUS
   ========================================================= */

window.addEventListener(
    "offline",
    function () {

        showToast(
            "You are offline. Please check your internet connection.",
            "error"
        );

    }
);


window.addEventListener(
    "online",
    function () {

        showToast(
            "Internet connection restored.",
            "success"
        );

    }
);


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.showToast =
    showToast;

window.copyToClipboard =
    copyToClipboard;

window.confirmAction =
    confirmAction;

window.hidePageLoader =
    hidePageLoader;


/* =========================================================
   END OF SCRIPT.JS
   ========================================================= */
