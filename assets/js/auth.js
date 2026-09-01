"use strict";


/*
|--------------------------------------------------------------------------
| SkillEarn Hub
| Authentication
|--------------------------------------------------------------------------
*/

(function () {


    /*
    |--------------------------------------------------------------------------
    | API CONFIG
    |--------------------------------------------------------------------------
    */

    const API_BASE_URL =

        (
            window.APP_CONFIG &&
            window.APP_CONFIG.API_BASE_URL
        )

            ? window.APP_CONFIG.API_BASE_URL
                .replace(/\/+$/, "")

            : "";


    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    function getElement(id) {

        return document.getElementById(id);
    }


    function getFieldError(fieldId) {

        return document.querySelector(
            `[data-error-for="${fieldId}"]`
        );
    }


    function setFieldError(
        fieldId,
        message
    ) {

        const element =
            getFieldError(fieldId);


        if (element) {

            element.textContent =
                message || "";
        }


        const input =
            getElement(fieldId);


        if (!input) {

            return;
        }


        if (message) {

            input.classList.add(
                "input-error"
            );

            input.setAttribute(
                "aria-invalid",
                "true"
            );

        } else {

            input.classList.remove(
                "input-error"
            );

            input.removeAttribute(
                "aria-invalid"
            );
        }
    }


    function clearFieldErrors() {

        document
            .querySelectorAll(
                ".field-error"
            )
            .forEach(
                element => {
                    element.textContent =
                        "";
                }
            );


        document
            .querySelectorAll(
                ".input-error"
            )
            .forEach(
                element => {

                    element.classList.remove(
                        "input-error"
                    );

                    element.removeAttribute(
                        "aria-invalid"
                    );
                }
            );
    }


    function showMessage(
        element,
        message,
        type
    ) {

        if (!element) {

            return;
        }


        element.textContent =
            message || "";


        element.classList.remove(
            "success",
            "error",
            "info",
            "show"
        );


        if (
            message &&
            type
        ) {

            element.classList.add(
                type,
                "show"
            );
        }
    }


    function setButtonLoading(
        button,
        loading,
        normalText
    ) {

        if (!button) {

            return;
        }


        if (loading) {

            button.disabled =
                true;

            button.dataset.originalText =
                button.textContent.trim();

            button.textContent =
                "Please wait...";

        } else {

            button.disabled =
                false;

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


    function isValidEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email);
    }


    function isStrongPassword(password) {

        return (

            password.length >= 12 &&

            /[a-z]/.test(password) &&

            /[A-Z]/.test(password) &&

            /[0-9]/.test(password) &&

            /[^A-Za-z0-9]/.test(password)

        );
    }


    /*
    |--------------------------------------------------------------------------
    | API REQUEST
    |--------------------------------------------------------------------------
    */

    async function apiRequest(
        endpoint,
        options = {}
    ) {

        const url =
            API_BASE_URL +
            endpoint;


        const requestOptions = {

            method:
                options.method ||
                "GET",

            credentials:
                "include",

            headers: {

                "Accept":
                    "application/json"

            }

        };


        if (options.headers) {

            Object.assign(
                requestOptions.headers,
                options.headers
            );
        }


        if (
            options.body !== undefined
        ) {

            requestOptions.headers[
                "Content-Type"
            ] =
                "application/json";


            requestOptions.body =
                typeof options.body ===
                    "string"

                    ? options.body

                    : JSON.stringify(
                        options.body
                    );
        }


        let response;


        try {

            response =
                await fetch(
                    url,
                    requestOptions
                );

        } catch (error) {

            throw new Error(
                "Unable to connect to the server. Please check your internet connection."
            );
        }


        let data = null;


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            try {

                data =
                    await response.json();

            } catch {

                data = null;
            }

        } else {

            try {

                const text =
                    await response.text();

                data =
                    text
                        ? {
                            message: text
                        }
                        : null;

            } catch {

                data = null;
            }
        }


        if (!response.ok) {

            const message =

                data?.message ||

                data?.error ||

                "The server returned an error.";


            const apiError =
                new Error(message);


            apiError.status =
                response.status;


            apiError.data =
                data;


            throw apiError;
        }


        return data;
    }


    /*
    |--------------------------------------------------------------------------
    | LOGIN VALIDATION
    |--------------------------------------------------------------------------
    */

    function validateLogin() {

        clearFieldErrors();


        const email =
            normalizeEmail(
                getElement(
                    "loginEmail"
                )?.value
            );


        const password =
            getElement(
                "loginPassword"
            )?.value || "";


        let valid = true;


        if (!email) {

            setFieldError(
                "loginEmail",
                "Please enter your email address."
            );

            valid = false;

        } else if (
            !isValidEmail(email)
        ) {

            setFieldError(
                "loginEmail",
                "Please enter a valid email address."
            );

            valid = false;
        }


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


    /*
    |--------------------------------------------------------------------------
    | REGISTER VALIDATION
    |--------------------------------------------------------------------------
    */

    function validateRegistration() {

        clearFieldErrors();


        const fullName =
            getElement(
                "fullName"
            )?.value.trim() || "";


        const email =
            normalizeEmail(
                getElement(
                    "email"
                )?.value
            );


        const phone =
            getElement(
                "phone"
            )?.value.trim() || "";


        const password =
            getElement(
                "password"
            )?.value || "";


        const confirmPassword =
            getElement(
                "confirmPassword"
            )?.value || "";


        const terms =
            getElement(
                "terms"
            )?.checked || false;


        let valid = true;


        if (!fullName) {

            setFieldError(
                "fullName",
                "Please enter your full name."
            );

            valid = false;

        } else if (
            fullName.length < 2
        ) {

            setFieldError(
                "fullName",
                "Name must contain at least 2 characters."
            );

            valid = false;
        }


        if (!email) {

            setFieldError(
                "email",
                "Please enter your email address."
            );

            valid = false;

        } else if (
            !isValidEmail(email)
        ) {

            setFieldError(
                "email",
                "Please enter a valid email address."
            );

            valid = false;
        }


        if (!phone) {

            setFieldError(
                "phone",
                "Please enter your mobile number."
            );

            valid = false;
        }


        if (!password) {

            setFieldError(
                "password",
                "Please create a password."
            );

            valid = false;

        } else if (
            !isStrongPassword(password)
        ) {

            setFieldError(
                "password",

                "Password must be at least 12 characters and include uppercase, lowercase, number and symbol."
            );

            valid = false;
        }


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


        if (!terms) {

            showMessage(
                getElement(
                    "registerMessage"
                ),

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

                password

            }

        };
    }


    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    async function handleLogin(event) {

        event.preventDefault();


        const form =
            getElement(
                "loginForm"
            );


        const message =
            getElement(
                "loginMessage"
            );


        const button =
            form?.querySelector(
                'button[type="submit"]'
            );


        const validation =
            validateLogin();


        if (!validation.valid) {

            return;
        }


        setButtonLoading(
            button,
            true,
            "Sign In"
        );


        showMessage(
            message,
            "",
            null
        );


        try {

            const result =
                await apiRequest(
                    "/api/auth/login",
                    {

                        method:
                            "POST",

                        body: {

                            email:
                                validation.data.email,

                            password:
                                validation.data.password

                        }

                    }
                );


            if (
                !result ||
                !result.success
            ) {

                throw new Error(
                    "Login failed."
                );
            }


            /*
            |--------------------------------------------------------------------------
            | IMPORTANT
            |--------------------------------------------------------------------------
            |
            | Do NOT store session token.
            |
            | Backend has already set the
            | HTTP-only cookie.
            |
            |--------------------------------------------------------------------------
            */


            showMessage(
                message,

                result.message ||
                "Login successful. Redirecting...",

                "success"
            );


            /*
            |--------------------------------------------------------------------------
            | Verify session before redirect
            |--------------------------------------------------------------------------
            */

            const currentUser =
                await apiRequest(
                    "/api/auth/me",
                    {
                        method: "GET"
                    }
                );


            if (
                !currentUser ||
                !currentUser.user
            ) {

                throw new Error(
                    "Login succeeded, but the account session could not be verified."
                );
            }


            /*
            |--------------------------------------------------------------------------
            | Save NON-SENSITIVE user information
            |--------------------------------------------------------------------------
            */

            try {

                sessionStorage.setItem(
                    "skillEarnUser",
                    JSON.stringify(
                        currentUser.user
                    )
                );

            } catch (storageError) {

                console.warn(
                    "Session storage unavailable:",
                    storageError
                );
            }


            /*
            |--------------------------------------------------------------------------
            | Redirect
            |--------------------------------------------------------------------------
            */

            const redirect =
                result.redirect ||
                "user/dashboard.html";


            setTimeout(
                () => {

                    window.location.href =
                        redirect;

                },
                500
            );


        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            let errorMessage =
                error.message ||
                "Login failed. Please try again.";


            if (
                error.status === 401
            ) {

                errorMessage =
                    "Invalid email or password.";
            }


            if (
                error.status === 403
            ) {

                errorMessage =
                    error.message ||
                    "Your account is disabled.";
            }


            if (
                error.status === 423
            ) {

                errorMessage =
                    "Your account is temporarily locked.";
            }


            showMessage(
                message,
                errorMessage,
                "error"
            );


        } finally {

            setButtonLoading(
                button,
                false,
                "Sign In"
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | REGISTER
    |--------------------------------------------------------------------------
    */

    async function handleRegistration(
        event
    ) {

        event.preventDefault();


        const form =
            getElement(
                "registerForm"
            );


        const message =
            getElement(
                "registerMessage"
            );


        const button =
            form?.querySelector(
                'button[type="submit"]'
            );


        const validation =
            validateRegistration();


        if (!validation.valid) {

            return;
        }


        setButtonLoading(
            button,
            true,
            "Create Account"
        );


        try {

            const result =
                await apiRequest(
                    "/api/auth/register",
                    {

                        method:
                            "POST",

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


            showMessage(

                message,

                result?.message ||
                "Account created successfully.",

                "success"

            );


            const password =
                getElement(
                    "password"
                );


            const confirmPassword =
                getElement(
                    "confirmPassword"
                );


            if (password) {

                password.value =
                    "";
            }


            if (confirmPassword) {

                confirmPassword.value =
                    "";
            }


            setTimeout(
                () => {

                    window.location.href =
                        "login.html";

                },
                1000
            );


        } catch (error) {

            console.error(
                "REGISTER ERROR:",
                error
            );


            showMessage(

                message,

                error.message ||
                "Registration failed.",

                "error"

            );


        } finally {

            setButtonLoading(
                button,
                false,
                "Create Account"
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */

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

            } catch {}

            window.location.href =
                "../login.html";
        }
    }


    /*
    |--------------------------------------------------------------------------
    | CURRENT USER
    |--------------------------------------------------------------------------
    */

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

                } catch {}

                return result.user;
            }


            return null;


        } catch (error) {

            return null;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | CHECK EXISTING LOGIN
    |--------------------------------------------------------------------------
    */

    async function checkExistingSession() {

        const loginForm =
            getElement(
                "loginForm"
            );


        if (!loginForm) {

            return;
        }


        const user =
            await getCurrentUser();


        if (!user) {

            return;
        }


        const message =
            getElement(
                "loginMessage"
            );


        showMessage(

            message,

            "You are already signed in. Redirecting...",

            "info"

        );


        setTimeout(
            () => {

                window.location.href =
                    "user/dashboard.html";

            },
            500
        );
    }


    /*
    |--------------------------------------------------------------------------
    | INITIALIZE
    |--------------------------------------------------------------------------
    */

    function initializeAuth() {

        const loginForm =
            getElement(
                "loginForm"
            );


        const registerForm =
            getElement(
                "registerForm"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );
        }


        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                handleRegistration
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Confirm password
        |--------------------------------------------------------------------------
        */

        const confirmPassword =
            getElement(
                "confirmPassword"
            );


        if (confirmPassword) {

            confirmPassword.addEventListener(
                "input",
                () => {

                    const password =
                        getElement(
                            "password"
                        )?.value || "";


                    if (
                        confirmPassword.value &&
                        password !==
                            confirmPassword.value
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
        |--------------------------------------------------------------------------
        | Normalize email
        |--------------------------------------------------------------------------
        */

        const loginEmail =
            getElement(
                "loginEmail"
            );


        if (loginEmail) {

            loginEmail.addEventListener(
                "blur",
                () => {

                    loginEmail.value =
                        normalizeEmail(
                            loginEmail.value
                        );

                }
            );
        }


        const email =
            getElement(
                "email"
            );


        if (email) {

            email.addEventListener(
                "blur",
                () => {

                    email.value =
                        normalizeEmail(
                            email.value
                        );

                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Logout buttons
        |--------------------------------------------------------------------------
        */

        document
            .querySelectorAll(
                "[data-action='logout']"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            logout();

                        }
                    );
                }
            );


        /*
        |--------------------------------------------------------------------------
        | Check existing session
        |--------------------------------------------------------------------------
        */

        if (loginForm) {

            setTimeout(
                checkExistingSession,
                100
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | PUBLIC API
    |--------------------------------------------------------------------------
    */

    window.SkillEarnAuth = {

        logout,

        getCurrentUser,

        isLoggedIn:
            async function () {

                return Boolean(
                    await getCurrentUser()
                );

            }

    };


    /*
    |--------------------------------------------------------------------------
    | START
    |--------------------------------------------------------------------------
    */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeAuth
        );

    } else {

        initializeAuth();
    }


})();
