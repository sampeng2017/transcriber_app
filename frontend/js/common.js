// Create this new file for shared functionality
async function populateModelSelectors() {
    try {
        const response = await fetch('/models');
        const data = await response.json();
        
        // Get all model select elements
        const modelSelects = document.querySelectorAll('#modelSelect');
        
        modelSelects.forEach(select => {
            // Clear existing options
            select.innerHTML = '';
            
            // Add new options
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Failed to load models:', error);
    }
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', populateModelSelectors); 