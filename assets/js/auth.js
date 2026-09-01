/* =========================================================
   SkillEarn Hub
   assets/js/auth.js

   Handles:
   - Registration
   - Login
   - Client-side validation
   - API requests
   - Error/success messages
   - Login session storage
   ========================================================= */

(function () {
    "use strict";


    /* =========================================================
       API CONFIG
       ========================================================= */

    const API_BASE_URL =
        (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL)
            ? window.APP_CONFIG.API_BASE_URL.replace(/\/+$/, "")
            : "";


    /* =========================================================
       HELPERS
       ========================================================= */

    function getElement(id) {
        return document.getElementById(id);
    }


    function getFieldError(fieldId) {
        return document.querySelector(
            '[data-error-for="' + fieldId + '"]'
        );
    }


    function setFieldError(fieldId, message) {
        const element = getFieldError(fieldId);

        if (!element) {
            return;
        }

        element.textContent = message || "";

        const input = getElement(fieldId);

        if (input) {
            if (message) {
                input.classList.add("input-error");
                input.setAttribute("aria-invalid", "true");
            } else {
                input.classList.remove("input-error");
                input.removeAttribute("aria-invalid");
            }
        }
    }


    function clearFieldErrors() {
        document
            .querySelectorAll(".field-error")
            .forEach(function (element) {
                element.textContent = "";
            });

        document
            .querySelectorAll(".input-error")
            .forEach(function (element) {
                element.classList.remove("input-error");
                element.removeAttribute("aria-invalid");
            });
    }


    function showMessage(element, message, type) {
        if (!element) {
            return;
        }

        element.textContent = message || "";

        element.classList.remove(
            "success",
            "error",
            "info"
        );

        if (type) {
            element.classList.add(type);
        }
    }


    function setButtonLoading(button, loading, normalText) {
        if (!button) {
            return;
        }

        if (loading) {
            button.disabled = true;
            button.dataset.originalText =
                button.textContent.trim();

            button.textContent = "Please wait...";
        } else {
            button.disabled = false;

            button.textContent =
                normalText ||
                button.dataset.originalText ||
                "Submit";
        }
    }


    function normalizeEmail(email) {
        return String(email || "")
            .trim()
            .toLowerCase();
    }


    function normalizePhone(phone) {
        return String(phone || "")
            .trim();
    }


    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }


    function isStrongPassword(password) {
        /*
         * Minimum 12 characters
         * At least one lowercase
         * At least one uppercase
         * At least one number
         * At least one special character
         */

        return (
            password.length >= 12 &&
            /[a-z]/.test(password) &&
            /[A-Z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[^A-Za-z0-9]/.test(password)
        );
    }


    /* =========================================================
       API REQUEST HELPER
       ========================================================= */

    async function apiRequest(endpoint, options) {

        const url =
            API_BASE_URL +
            endpoint;


        const requestOptions = {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        };


        if (options) {
            Object.assign(
                requestOptions,
                options
            );
        }


        if (
            requestOptions.body &&
            typeof requestOptions.body !== "string"
        ) {
            requestOptions.headers = {
                ...requestOptions.headers,
                "Content-Type": "application/json"
            };

            requestOptions.body =
                JSON.stringify(requestOptions.body);
        }


        let response;


        try {

            response = await fetch(
                url,
                requestOptions
            );

        } catch (error) {

            throw new Error(
                "Unable to connect to the server. Please check your internet connection and try again."
            );
        }


        let data = null;


        const contentType =
            response.headers.get("content-type") || "";


        if (
            contentType.includes("application/json")
        ) {

            try {
                data = await response.json();
            } catch (error) {
                data = null;
            }

        } else {

            try {
                const text = await response.text();

                data = text
                    ? { message: text }
                    : null;

            } catch (error) {
                data = null;
            }
        }


        if (!response.ok) {

            const message =
                data &&
                (
                    data.message ||
                    data.error ||
                    data.detail
                )
                    ? (
                        data.message ||
                        data.error ||
                        data.detail
                    )
                    : "The server returned an error. Please try again.";

            const apiError = new Error(message);

            apiError.status =
                response.status;

            apiError.data =
                data;

            throw apiError;
        }


        return data;
    }


    /* =========================================================
       REGISTRATION VALIDATION
       ========================================================= */

    function validateRegistration() {

        clearFieldErrors();


        const fullName =
            getElement("fullName")?.value.trim() || "";


        const email =
            normalizeEmail(
                getElement("email")?.value
            );


        const phone =
            normalizePhone(
                getElement("phone")?.value
            );


        const password =
            getElement("password")?.value || "";


        const confirmPassword =
            getElement("confirmPassword")?.value || "";


        const terms =
            getElement("terms")?.checked || false;


        let valid = true;


        /* Full Name */

        if (!fullName) {

            setFieldError(
                "fullName",
                "Please enter your full name."
            );

            valid = false;

        } else if (fullName.length < 2) {

            setFieldError(
                "fullName",
                "Name must contain at least 2 characters."
            );

            valid = false;

        } else if (fullName.length > 80) {

            setFieldError(
                "fullName",
                "Name cannot exceed 80 characters."
            );

            valid = false;
        }


        /* Email */

        if (!email) {

            setFieldError(
                "email",
                "Please enter your email address."
            );

            valid = false;

        } else if (!isValidEmail(email)) {

            setFieldError(
                "email",
                "Please enter a valid email address."
            );

            valid = false;

        } else if (email.length > 160) {

            setFieldError(
                "email",
                "Email address is too long."
            );

            valid = false;
        }


        /* Phone */

        if (!phone) {

            setFieldError(
                "phone",
                "Please enter your mobile number."
            );

            valid = false;

        } else {

            const digits =
                phone.replace(/\D/g, "");

            if (digits.length < 10) {

                setFieldError(
                    "phone",
                    "Please enter a valid mobile number."
                );

                valid = false;

            } else if (phone.length > 20) {

                setFieldError(
                    "phone",
                    "Mobile number is too long."
                );

                valid = false;
            }
        }


        /* Password */

        if (!password) {

            setFieldError(
                "password",
                "Please create a password."
            );

            valid = false;

        } else if (!isStrongPassword(password)) {

            setFieldError(
                "password",
                "Password must be at least 12 characters and include uppercase, lowercase, number and symbol."
            );

            valid = false;
        }


        /* Confirm Password */

        if (!confirmPassword) {

            setFieldError(
                "confirmPassword",
                "Please confirm your password."
            );

            valid = false;

        } else if (
            password !== confirmPassword
        ) {

            setFieldError(
                "confirmPassword",
                "Passwords do not match."
            );

            valid = false;
        }


        /* Terms */

        if (!terms) {

            showMessage(
                getElement("registerMessage"),
                "Please agree to the Terms and Privacy Policy.",
                "error"
            );

            valid = false;
        }


        return {
            valid,
            data: {
                fullName,
                email,
                phone,
                password,
                confirmPassword
            }
        };
    }


    /* =========================================================
       LOGIN VALIDATION
       ========================================================= */

    function validateLogin() {

        clearFieldErrors();


        const email =
            normalizeEmail(
                getElement("loginEmail")?.value
            );


        const password =
            getElement("loginPassword")?.value || "";


        let valid = true;


        /* Email */

        if (!email) {

            setFieldError(
                "loginEmail",
                "Please enter your email address."
            );

            valid = false;

        } else if (!isValidEmail(email)) {

            setFieldError(
                "loginEmail",
                "Please enter a valid email address."
            );

            valid = false;
        }


        /* Password */

        if (!password) {

            setFieldError(
                "loginPassword",
                "Please enter your password."
            );

            valid = false;
        }


        return {
            valid,
            data: {
                email,
                password
            }
        };
    }


    /* =========================================================
       REGISTER
       ========================================================= */

    async function handleRegistration(event) {

        event.preventDefault();


        const form =
            getElement("registerForm");


        const messageElement =
            getElement("registerMessage");


        const submitButton =
            form?.querySelector(
                'button[type="submit"]'
            );


        showMessage(
            messageElement,
            "",
            null
        );


        const validation =
            validateRegistration();


        if (!validation.valid) {
            return;
        }


        setButtonLoading(
            submitButton,
            true,
            "Create Account"
        );


        try {

            /*
             * Backend should receive:
             *
             * fullName
             * email
             * phone
             * password
             */

            const result =
                await apiRequest(
                    "/api/auth/register",
                    {
                        method: "POST",
                        body: {
                            fullName:
                                validation.data.fullName,

                            email:
                                validation.data.email,

                            phone:
                                validation.data.phone,

                            password:
                                validation.data.password
                        }
                    }
                );


            /*
             * Registration successful
             */

            showMessage(
                messageElement,
                (
                    result &&
                    result.message
                )
                    ? result.message
                    : "Account created successfully. You can now sign in.",
                "success"
            );


            /*
             * Clear password fields
             */

            const password =
                getElement("password");

            const confirmPassword =
                getElement("confirmPassword");


            if (password) {
                password.value = "";
            }


            if (confirmPassword) {
                confirmPassword.value = "";
            }


            /*
             * If backend sends redirect URL,
             * use it.
             */

            if (
                result &&
                result.redirect
            ) {

                setTimeout(
                    function () {
                        window.location.href =
                            result.redirect;
                    },
                    800
                );

                return;
            }


            /*
             * Otherwise go to login page
             */

            setTimeout(
                function () {
                    window.location.href =
                        "login.html";
                },
                1200
            );


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );


            let message =
                error.message ||
                "Registration failed. Please try again.";


            /*
             * Common backend errors
             */

            if (error.status === 409) {

                message =
                    "An account with this email already exists.";

            } else if (error.status === 400) {

                message =
                    error.message ||
                    "Please check your registration details.";

            } else if (error.status === 500) {

                message =
                    "Server error. Please try again later.";
            }


            showMessage(
                messageElement,
                message,
                "error"
            );


        } finally {

            setButtonLoading(
                submitButton,
                false,
                "Create Account"
            );
        }
    }


    /* =========================================================
       LOGIN
       ========================================================= */

    async function handleLogin(event) {

        event.preventDefault();


        const form =
            getElement("loginForm");


        const messageElement =
            getElement("loginMessage");


        const submitButton =
            form?.querySelector(
                'button[type="submit"]'
            );


        showMessage(
            messageElement,
            "",
            null
        );


        const validation =
            validateLogin();


        if (!validation.valid) {
            return;
        }


        setButtonLoading(
            submitButton,
            true,
            "Sign In"
        );


        try {

            /*
             * Backend receives:
             *
             * email
             * password
             */

            const result =
                await apiRequest(
                    "/api/auth/login",
                    {
                        method: "POST",
                        body: {
                            email:
                                validation.data.email,

                            password:
                                validation.data.password
                        }
                    }
                );


            /*
             * Store only non-sensitive user information.
             *
             * DO NOT store password here.
             */

            if (
                result &&
                result.user
            ) {

                try {

                    sessionStorage.setItem(
                        "skillEarnUser",
                        JSON.stringify(
                            result.user
                        )
                    );

                } catch (storageError) {

                    console.warn(
                        "Unable to save user session:",
                        storageError
                    );
                }
            }


            showMessage(
                messageElement,
                (
                    result &&
                    result.message
                )
                    ? result.message
                    : "Login successful. Redirecting...",
                "success"
            );


            /*
             * Backend can provide redirect.
             */

            if (
                result &&
                result.redirect
            ) {

                setTimeout(
                    function () {
                        window.location.href =
                            result.redirect;
                    },
                    500
                );

                return;
            }


            /*
             * Default dashboard
             */

            setTimeout(
                function () {
                    window.location.href =
                        "dashboard.html";
                },
                700
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            let message =
                error.message ||
                "Login failed. Please check your email and password.";


            if (error.status === 401) {

                message =
                    "Invalid email or password.";

            } else if (error.status === 403) {

                message =
                    error.message ||
                    "Your account is not currently allowed to sign in.";

            } else if (error.status === 404) {

                message =
                    "Login service was not found on the server.";

            } else if (error.status === 500) {

                message =
                    "Server error. Please try again later.";
            }


            showMessage(
                messageElement,
                message,
                "error"
            );


        } finally {

            setButtonLoading(
                submitButton,
                false,
                "Sign In"
            );
        }
    }


    /* =========================================================
       LOGOUT HELPER
       ========================================================= */

    async function logout() {

        try {

            await apiRequest(
                "/api/auth/logout",
                {
                    method: "POST"
                }
            );

        } catch (error) {

            console.warn(
                "Logout request failed:",
                error
            );

        } finally {

            try {
                sessionStorage.removeItem(
                    "skillEarnUser"
                );
            } catch (error) {
                console.warn(
                    "Unable to clear session storage:",
                    error
                );
            }


            window.location.href =
                "login.html";
        }
    }


    /* =========================================================
       GET CURRENT USER
       ========================================================= */

    async function getCurrentUser() {

        try {

            const result =
                await apiRequest(
                    "/api/auth/me",
                    {
                        method: "GET"
                    }
                );


            if (
                result &&
                result.user
            ) {

                try {

                    sessionStorage.setItem(
                        "skillEarnUser",
                        JSON.stringify(
                            result.user
                        )
                    );

                } catch (error) {

                    console.warn(
                        "Unable to save current user:",
                        error
                    );
                }


                return result.user;
            }


            return null;


        } catch (error) {

            console.warn(
                "Unable to get current user:",
                error
            );

            return null;
        }
    }


    /* =========================================================
       AUTO REDIRECT IF ALREADY LOGGED IN
       ========================================================= */

    async function checkExistingSession() {

        /*
         * Only run on login page.
         */

        if (!getElement("loginForm")) {
            return;
        }


        /*
         * Do not aggressively redirect based only
         * on sessionStorage.
         *
         * Ask backend whether session is valid.
         */

        try {

            const user =
                await getCurrentUser();


            if (!user) {
                return;
            }


            /*
             * User is already logged in.
             */

            const messageElement =
                getElement("loginMessage");


            showMessage(
                messageElement,
                "You are already signed in. Redirecting...",
                "info"
            );


            setTimeout(
                function () {
                    window.location.href =
                        "dashboard.html";
                },
                500
            );


        } catch (error) {

            console.warn(
                "Session check failed:",
                error
            );
        }
    }


    /* =========================================================
       FORM EVENT LISTENERS
       ========================================================= */

    function initializeAuth() {

        const registerForm =
            getElement("registerForm");


        const loginForm =
            getElement("loginForm");


        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                handleRegistration
            );
        }


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );
        }


        /*
         * Password confirmation live check
         */

        const confirmPassword =
            getElement("confirmPassword");


        if (confirmPassword) {

            confirmPassword.addEventListener(
                "input",
                function () {

                    const password =
                        getElement("password")?.value || "";


                    if (
                        confirmPassword.value &&
                        password !== confirmPassword.value
                    ) {

                        setFieldError(
                            "confirmPassword",
                            "Passwords do not match."
                        );

                    } else {

                        setFieldError(
                            "confirmPassword",
                            ""
                        );
                    }
                }
            );
        }


        /*
         * Email normalization
         */

        const emailInput =
            getElement("email");


        if (emailInput) {

            emailInput.addEventListener(
                "blur",
                function () {

                    emailInput.value =
                        normalizeEmail(
                            emailInput.value
                        );
                }
            );
        }


        const loginEmail =
            getElement("loginEmail");


        if (loginEmail) {

            loginEmail.addEventListener(
                "blur",
                function () {

                    loginEmail.value =
                        normalizeEmail(
                            loginEmail.value
                        );
                }
            );
        }


        /*
         * Logout buttons anywhere on the website
         */

        document
            .querySelectorAll("[data-action='logout']")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        logout();
                    }
                );
            });


        /*
         * Check existing session on login page
         *
         * Delayed slightly so page loads normally.
         */

        if (loginForm) {

            setTimeout(
                checkExistingSession,
                100
            );
        }
    }


    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.SkillEarnAuth = {

        logout: logout,

        getCurrentUser:
            getCurrentUser,

        isLoggedIn:
            async function () {

                const user =
                    await getCurrentUser();

                return Boolean(user);
            }
    };


    /* =========================================================
       START
       ========================================================= */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeAuth
        );

    } else {

        initializeAuth();
    }

})();
