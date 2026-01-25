/**
 * Settings Page and Feature Implementations
 */

/**
 * Render Settings page
 */
function renderSettings() {
    renderThemeSettings();
    renderCategories();
    renderMonthlyTrends();
}

/**
 * Render theme settings
 */
function renderThemeSettings() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const settings = store.getSettings();
        themeToggle.checked = settings.theme === 'dark';
    }
}

/**
 * Render categories list
 */
function renderCategories() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    const transactions = store.getTransactions();
    const customCategories = store.getCategories();
    const usedCategories = [...new Set(transactions.map(t => t.category))];
    
    // Combine custom categories with used categories
    const allCategories = [...customCategories];
    usedCategories.forEach(catName => {
        if (!allCategories.find(c => c.name === catName)) {
            allCategories.push({
                id: `auto-${catName}`,
                name: catName,
                color: '#6366f1',
                isAuto: true
            });
        }
    });
    
    container.innerHTML = '';
    
    if (allCategories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-text">No categories yet</div>
                <div class="empty-state-subtext">Add a category to get started</div>
            </div>
        `;
        return;
    }
    
    allCategories.forEach(category => {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = 'var(--spacing-md)';
        item.style.borderBottom = '1px solid var(--border-light)';
        
        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.alignItems = 'center';
        left.style.gap = 'var(--spacing-md)';
        
        const colorDot = document.createElement('div');
        colorDot.style.width = '16px';
        colorDot.style.height = '16px';
        colorDot.style.borderRadius = '50%';
        colorDot.style.backgroundColor = category.color;
        colorDot.style.flexShrink = '0';
        
        const name = document.createElement('span');
        name.textContent = category.name;
        name.style.fontWeight = 'var(--font-weight-medium)';
        
        if (category.isAuto) {
            const badge = document.createElement('span');
            badge.textContent = 'Auto';
            badge.style.fontSize = 'var(--font-size-xs)';
            badge.style.color = 'var(--muted)';
            badge.style.marginLeft = 'var(--spacing-sm)';
            name.appendChild(badge);
        }
        
        left.appendChild(colorDot);
        left.appendChild(name);
        
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = 'var(--spacing-sm)';
        
        if (!category.isAuto) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-icon';
            editBtn.textContent = 'Edit';
            editBtn.title = 'Edit';
            editBtn.addEventListener('click', () => openCategoryModal(category));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.title = 'Delete';
            deleteBtn.addEventListener('click', () => deleteCategory(category.id));
            
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
        }
        
        item.appendChild(left);
        item.appendChild(actions);
        container.appendChild(item);
    });
}

/**
 * Render monthly spending trends chart
 */
function renderMonthlyTrends() {
    const canvas = document.getElementById('monthlyTrendsChart');
    if (!canvas) return;
    
    const transactions = store.getTransactions();
    const expenses = transactions.filter(t => t.amount < 0);
    
    // Group by month
    const monthlyData = {};
    expenses.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += Math.abs(transaction.amount);
    });
    
    // Get last 6 months
    const months = [];
    const amounts = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months.push(monthName);
        amounts.push(monthlyData[monthKey] || 0);
    }
    
    // Draw chart
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (amounts.length === 0 || amounts.every(a => a === 0)) {
        ctx.fillStyle = 'var(--muted)';
        ctx.font = '14px var(--font-family)';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', width / 2, height / 2);
        return;
    }
    
    const maxAmount = Math.max(...amounts, 1);
    
    // Draw grid
    ctx.strokeStyle = 'var(--border-light)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Draw bars
    const barWidth = chartWidth / amounts.length;
    const barSpacing = barWidth * 0.2;
    const actualBarWidth = barWidth - barSpacing;
    
    amounts.forEach((amount, index) => {
        const barHeight = (amount / maxAmount) * chartHeight;
        const x = padding + index * barWidth + barSpacing / 2;
        const y = padding + chartHeight - barHeight;
        
        // Draw bar
        ctx.fillStyle = 'var(--primary)';
        ctx.fillRect(x, y, actualBarWidth, barHeight);
        
        // Draw value on top
        if (amount > 0) {
            ctx.fillStyle = 'var(--text)';
            ctx.font = '12px var(--font-family)';
            ctx.textAlign = 'center';
            ctx.fillText(formatCurrency(amount), x + actualBarWidth / 2, y - 5);
        }
        
        // Draw month label
        ctx.fillStyle = 'var(--muted)';
        ctx.font = '11px var(--font-family)';
        ctx.textAlign = 'center';
        ctx.fillText(months[index], x + actualBarWidth / 2, height - padding + 20);
    });
}

/**
 * Setup settings page
 */
function setupSettings() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            applyTheme(theme);
            store.updateSettings({ theme });
        });
    }
    
    // Export data
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = store.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
    
    // Import data
    const importBtn = document.getElementById('importDataBtn');
    const importInput = document.getElementById('importDataInput');
    const importFileName = document.getElementById('importFileName');
    
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            importInput.click();
        });
        
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            importFileName.textContent = file.name;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                if (confirm('This will replace all your current data. Are you sure?')) {
                    const success = store.importData(event.target.result);
                    if (success) {
                        alert('Data imported successfully!');
                        renderCurrentPage();
                    } else {
                        alert('Error importing data. Please check the file format.');
                    }
                }
                importInput.value = '';
                importFileName.textContent = '';
            };
            reader.readAsText(file);
        });
    }
    
    // Clear data
    const clearBtn = document.getElementById('clearDataBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete ALL your data? This cannot be undone!')) {
                if (confirm('This is your last chance. Delete all data?')) {
                    store.clearAllData();
                    alert('All data has been cleared.');
                    renderCurrentPage();
                }
            }
        });
    }
    
    // Category management
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => openCategoryModal());
    }
    
    setupCategoryModal();
}

/**
 * Apply theme
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Open category modal
 */
function openCategoryModal(category = null) {
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('categoryModalTitle');
    const form = document.getElementById('categoryForm');
    const editId = document.getElementById('categoryEditId');
    const nameInput = document.getElementById('categoryName');
    const colorInput = document.getElementById('categoryColor');
    const colorTextInput = document.getElementById('categoryColorText');
    
    if (!modal) return;
    
    if (category) {
        title.textContent = 'Edit Category';
        editId.value = category.id;
        nameInput.value = category.name;
        colorInput.value = category.color;
        colorTextInput.value = category.color;
    } else {
        title.textContent = 'Add Category';
        editId.value = '';
        form.reset();
        colorInput.value = '#6366f1';
        colorTextInput.value = '#6366f1';
    }
    
    // Sync color inputs
    colorInput.addEventListener('input', () => {
        colorTextInput.value = colorInput.value;
    });
    
    colorTextInput.addEventListener('input', () => {
        if (/^#[0-9A-F]{6}$/i.test(colorTextInput.value)) {
            colorInput.value = colorTextInput.value;
        }
    });
    
    modal.classList.add('active');
}

/**
 * Close category modal
 */
function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Setup category modal
 */
function setupCategoryModal() {
    const modal = document.getElementById('categoryModal');
    const closeBtn = document.getElementById('closeCategoryModal');
    const cancelBtn = document.getElementById('cancelCategoryBtn');
    const form = document.getElementById('categoryForm');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCategoryModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCategoryModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCategoryModal();
            }
        });
    }
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const editId = document.getElementById('categoryEditId').value;
            const name = document.getElementById('categoryName').value.trim();
            const color = document.getElementById('categoryColor').value;
            
            if (!name) {
                alert('Please enter a category name');
                return;
            }
            
            if (editId) {
                // Update existing
                store.updateCategory(editId, { name, color });
            } else {
                // Add new
                const category = {
                    id: Date.now().toString(),
                    name: name,
                    color: color
                };
                store.addCategory(category);
            }
            
            closeCategoryModal();
            renderCategories();
        });
    }
}

/**
 * Delete category
 */
function deleteCategory(id) {
    if (confirm('Are you sure you want to delete this category?')) {
        store.deleteCategory(id);
        renderCategories();
    }
}
