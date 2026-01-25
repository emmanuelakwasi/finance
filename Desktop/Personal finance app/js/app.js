document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.auth !== 'undefined' && window.auth.init) {
        window.auth.init();
    }
    
    const isAuth = typeof window.auth !== 'undefined' && window.auth.isAuthenticated ? window.auth.isAuthenticated() : true;
    
    if (!isAuth) {
        return;
    }
    
    if (typeof initKeyboardNavigation === 'function') {
        initKeyboardNavigation();
    }
    
    setupMobileSidebar();
    setupEventDelegation();
    registerRoutes();
    setupEventListeners();
    setupForms();
    setupSettings();
    renderCurrentPage();
    applyTheme(store.getSettings().theme || 'light');
});

function setupEventDelegation() {
    document.addEventListener('click', (e) => {
        const isFormInput = ['INPUT', 'SELECT', 'TEXTAREA', 'LABEL'].includes(e.target.tagName);
        if (isFormInput && !e.target.hasAttribute('data-action')) {
            return;
        }
        
        const clickedModal = e.target.closest('.modal');
        if (clickedModal && e.target === clickedModal) {
            closeModal();
            return;
        }
        
        let actionElement = e.target.hasAttribute('data-action') ? e.target : e.target.closest('[data-action]');
        
        if (!actionElement) {
            return;
        }
        
        const action = actionElement.getAttribute('data-action');
        if (!action) return;
        
        if (actionElement.tagName === 'A' && action.startsWith('nav-')) {
            handleAction(action, actionElement, e);
            return;
        }
        
        if (isFormInput) {
            handleAction(action, actionElement, e);
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        handleAction(action, actionElement, e);
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                closeModal();
            }
        }
    });
}

function handleAction(action, element, event) {
    switch(action) {
        case 'nav-overview':
            router.navigate('overview');
            break;
        case 'nav-transactions':
            router.navigate('transactions');
            break;
        case 'nav-budgets':
            router.navigate('budgets');
            break;
        case 'nav-pots':
            router.navigate('pots');
            break;
        case 'nav-recurring':
            router.navigate('recurring');
            break;
        case 'nav-settings':
            router.navigate('settings');
            break;
        case 'open-add-budget':
            openBudgetModal();
            break;
        case 'open-add-transaction':
            openTransactionModal();
            break;
        case 'open-add-pot':
            openCreatePotModal();
            break;
        case 'open-add-recurring':
            openAddRecurringBillModal();
            break;
        case 'close-modal':
            closeModal();
            break;
        case 'delete-transaction':
            const transactionId = element.getAttribute('data-id');
            if (transactionId && confirm('Are you sure you want to delete this transaction?')) {
                store.deleteTransaction(transactionId);
                renderCurrentPage();
            }
            break;
        case 'delete-budget':
            const budgetId = element.getAttribute('data-id');
            if (budgetId && confirm('Are you sure you want to delete this budget?')) {
                if (store.deleteBudget) {
                    store.deleteBudget(budgetId);
                }
                renderCurrentPage();
            }
            break;
        case 'delete-recurring':
            const recurringId = element.getAttribute('data-id');
            if (recurringId && confirm('Are you sure you want to delete this bill?')) {
                store.deleteRecurringBill(recurringId);
                renderCurrentPage();
            }
            break;
        case 'toggle-bill-paid':
            const billId = element.getAttribute('data-id');
            if (billId) {
                store.toggleBillPaid(billId);
                renderCurrentPage();
            }
            break;
            
        default:
            console.warn('Unknown action:', action);
    }
}

function setupForms() {
    document.addEventListener('submit', (e) => {
        const form = e.target;
        if (form.tagName !== 'FORM') return;
        
        e.preventDefault();
        
        const action = form.getAttribute('data-action');
        if (!action) return;
        
        handleFormSubmit(action, form);
    });
}

function handleFormSubmit(action, form) {
    switch(action) {
        case 'submit-add-budget':
            handleBudgetFormSubmit(form);
            break;
        case 'submit-add-transaction':
            handleTransactionFormSubmit(form);
            break;
        case 'submit-add-pot':
            handlePotFormSubmit(form);
            break;
        case 'submit-add-recurring':
            handleRecurringFormSubmit(form);
            break;
        case 'submit-pot-money':
            handlePotMoneyFormSubmit(form);
            break;
        default:
            console.warn('Unknown form action:', action);
    }
}

function handleBudgetFormSubmit(form) {
    const editId = document.getElementById('budgetEditId').value;
    const category = document.getElementById('budgetCategory').value.trim();
    const limit = parseFloat(document.getElementById('budgetLimit').value);
    const color = document.getElementById('budgetColor').value;
    
    if (!category || !limit || limit <= 0) {
        alert('Please fill in all required fields with valid values');
        return;
    }
    
    if (editId) {
        store.updateBudget(editId, { category, limit, color });
    } else {
        const budget = {
            id: Date.now().toString(),
            category,
            limit,
            spent: 0,
            color
        };
        store.addBudget(budget);
    }
    
    closeModal();
    renderCurrentPage();
}

function handleTransactionFormSubmit(form) {
    const name = document.getElementById('transactionName').value.trim();
    const amountType = document.getElementById('transactionAmountType').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const date = document.getElementById('transactionDate').value;
    const category = document.getElementById('transactionCategory').value.trim();
    const notes = document.getElementById('transactionNotes').value.trim();
    
    if (!name || !amount || amount <= 0 || !date || !category) {
        alert('Please fill in all required fields with valid values');
        return;
    }
    
    const finalAmount = amountType === '+' ? amount : -amount;
    
    const transaction = {
        id: Date.now().toString(),
        name,
        amount: finalAmount,
        date,
        category,
        notes: notes || ''
    };
    
    store.addTransaction(transaction);
    closeModal();
    renderCurrentPage();
}

function handlePotFormSubmit(form) {
    const name = document.getElementById('potName').value.trim();
    const target = parseFloat(document.getElementById('potTarget').value);
    const initialSaved = parseFloat(document.getElementById('potInitialSaved').value) || 0;
    
    if (!name || !target || target <= 0) {
        alert('Please fill in all required fields with valid values');
        return;
    }
    
    const pot = {
        id: Date.now().toString(),
        name,
        target,
        saved: initialSaved
    };
    
    store.addPot(pot);
    closeModal();
    renderCurrentPage();
}

function handleRecurringFormSubmit(form) {
    const name = document.getElementById('recurringBillName').value.trim();
    const amount = parseFloat(document.getElementById('recurringBillAmount').value);
    const dueDate = document.getElementById('recurringBillDueDate').value;
    
    if (!name || !amount || amount <= 0 || !dueDate) {
        alert('Please fill in all required fields with valid values');
        return;
    }
    
    const bill = {
        id: Date.now().toString(),
        name,
        amount,
        dueDate,
        status: 'pending'
    };
    
    store.addRecurringBill(bill);
    closeModal();
    renderCurrentPage();
}

function handlePotMoneyFormSubmit(form) {
    const potId = document.getElementById('potMoneyId').value;
    const action = document.getElementById('potMoneyAction').value; // 'add' or 'withdraw'
    const amount = parseFloat(document.getElementById('potMoneyAmount').value);
    
    if (!potId || !action || !amount || amount <= 0) {
        alert('Please fill in all required fields with valid values');
        return;
    }
    
    const pot = store.getPots().find(p => p.id === potId);
    if (!pot) {
        alert('Pot not found');
        return;
    }
    
    let newSaved = pot.saved;
    if (action === 'add') {
        newSaved += amount;
    } else if (action === 'withdraw') {
        newSaved = Math.max(0, newSaved - amount);
    }
    
    store.updatePotSaved(potId, newSaved);
    closeModal();
    renderCurrentPage();
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal() {
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
        activeModal.classList.remove('active');
        const form = activeModal.querySelector('form');
        if (form) {
            form.reset();
            const editId = form.querySelector('[id$="EditId"]');
            if (editId) editId.value = '';
        }
    }
}

function openBudgetModal(budget = null) {
    const modal = document.getElementById('budgetModal');
    if (!modal) return;
    
    const form = document.getElementById('budgetForm');
    const title = document.getElementById('budgetModalTitle');
    const editId = document.getElementById('budgetEditId');
    const categoryInput = document.getElementById('budgetCategory');
    const limitInput = document.getElementById('budgetLimit');
    const colorInput = document.getElementById('budgetColor');
    const colorTextInput = document.getElementById('budgetColorText');
    
    if (budget) {
        title.textContent = 'Edit Budget';
        editId.value = budget.id;
        categoryInput.value = budget.category;
        limitInput.value = budget.limit;
        colorInput.value = budget.color;
        colorTextInput.value = budget.color;
    } else {
        title.textContent = 'Add Budget';
        editId.value = '';
        categoryInput.value = '';
        limitInput.value = '';
        colorInput.value = '#6366f1';
        colorTextInput.value = '#6366f1';
    }
    
    openModal('budgetModal');
}

function openTransactionModal() {
    const form = document.getElementById('transactionForm');
    if (form) {
        form.reset();
        const dateInput = document.getElementById('transactionDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }
    openModal('addTransactionModal');
}

function openCreatePotModal() {
    const form = document.getElementById('createPotForm');
    if (form) {
        form.reset();
    }
    openModal('createPotModal');
}

function openAddRecurringBillModal() {
    const form = document.getElementById('recurringBillForm');
    if (form) {
        form.reset();
    }
    openModal('addRecurringBillModal');
}

function setupMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('overlay');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            }
        });
    });
}

function checkAuth() {
    if (typeof window.auth !== 'undefined' && window.auth.isAuthenticated) {
        const isAuth = window.auth.isAuthenticated();
        if (!isAuth) {
            window.location.hash = '#/login';
            return false;
        }
        return true;
    }
    return true;
}

function setupEventListeners() {
    store.subscribe(() => {
        renderCurrentPage();
    });
}

function renderCurrentPage() {
    const route = router.getCurrentRoute();
    switch (route) {
        case 'overview':
            renderOverview();
            break;
        case 'transactions':
            renderTransactions();
            break;
        case 'budgets':
            renderBudgets();
            break;
        case 'pots':
            renderPots();
            break;
        case 'recurring':
            renderRecurring();
            break;
    }
}

function registerRoutes() {
    router.register('login', () => {
        if (typeof window.auth !== 'undefined' && window.auth.renderAuthPages) {
            window.auth.renderAuthPages();
        }
    });
    router.register('register', () => {
        if (typeof window.auth !== 'undefined' && window.auth.renderAuthPages) {
            window.auth.renderAuthPages();
        }
    });
    
    router.register('overview', () => {
        if (checkAuth()) renderOverview();
    });
    router.register('transactions', () => {
        if (checkAuth()) renderTransactions();
    });
    router.register('budgets', () => {
        if (checkAuth()) renderBudgets();
    });
    router.register('pots', () => {
        if (checkAuth()) renderPots();
    });
    router.register('recurring', () => {
        if (checkAuth()) renderRecurring();
    });
    router.register('settings', () => {
        if (checkAuth()) renderSettings();
    });
}

function renderOverview() {
    const overviewPage = document.getElementById('page-overview');
    if (!overviewPage) {
        return;
    }
    
    const transactions = store.getTransactions();
    const budgets = store.getBudgets();
    const pots = store.getPots();
    const recurringBills = store.getRecurringBills();
    
    const currentMonthTransactions = getCurrentMonthTransactions(transactions);
    
    const income = currentMonthTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = currentMonthTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalBalance = income - expenses;
    
    renderOverviewSummaryCards(totalBalance, income, expenses);
    renderOverviewPots(pots);
    renderOverviewBudgets(budgets, currentMonthTransactions);
    renderOverviewTransactions(transactions);
    renderOverviewRecurring(recurringBills);
}

function renderOverviewSummaryCards(balance, income, expenses) {
    const container = document.getElementById('overviewSummaryCards');
    if (!container) {
        return;
    }
    
    container.innerHTML = '';
    
    const balanceCard = createStatCard('Current Balance', formatCurrency(balance), '', { className: 'summary-card' });
    const incomeCard = createStatCard('Income', formatCurrency(income), '', { className: 'summary-card' });
    const expenseCard = createStatCard('Expenses', formatCurrency(expenses), '', { className: 'summary-card' });
    
    container.appendChild(balanceCard);
    container.appendChild(incomeCard);
    container.appendChild(expenseCard);
}

function renderOverviewPots(pots) {
    const container = document.getElementById('overviewPotsCard');
    if (!container) {
        console.warn('overviewPotsCard container not found');
        return;
    }
    
    container.innerHTML = '';
    
    if (pots.length === 0) {
        const emptyCard = createCard('Pots', '<div class="empty-state"><div class="empty-state-text">No pots yet</div></div>');
        container.appendChild(emptyCard);
        return;
    }
    
    const totalSaved = pots.reduce((sum, pot) => sum + pot.saved, 0);
    const potsList = pots.slice(0, 3).map(pot => 
        `<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-light);">
            <span>${pot.name}</span>
            <strong>${formatCurrency(pot.saved)}</strong>
        </div>`
    ).join('');
    
    const content = `
        <div style="margin-bottom: 1rem;">
            <div style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">${formatCurrency(totalSaved)}</div>
            <div style="color: var(--muted); font-size: 0.875rem;">Total Saved</div>
        </div>
        ${potsList}
        <div style="margin-top: 1rem;">
            <a href="#/pots" data-action="nav-pots" style="color: var(--primary); text-decoration: none;">View All Pots →</a>
        </div>
    `;
    
    const card = createCard('Pots', content);
    container.appendChild(card);
}

function renderOverviewBudgets(budgets, transactions) {
    const container = document.getElementById('overviewBudgetsCard');
    if (!container) {
        console.warn('overviewBudgetsCard container not found');
        return;
    }
    
    container.innerHTML = '';
    
    if (budgets.length === 0) {
        const emptyCard = createCard('Budgets', '<div class="empty-state"><div class="empty-state-text">No budgets yet</div></div>');
        container.appendChild(emptyCard);
        return;
    }
    
    const budgetData = budgets.map(budget => {
        const budgetTransactions = transactions.filter(t => t.category === budget.category && t.amount < 0);
        const spent = budgetTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        return { ...budget, spent };
    });
    
    const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);
    const totalLimit = budgetData.reduce((sum, b) => sum + b.limit, 0);
    
    const content = `
        <div style="text-align: center; margin-bottom: 1rem;">
            <div style="font-size: 1.5rem; font-weight: 600;">${formatCurrency(totalSpent)} / ${formatCurrency(totalLimit)}</div>
            <div style="color: var(--muted); font-size: 0.875rem;">Total Budget</div>
        </div>
        <div style="margin-top: 1rem;">
            <a href="#/budgets" data-action="nav-budgets" style="color: var(--primary); text-decoration: none;">View All Budgets →</a>
        </div>
    `;
    
    const card = createCard('Budgets', content);
    container.appendChild(card);
}

function renderOverviewTransactions(transactions) {
    const container = document.getElementById('overviewTransactionsCard');
    if (!container) {
        console.warn('overviewTransactionsCard container not found');
        return;
    }
    
    container.innerHTML = '';
    
    if (transactions.length === 0) {
        const emptyCard = createCard('Recent Transactions', '<div class="empty-state"><div class="empty-state-text">No transactions yet</div></div>');
        container.appendChild(emptyCard);
        return;
    }
    
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sortedTransactions.slice(0, 5).map(t => `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border-light);">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                ${t.name.charAt(0).toUpperCase()}
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 500;">${t.name}</div>
                <div style="font-size: 0.875rem; color: var(--muted);">${formatDate(t.date)}</div>
            </div>
            <div style="font-weight: 600; color: ${t.amount > 0 ? 'var(--success)' : 'var(--text)'};">
                ${formatCurrency(t.amount)}
            </div>
        </div>
    `).join('');
    
    const content = recent + `
        <div style="margin-top: 1rem;">
            <a href="#/transactions" data-action="nav-transactions" style="color: var(--primary); text-decoration: none;">View All Transactions →</a>
        </div>
    `;
    
    const card = createCard('Recent Transactions', content);
    container.appendChild(card);
}

function renderOverviewRecurring(recurringBills) {
    const container = document.getElementById('overviewRecurringCard');
    if (!container) {
        console.warn('overviewRecurringCard container not found');
        return;
    }
    
    container.innerHTML = '';
    
    const paid = recurringBills.filter(b => b.status === 'paid').length;
    const upcoming = recurringBills.filter(b => b.status !== 'paid').length;
    
    const content = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div>
                <div style="font-size: 1.5rem; font-weight: 600;">${paid}</div>
                <div style="color: var(--muted); font-size: 0.875rem;">Paid</div>
            </div>
            <div>
                <div style="font-size: 1.5rem; font-weight: 600;">${upcoming}</div>
                <div style="color: var(--muted); font-size: 0.875rem;">Upcoming</div>
            </div>
        </div>
        <div>
            <a href="#/recurring" data-action="nav-recurring" style="color: var(--primary); text-decoration: none;">View All Bills →</a>
        </div>
    `;
    
    const card = createCard('Recurring Bills', content);
    container.appendChild(card);
}

function renderTransactions() {
    setupTransactionControls();
    
    const allTransactions = store.getTransactions();
    applyTransactionFilters(allTransactions);
    renderTransactionsTable();
    renderTransactionsPagination();
}

let currentTransactionPage = 1;
let filteredTransactions = [];

function setupTransactionControls() {
    const searchInput = document.getElementById('transactionSearch');
    const sortSelect = document.getElementById('transactionSort');
    const categoryFilter = document.getElementById('transactionCategoryFilter');
    
    if (categoryFilter) {
        const transactions = store.getTransactions();
        const categories = [...new Set(transactions.map(t => t.category))].sort();
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentTransactionPage = 1;
            renderTransactions();
        }, 300));
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentTransactionPage = 1;
            renderTransactions();
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentTransactionPage = 1;
            renderTransactions();
        });
    }
}

function applyTransactionFilters(transactions) {
    let filtered = [...transactions];
    
    const searchInput = document.getElementById('transactionSearch');
    const sortSelect = document.getElementById('transactionSort');
    const categoryFilter = document.getElementById('transactionCategoryFilter');
    
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filtered = filtered.filter(t => 
            t.name.toLowerCase().includes(searchTerm) || 
            t.category.toLowerCase().includes(searchTerm)
        );
    }
    
    if (categoryFilter && categoryFilter.value !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter.value);
    }
    
    if (sortSelect) {
        const sortValue = sortSelect.value;
        switch(sortValue) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'highest':
                filtered.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
                break;
            case 'lowest':
                filtered.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
                break;
        }
    }
    
    filteredTransactions = filtered;
}

function renderTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;
    
    const pageSize = 10;
    const startIndex = (currentTransactionPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    if (pageTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No transactions found</td></tr>';
        return;
    }
    
    pageTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'transaction-row';
        
        const nameCell = document.createElement('td');
        nameCell.innerHTML = `<strong>${transaction.name}</strong>`;
        
        const categoryCell = document.createElement('td');
        const categoryBadge = document.createElement('span');
        categoryBadge.className = 'category-badge';
        categoryBadge.textContent = transaction.category;
        categoryCell.appendChild(categoryBadge);
        
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(transaction.date);
        
        const amountCell = document.createElement('td');
        amountCell.className = `transaction-amount ${transaction.amount > 0 ? 'income' : 'expense'}`;
        amountCell.textContent = formatCurrency(transaction.amount);
        
        const actionsCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-secondary';
        deleteBtn.textContent = 'Delete';
        deleteBtn.setAttribute('data-action', 'delete-transaction');
        deleteBtn.setAttribute('data-id', transaction.id);
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(nameCell);
        row.appendChild(categoryCell);
        row.appendChild(dateCell);
        row.appendChild(amountCell);
        row.appendChild(actionsCell);
        
        tbody.appendChild(row);
    });
}

function renderTransactionsPagination() {
    const container = document.getElementById('transactionsPagination');
    if (!container) return;
    
    const pageSize = 10;
    const totalPages = Math.ceil(filteredTransactions.length / pageSize);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = '';
    
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentTransactionPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentTransactionPage > 1) {
            currentTransactionPage--;
            renderTransactionsTable();
            renderTransactionsPagination();
        }
    });
    container.appendChild(prevBtn);
    
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.classList.toggle('active', i === currentTransactionPage);
        pageBtn.addEventListener('click', () => {
            currentTransactionPage = i;
            renderTransactionsTable();
            renderTransactionsPagination();
        });
        container.appendChild(pageBtn);
    }
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentTransactionPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentTransactionPage < totalPages) {
            currentTransactionPage++;
            renderTransactionsTable();
            renderTransactionsPagination();
        }
    });
    container.appendChild(nextBtn);
}

function renderBudgets() {
    const budgets = store.getBudgets();
    const transactions = store.getTransactions();
    const currentMonthTransactions = getCurrentMonthTransactions(transactions);
    
    const budgetData = budgets.map(budget => {
        const budgetTransactions = currentMonthTransactions.filter(
            t => t.category === budget.category && t.amount < 0
        );
        const spent = budgetTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        if (budget.spent !== spent) {
            store.updateBudgetSpent(budget.id, spent);
        }
        return { ...budget, spent };
    });
    
    renderBudgetsDonutChart(budgetData);
    renderBudgetsList(budgetData);
}

function renderBudgetsDonutChart(budgetData) {
    const container = document.getElementById('budgetsDonutChart');
    if (!container) return;
    
    if (budgetData.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-text">No budgets yet</div></div>';
        return;
    }
    
    const spentValues = budgetData.map(b => b.spent);
    const labels = budgetData.map(b => b.category);
    const colors = budgetData.map(b => b.color);
    
    if (!window.budgetsSVGDonutChart) {
        window.budgetsSVGDonutChart = new SVGDonutChart('budgetsDonutChart', { innerRadius: 0.6 });
    }
    
    window.budgetsSVGDonutChart.setData(spentValues, labels, colors);
}

function renderBudgetsList(budgetData) {
    const container = document.getElementById('budgetsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (budgetData.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-text">No budgets yet</div></div>';
        return;
    }
    
    budgetData.forEach(budget => {
        const percentage = calculatePercentage(budget.spent, budget.limit);
        const progressColor = getProgressColor(percentage);
        
        const budgetRow = document.createElement('div');
        budgetRow.className = 'budget-row';
        
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'budget-category-header';
        
        const dot = document.createElement('div');
        dot.className = 'budget-category-dot';
        dot.style.backgroundColor = budget.color;
        
        const categoryName = document.createElement('div');
        categoryName.className = 'budget-category-name';
        categoryName.textContent = budget.category;
        
        categoryHeader.appendChild(dot);
        categoryHeader.appendChild(categoryName);
        
        const amountsRow = document.createElement('div');
        amountsRow.className = 'budget-amounts';
        amountsRow.innerHTML = `Limit: <strong>${formatCurrency(budget.limit)}</strong> | Spent: <strong>${formatCurrency(budget.spent)}</strong>`;
        
        const progressContainer = document.createElement('div');
        progressContainer.className = 'budget-progress-container';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'budget-progress-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'budget-progress-fill';
        progressFill.style.cssText = `width: ${Math.min(percentage, 100)}%; background-color: ${budget.color};`;
        
        progressBar.appendChild(progressFill);
        
        const progressText = document.createElement('div');
        progressText.className = 'budget-progress-text';
        progressText.innerHTML = `<span>${percentage.toFixed(0)}% used</span><span>${formatCurrency(budget.limit - budget.spent)} remaining</span>`;
        
        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(progressText);
        
        const actionsRow = document.createElement('div');
        actionsRow.className = 'budget-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-icon';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => openBudgetModal(budget));
        
        actionsRow.appendChild(editBtn);
        
        budgetRow.appendChild(categoryHeader);
        budgetRow.appendChild(amountsRow);
        budgetRow.appendChild(progressContainer);
        budgetRow.appendChild(actionsRow);
        
        container.appendChild(budgetRow);
    });
}

function renderPots() {
    const pots = store.getPots();
    const grid = document.getElementById('potsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (pots.length === 0) {
        grid.innerHTML = '<div class="card empty-state"><div class="empty-state-text">No pots yet</div></div>';
        return;
    }
    
    pots.forEach(pot => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const percentage = calculatePercentage(pot.saved, pot.target);
        
        card.innerHTML = `
            <div class="card-header">
                <h3>${pot.name}</h3>
            </div>
            <div class="card-content">
                <div style="margin-bottom: 1rem;">
                    <div style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.25rem;">${formatCurrency(pot.saved)} / ${formatCurrency(pot.target)}</div>
                    <div style="color: var(--muted); font-size: 0.875rem;">${percentage.toFixed(0)}% complete</div>
                </div>
                <div class="budget-progress-bar">
                    <div class="budget-progress-fill" style="width: ${Math.min(percentage, 100)}%;"></div>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function renderRecurring() {
    const recurringBills = store.getRecurringBills();
    
    renderRecurringSummaryCards(recurringBills);
    setupRecurringControls(recurringBills);
    
    const sortedBills = [...recurringBills].sort((a, b) => {
        if (a.status === 'paid' && b.status !== 'paid') return 1;
        if (a.status !== 'paid' && b.status === 'paid') return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    renderRecurringBillsList(sortedBills);
}

function renderRecurringSummaryCards(bills) {
    const container = document.getElementById('recurringSummaryCards');
    if (!container) return;
    
    container.innerHTML = '';
    
    const paid = bills.filter(b => b.status === 'paid').length;
    const upcoming = bills.filter(b => b.status !== 'paid').length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const dueSoon = bills.filter(bill => {
        if (bill.status === 'paid') return false;
        const dueDate = new Date(bill.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= sevenDaysFromNow;
    }).length;
    
    const paidCard = createStatCard('Paid Bills', paid.toString(), '', { className: 'summary-card' });
    const upcomingCard = createStatCard('Total Upcoming', upcoming.toString(), '', { className: 'summary-card' });
    const dueSoonCard = createStatCard('Due Soon', dueSoon.toString(), '', { className: 'summary-card' });
    
    container.appendChild(paidCard);
    container.appendChild(upcomingCard);
    container.appendChild(dueSoonCard);
}

function setupRecurringControls(bills) {
    const searchInput = document.getElementById('recurringSearch');
    const sortSelect = document.getElementById('recurringSort');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            renderRecurring();
        }, 300));
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            renderRecurring();
        });
    }
}

function renderRecurringBillsList(bills) {
    const tbody = document.getElementById('recurringTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    bills.forEach(bill => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${bill.name}</td>
            <td>${formatDate(bill.dueDate)}</td>
            <td>${formatCurrency(bill.amount)}</td>
            <td>
                <span class="badge ${bill.status === 'paid' ? 'badge-success' : 'badge-warning'}">
                    ${bill.status === 'paid' ? 'Paid' : 'Pending'}
                </span>
            </td>
            <td>
                <button class="btn-secondary" data-action="toggle-bill-paid" data-id="${bill.id}">
                    ${bill.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                </button>
                <button class="btn-secondary" data-action="delete-recurring" data-id="${bill.id}" style="margin-left: 0.5rem;">Delete</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

