/**
 * Reusable Component Functions
 * Creates consistent UI components throughout the app
 */

/**
 * Create a card component
 * @param {string} title - Card title
 * @param {string|HTMLElement} content - Card content (HTML string or element)
 * @param {Object} options - Additional options (className, headerActions, etc.)
 * @returns {HTMLElement} Card element
 */
function createCard(title, content, options = {}) {
    const card = document.createElement('div');
    card.className = 'card';
    if (options.className) {
        card.className += ` ${options.className}`;
    }

    const header = document.createElement('div');
    header.className = 'card-header';
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    header.appendChild(titleEl);
    
    if (options.headerActions) {
        const actions = document.createElement('div');
        actions.className = 'card-header-actions';
        if (typeof options.headerActions === 'string') {
            actions.innerHTML = options.headerActions;
        } else {
            actions.appendChild(options.headerActions);
        }
        header.appendChild(actions);
    }

    const contentEl = document.createElement('div');
    contentEl.className = 'card-content';
    
    if (typeof content === 'string') {
        contentEl.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        contentEl.appendChild(content);
    } else if (Array.isArray(content)) {
        content.forEach(item => {
            if (typeof item === 'string') {
                contentEl.innerHTML += item;
            } else {
                contentEl.appendChild(item);
            }
        });
    }

    card.appendChild(header);
    card.appendChild(contentEl);

    return card;
}

/**
 * Create a table component
 * @param {Array} headers - Array of header objects {text, className}
 * @param {Array} rows - Array of row data arrays
 * @param {Object} options - Additional options (className, emptyMessage, etc.)
 * @returns {HTMLElement} Table element
 */
function createTable(headers, rows, options = {}) {
    const table = document.createElement('table');
    table.className = 'data-table';
    if (options.className) {
        table.className += ` ${options.className}`;
    }

    // Create thead
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.text || header;
        if (header.className) {
            th.className = header.className;
        }
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create tbody
    const tbody = document.createElement('tbody');
    
    if (rows.length === 0 && options.emptyMessage) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = headers.length;
        emptyCell.className = 'empty-state';
        emptyCell.innerHTML = `
            ${options.emptyIcon ? `<div class="empty-state-icon">${options.emptyIcon}</div>` : ''}
            <div class="empty-state-text">${options.emptyMessage}</div>
            ${options.emptySubtext ? `<div class="empty-state-subtext">${options.emptySubtext}</div>` : ''}
        `;
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
    } else {
        rows.forEach(row => {
            const tr = document.createElement('tr');
            if (row.className) {
                tr.className = row.className;
            }
            
            row.cells.forEach(cell => {
                const td = document.createElement('td');
                if (typeof cell === 'string') {
                    td.innerHTML = cell;
                } else if (cell instanceof HTMLElement) {
                    td.appendChild(cell);
                } else if (cell && typeof cell === 'object') {
                    if (cell.content) {
                        if (typeof cell.content === 'string') {
                            td.innerHTML = cell.content;
                        } else {
                            td.appendChild(cell.content);
                        }
                    }
                    if (cell.className) {
                        td.className = cell.className;
                    }
                }
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
    }
    
    table.appendChild(tbody);

    return table;
}

/**
 * Create a list component
 * @param {Array} items - Array of list items (strings or objects with content/className)
 * @param {Object} options - Additional options (className, emptyMessage, etc.)
 * @returns {HTMLElement} List element
 */
function createList(items, options = {}) {
    const list = document.createElement('ul');
    list.className = 'data-list';
    if (options.className) {
        list.className += ` ${options.className}`;
    }

    if (items.length === 0 && options.emptyMessage) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'empty-state';
        emptyItem.innerHTML = `
            ${options.emptyIcon ? `<div class="empty-state-icon">${options.emptyIcon}</div>` : ''}
            <div class="empty-state-text">${options.emptyMessage}</div>
            ${options.emptySubtext ? `<div class="empty-state-subtext">${options.emptySubtext}</div>` : ''}
        `;
        list.appendChild(emptyItem);
    } else {
        items.forEach(item => {
            const li = document.createElement('li');
            
            if (typeof item === 'string') {
                li.innerHTML = item;
            } else if (item instanceof HTMLElement) {
                li.appendChild(item);
            } else if (item && typeof item === 'object') {
                if (item.content) {
                    if (typeof item.content === 'string') {
                        li.innerHTML = item.content;
                    } else {
                        li.appendChild(item.content);
                    }
                }
                if (item.className) {
                    li.className = item.className;
                }
            }
            
            list.appendChild(li);
        });
    }

    return list;
}

/**
 * Create a stat card (summary card)
 * @param {string} title - Card title
 * @param {string} value - Main value to display
 * @param {string} label - Optional label below value
 * @param {Object} options - Additional options (change, changeType, className)
 * @returns {HTMLElement} Stat card element
 */
function createStatCard(title, value, label, options = {}) {
    const content = `
        <div class="stat-value">${value}</div>
        ${label ? `<div class="stat-label">${label}</div>` : ''}
        ${options.change ? `<div class="stat-change ${options.changeType || 'positive'}">${options.change}</div>` : ''}
    `;
    
    return createCard(title, content, options);
}

/**
 * Create a progress bar
 * @param {number} current - Current value
 * @param {number} total - Total/target value
 * @param {Object} options - Additional options (showPercentage, showValues, className)
 * @returns {HTMLElement} Progress bar container
 */
function createProgressBar(current, total, options = {}) {
    const percentage = calculatePercentage(current, total);
    const progressColor = getProgressColor(percentage);
    
    const container = document.createElement('div');
    container.className = 'progress-container';
    if (options.className) {
        container.className += ` ${options.className}`;
    }

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    
    const progressFill = document.createElement('div');
    progressFill.className = `progress-fill ${progressColor}`;
    progressFill.style.width = `${Math.min(percentage, 100)}%`;
    
    progressBar.appendChild(progressFill);
    container.appendChild(progressBar);

    if (options.showPercentage || options.showValues) {
        const progressText = document.createElement('div');
        progressText.className = 'progress-text';
        
        let textContent = '';
        if (options.showPercentage) {
            textContent += `<span>${percentage}%</span>`;
        }
        if (options.showValues) {
            textContent += `<span>${formatCurrency(current)} / ${formatCurrency(total)}</span>`;
        }
        progressText.innerHTML = textContent;
        
        container.appendChild(progressText);
    }

    return container;
}
