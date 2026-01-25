/**
 * Form Validation Utilities
 */

/**
 * Show field error
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing error
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error class
    field.classList.add('error');
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = 'var(--danger)';
    errorDiv.style.fontSize = 'var(--font-size-sm)';
    errorDiv.style.marginTop = 'var(--spacing-xs)';
    
    field.parentElement.appendChild(errorDiv);
    
    // Focus on field
    field.focus();
}

/**
 * Clear field error
 */
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.remove('error');
    const error = field.parentElement.querySelector('.field-error');
    if (error) {
        error.remove();
    }
}

/**
 * Clear all form errors
 */
function clearFormErrors(form) {
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        field.classList.remove('error');
    });
    
    const errors = form.querySelectorAll('.field-error');
    errors.forEach(error => error.remove());
}

/**
 * Validate required field
 */
function validateRequired(value, fieldName) {
    if (!value || value.trim() === '') {
        return `${fieldName} is required`;
    }
    return null;
}

/**
 * Validate number field
 */
function validateNumber(value, fieldName, min = 0) {
    if (!value || isNaN(value)) {
        return `${fieldName} must be a valid number`;
    }
    if (parseFloat(value) < min) {
        return `${fieldName} must be at least ${min}`;
    }
    return null;
}

/**
 * Validate date field
 */
function validateDate(value, fieldName) {
    if (!value) {
        return `${fieldName} is required`;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        return `${fieldName} must be a valid date`;
    }
    return null;
}
