class Store {
    constructor() {
        this.storageKey = 'financeAppData';
        this.listeners = [];
        this.state = this.loadState();
    }

    loadState() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading state:', error);
        }

        if (typeof sampleData !== 'undefined') {
            const seededState = {
                transactions: sampleData.transactions || [],
                budgets: sampleData.budgets || [],
                pots: sampleData.pots || [],
                recurringBills: sampleData.recurringBills || []
            };
            this.saveState(seededState);
            return seededState;
        }

        return {
            transactions: [],
            budgets: [],
            pots: [],
            recurringBills: [],
            categories: [],
            settings: {
                theme: 'light'
            }
        };
    }

    saveState(state = null) {
        try {
            const stateToSave = state || this.state;
            localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    getState() {
        return this.state;
    }

    getTransactions() {
        return this.state.transactions || [];
    }

    addTransaction(transaction) {
        const transactions = [...this.state.transactions, transaction];
        this.state.transactions = transactions;
        this.saveState();
        this.notifyListeners();
    }

    deleteTransaction(id) {
        const transactions = this.state.transactions.filter(t => t.id !== id);
        this.state.transactions = transactions;
        this.saveState();
        this.notifyListeners();
    }

    getBudgets() {
        return this.state.budgets || [];
    }

    addBudget(budget) {
        const budgets = [...this.state.budgets, budget];
        this.state.budgets = budgets;
        this.saveState();
        this.notifyListeners();
    }

    updateBudgetSpent(id, spent) {
        const budgets = this.state.budgets.map(budget => {
            if (budget.id === id) {
                return { ...budget, spent };
            }
            return budget;
        });
        this.state.budgets = budgets;
        this.saveState();
        this.notifyListeners();
    }

    updateBudgetLimit(id, limit) {
        const budgets = this.state.budgets.map(budget => {
            if (budget.id === id) {
                return { ...budget, limit };
            }
            return budget;
        });
        this.state.budgets = budgets;
        this.saveState();
        this.notifyListeners();
    }

    updateBudget(id, updates) {
        const budgets = this.state.budgets.map(budget => {
            if (budget.id === id) {
                return { ...budget, ...updates };
            }
            return budget;
        });
        this.state.budgets = budgets;
        this.saveState();
        this.notifyListeners();
    }

    deleteBudget(id) {
        const budgets = this.state.budgets.filter(budget => budget.id !== id);
        this.state.budgets = budgets;
        this.saveState();
        this.notifyListeners();
    }

    getPots() {
        return this.state.pots || [];
    }

    addPot(pot) {
        const pots = [...this.state.pots, pot];
        this.state.pots = pots;
        this.saveState();
        this.notifyListeners();
    }

    updatePotSaved(id, saved) {
        const pots = this.state.pots.map(pot => {
            if (pot.id === id) {
                return { ...pot, saved };
            }
            return pot;
        });
        this.state.pots = pots;
        this.saveState();
        this.notifyListeners();
    }

    getRecurringBills() {
        return this.state.recurringBills || [];
    }

    addRecurringBill(bill) {
        const recurringBills = [...this.state.recurringBills, bill];
        this.state.recurringBills = recurringBills;
        this.saveState();
        this.notifyListeners();
    }

    toggleBillPaid(id) {
        const recurringBills = this.state.recurringBills.map(bill => {
            if (bill.id === id) {
                return {
                    ...bill,
                    status: bill.status === 'paid' ? 'pending' : 'paid'
                };
            }
            return bill;
        });
        this.state.recurringBills = recurringBills;
        this.saveState();
        this.notifyListeners();
    }

    deleteRecurringBill(id) {
        const recurringBills = this.state.recurringBills.filter(bill => bill.id !== id);
        this.state.recurringBills = recurringBills;
        this.saveState();
        this.notifyListeners();
    }
}

const store = new Store();
