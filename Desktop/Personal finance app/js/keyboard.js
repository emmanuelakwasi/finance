/**
 * Keyboard Navigation Support
 */

// Track current focus index for navigation
let currentFocusIndex = 0;
let focusableElements = [];

/**
 * Initialize keyboard navigation
 */
function initKeyboardNavigation() {
    // Update focusable elements
    updateFocusableElements();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Update focusable elements when DOM changes
    const observer = new MutationObserver(() => {
        updateFocusableElements();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Update list of focusable elements
 */
function updateFocusableElements() {
    focusableElements = Array.from(document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

/**
 * Handle keyboard navigation
 */
function handleKeyboardNavigation(e) {
    // Escape key - close modals
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            const closeBtn = activeModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.click();
            }
        }
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
            }
        }
    }
    
    // Ctrl/Cmd + K - Focus search (if available)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Tab navigation enhancement
    if (e.key === 'Tab') {
        updateFocusableElements();
    }
    
    // Arrow key navigation for tables and lists
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const activeElement = document.activeElement;
        
        // If in a table row, navigate rows
        if (activeElement.closest('tbody')) {
            e.preventDefault();
            const rows = Array.from(activeElement.closest('tbody').querySelectorAll('tr'));
            const currentIndex = rows.indexOf(activeElement.closest('tr'));
            
            if (e.key === 'ArrowDown' && currentIndex < rows.length - 1) {
                const nextRow = rows[currentIndex + 1];
                const firstFocusable = nextRow.querySelector('button, a, input');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            } else if (e.key === 'ArrowUp' && currentIndex > 0) {
                const prevRow = rows[currentIndex - 1];
                const firstFocusable = prevRow.querySelector('button, a, input');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            }
        }
    }
    
    // Enter key on buttons and links
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'BUTTON' || activeElement.tagName === 'A') {
            // Let default behavior handle it
            return;
        }
    }
}

/**
 * Make element keyboard accessible
 */
function makeKeyboardAccessible(element) {
    if (!element) return;
    
    // Add tabindex if not interactive
    if (!element.hasAttribute('tabindex') && 
        !['a', 'button', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
        element.setAttribute('tabindex', '0');
    }
    
    // Add keyboard event listeners
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            element.click();
        }
    });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKeyboardNavigation);
} else {
    initKeyboardNavigation();
}
