/**
 * API Client for Backend Communication
 */

const API_BASE_URL = window.location.origin;

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Set auth token
function setAuthToken(token) {
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Set current user
function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Unauthorized - clear auth and redirect to login
            setAuthToken(null);
            setCurrentUser(null);
            window.location.hash = '#/login';
            throw new Error('Unauthorized');
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Auth API
export const authAPI = {
    async register(email, password, name) {
        const data = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name })
        });
        setAuthToken(data.token);
        setCurrentUser(data.user);
        return data;
    },

    async login(email, password) {
        const data = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        setAuthToken(data.token);
        setCurrentUser(data.user);
        return data;
    },

    logout() {
        setAuthToken(null);
        setCurrentUser(null);
    },

    isAuthenticated() {
        return !!getAuthToken();
    }
};

// Data API
export const dataAPI = {
    // Transactions
    async getTransactions() {
        return await apiRequest('/api/transactions');
    },

    async addTransaction(transaction) {
        return await apiRequest('/api/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction)
        });
    },

    async deleteTransaction(id) {
        return await apiRequest(`/api/transactions/${id}`, {
            method: 'DELETE'
        });
    },

    // Budgets
    async getBudgets() {
        return await apiRequest('/api/budgets');
    },

    async addBudget(budget) {
        return await apiRequest('/api/budgets', {
            method: 'POST',
            body: JSON.stringify(budget)
        });
    },

    async updateBudget(id, updates) {
        return await apiRequest(`/api/budgets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },

    async deleteBudget(id) {
        return await apiRequest(`/api/budgets/${id}`, {
            method: 'DELETE'
        });
    },

    // Pots
    async getPots() {
        return await apiRequest('/api/pots');
    },

    async addPot(pot) {
        return await apiRequest('/api/pots', {
            method: 'POST',
            body: JSON.stringify(pot)
        });
    },

    async updatePot(id, updates) {
        return await apiRequest(`/api/pots/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },

    async deletePot(id) {
        return await apiRequest(`/api/pots/${id}`, {
            method: 'DELETE'
        });
    },

    // Recurring Bills
    async getRecurringBills() {
        return await apiRequest('/api/recurring-bills');
    },

    async addRecurringBill(bill) {
        return await apiRequest('/api/recurring-bills', {
            method: 'POST',
            body: JSON.stringify(bill)
        });
    },

    async updateRecurringBill(id, updates) {
        return await apiRequest(`/api/recurring-bills/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },

    async deleteRecurringBill(id) {
        return await apiRequest(`/api/recurring-bills/${id}`, {
            method: 'DELETE'
        });
    },

    // Categories
    async getCategories() {
        return await apiRequest('/api/categories');
    },

    async addCategory(category) {
        return await apiRequest('/api/categories', {
            method: 'POST',
            body: JSON.stringify(category)
        });
    },

    async updateCategory(id, updates) {
        return await apiRequest(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },

    async deleteCategory(id) {
        return await apiRequest(`/api/categories/${id}`, {
            method: 'DELETE'
        });
    }
};
