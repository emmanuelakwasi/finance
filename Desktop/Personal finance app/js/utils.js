function formatCurrency(amount, currency = '$') {
    return `${currency}${Math.abs(amount).toFixed(2)}`;
}

function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
    };
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-GB', defaultOptions).format(dateObj);
}

function formatDateShort(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateObj.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return formatDate(dateObj, { month: 'short', day: 'numeric' });
    }
}

function calculateTotal(items) {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
}

function filterTransactionsByType(transactions, type) {
    if (type === 'all') return transactions;
    return transactions.filter(t => t.type === type);
}

function searchTransactions(transactions, query) {
    if (!query) return transactions;
    const lowerQuery = query.toLowerCase();
    return transactions.filter(t => 
        (t.name && t.name.toLowerCase().includes(lowerQuery)) ||
        (t.category && t.category.toLowerCase().includes(lowerQuery))
    );
}

function getCurrentMonthTransactions(transactions) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
}

function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

function getProgressColor(percentage) {
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return '';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function groupByCategory(transactions) {
    return transactions.reduce((acc, transaction) => {
        const category = transaction.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(transaction);
        return acc;
    }, {});
}

function sortTransactionsByDate(transactions) {
    return [...transactions].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
}
