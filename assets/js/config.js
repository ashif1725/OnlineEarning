"use strict";

/*
 * SkillEarn Hub - Frontend Configuration
 *
 * IMPORTANT:
 * यह file केवल public frontend configuration के लिए है।
 *
 * यहां कभी भी ये चीजें न रखें:
 * - Database password
 * - JWT secret
 * - Session secret
 * - Payment API secret
 * - UPI private credentials
 * - SMTP password
 * - Admin password
 * - KYC/private storage credentials
 */

window.SKILLEARN_CONFIG = Object.freeze({

    appName: "SkillEarn Hub",

    /*
     * IMPORTANT:
     * यहां अपने deployed BACKEND का HTTPS URL डालना है।
     *
     * Example:
     * https://api.example.com
     *
     * GitHub Pages का URL यहां नहीं डालना है।
     */

    apiBaseUrl:
        "https://YOUR-BACKEND-DOMAIN.com",

    environment:
        "production"

});
