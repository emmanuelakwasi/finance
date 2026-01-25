/**
 * Authentication Module
 * Handles login, register, and authentication state
 */

import { authAPI, dataAPI } from './api.js';

let isAuthenticated = false;

/**
 * Initialize authentication
 */
function initAuth() {
    // Check if user is authenticated
    isAuthenticated = authAPI.isAuthenticated();
    
    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        if (window.location.hash !== '#/login' && window.location.hash !== '#/register') {
            window.location.hash = '#/login';
        }
    } else {
        // Redirect to overview if authenticated and on login/register
        if (window.location.hash === '#/login' || window.location.hash === '#/register' || !window.location.hash) {
            window.location.hash = '#/overview';
        }
    }
    
    renderAuthPages();
    setupAuthForms();
}

/**
 * Render auth pages
 */
function renderAuthPages() {
    const loginPage = document.getElementById('page-login');
    const registerPage = document.getElementById('page-register');
    const mainPages = document.querySelectorAll('.page:not(#page-login):not(#page-register)');
    
    if (!isAuthenticated) {
        // Show auth pages, hide main pages
        if (loginPage) loginPage.classList.remove('hidden');
        if (registerPage) registerPage.classList.remove('hidden');
        mainPages.forEach(page => page.classList.add('hidden'));
    } else {
        // Hide auth pages, show main pages
        if (loginPage) loginPage.classList.add('hidden');
        if (registerPage) registerPage.classList.add('hidden');
    }
}

/**
 * Setup authentication forms
 */
function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const registerLink = document.getElementById('registerLink');
    const loginLink = document.getElementById('loginLink');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const errorDiv = document.getElementById('loginError');
            
            try {
                errorDiv.style.display = 'none';
                await authAPI.login(email, password);
                isAuthenticated = true;
                window.location.hash = '#/overview';
                renderAuthPages();
                // Reload data
                if (typeof renderCurrentPage === 'function') {
                    renderCurrentPage();
                }
            } catch (error) {
                errorDiv.textContent = error.message || 'Login failed';
                errorDiv.style.display = 'block';
                errorDiv.classList.add('error-shake');
                setTimeout(() => errorDiv.classList.remove('error-shake'), 500);
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const errorDiv = document.getElementById('registerError');
            
            try {
                errorDiv.style.display = 'none';
                await authAPI.register(email, password, name);
                isAuthenticated = true;
                window.location.hash = '#/overview';
                renderAuthPages();
                // Reload data
                if (typeof renderCurrentPage === 'function') {
                    renderCurrentPage();
                }
            } catch (error) {
                errorDiv.textContent = error.message || 'Registration failed';
                errorDiv.style.display = 'block';
                errorDiv.classList.add('error-shake');
                setTimeout(() => errorDiv.classList.remove('error-shake'), 500);
            }
        });
    }
    
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('page-login').classList.add('hidden');
            document.getElementById('page-register').classList.remove('hidden');
        });
    }
    
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('page-register').classList.add('hidden');
            document.getElementById('page-login').classList.remove('hidden');
        });
    }
}

/**
 * Logout
 */
function logout() {
    authAPI.logout();
    isAuthenticated = false;
    window.location.hash = '#/login';
    renderAuthPages();
}

/**
 * Check if authenticated
 */
function checkAuth() {
    return authAPI.isAuthenticated();
}

// Export functions
window.auth = {
    init: initAuth,
    logout: logout,
    isAuthenticated: checkAuth,
    renderAuthPages: renderAuthPages
};
