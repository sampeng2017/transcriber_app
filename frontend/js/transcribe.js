const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const status = document.getElementById('status');
const transcriptionDiv = document.getElementById('transcription');
const summarizeBtn = document.getElementById('summarizeBtn');
const summaryDiv = document.getElementById('summary');
const transcribeProgress = document.getElementById('transcribeProgress');
const transcribePercentage = document.getElementById('transcribePercentage');
const summarizeProgress = document.getElementById('summarizeProgress');
const summarizePercentage = document.getElementById('summarizePercentage');
const actionButtons = document.getElementById('actionButtons');
const notesBtn = document.getElementById('notesBtn');
const notesProgress = document.getElementById('notesProgress');
const notesPercentage = document.getElementById('notesPercentage');
const notesDiv = document.getElementById('notes');
const actionControls = document.getElementById('actionControls');
const actionSelect = document.getElementById('actionSelect');
const modelSelect = document.getElementById('modelSelect');
const processBtn = document.getElementById('processBtn');
const processProgress = document.getElementById('processProgress');
const processPercentage = document.getElementById('processPercentage');
const showPromptToggle = document.getElementById('showPromptToggle');
const promptEditor = document.getElementById('promptEditor');
const summaryPromptText = document.getElementById('summaryPromptText');
const notesPromptText = document.getElementById('notesPromptText');
const copyTranscriptBtn = document.getElementById('copyTranscriptBtn');
const copyResultBtn = document.getElementById('copyResultBtn');
const transcriptionBlock = document.getElementById('transcriptionBlock');
const resultBlock = document.getElementById('resultBlock');

// Default prompts
const DEFAULT_SUMMARY_PROMPT = "Please summarize this text concisely:\n\n";
const DEFAULT_NOTES_PROMPT = `Convert this transcript into detailed yet informal meeting notes.

Key requirements:
1. Essential Details:
   - Capture all key decisions and agreements
   - List specific action items with owners (if mentioned)
   - Include important numbers, dates, or deadlines
   - Note any major concerns or risks discussed
   - Highlight follow-up items

2. Informal Style:
   - Use casual, easy-to-read language
   - Skip speaker names and formal transitions
   - Use bullet points and simple sections
   - Add brief context where helpful
   - Feel free to use common abbreviations

Format using:
- Clear section headers (##)
- Bullet points (-)
- Sub-bullets where needed
- Bold for important points (**)
- Lists for action items

Remember: Focus on what matters, skip the small talk, and keep it readable!`;

// Initialize prompts
if (summaryPromptText) summaryPromptText.value = DEFAULT_SUMMARY_PROMPT;
if (notesPromptText) notesPromptText.value = DEFAULT_NOTES_PROMPT;

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
        handleFile(file);
    } else {
        showError('Please upload an audio file');
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

function handleFile(file) {
    fileInfo.textContent = `Selected file: ${file.name}`;
    transcriptionDiv.style.display = 'none';
    actionControls.style.display = 'none';
    summaryDiv.style.display = 'none';
    notesDiv.style.display = 'none';
    uploadFile(file);
}

function showError(message) {
    status.innerHTML = `<div class="error-message">${message}</div>`;
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    resetUI();  // Reset UI first

    // Show progress
    transcribeProgress.style.display = 'block';
    status.textContent = 'Transcribing...';
    let progress = 0;

    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        transcribePercentage.textContent = `${Math.round(progress)}%`;
    }, 1000);

    try {
        const response = await fetch('/transcribe/', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        transcribePercentage.textContent = '100%';
        
        setTimeout(() => {
            transcribeProgress.style.display = 'none';
            
            // Show transcription block and its contents
            transcriptionBlock.style.display = 'block';
            transcriptionDiv.style.display = 'block';  // Make sure the div itself is visible
            transcriptionDiv.textContent = data.transcription;
            
            // Show copy button and controls
            copyTranscriptBtn.style.display = 'flex';
            actionControls.style.display = 'block';
            processBtn.disabled = false;
            
            status.textContent = 'Transcription complete';
        }, 500);

    } catch (error) {
        showError(`Error: ${error.message}`);
    } finally {
        clearInterval(progressInterval);
    }
}

// Explicitly handle Chrome-specific issues
function initializePromptControls() {
    // Force Chrome to recognize the elements
    setTimeout(() => {
        if (showPromptToggle && promptEditor) {
            // Remove existing listeners first
            showPromptToggle.removeEventListener('change', togglePromptEditor);
            showPromptToggle.removeEventListener('click', togglePromptEditor);
            
            // Add both change and click listeners for Chrome
            showPromptToggle.addEventListener('change', togglePromptEditor);
            showPromptToggle.addEventListener('click', (e) => {
                console.log('Checkbox clicked');
                // Force update the display after a small delay
                setTimeout(() => {
                    togglePromptEditor();
                }, 0);
            });
            
            console.log('Prompt controls initialized');
        } else {
            console.error('Prompt controls not found');
        }
    }, 100);
}

function togglePromptEditor() {
    if (!promptEditor || !showPromptToggle) {
        console.error('Required elements not found');
        return;
    }
    
    console.log('Toggle state:', showPromptToggle.checked);
    
    // Force Chrome to update the display
    requestAnimationFrame(() => {
        promptEditor.style.display = showPromptToggle.checked ? 'block' : 'none';
        console.log('Display updated to:', promptEditor.style.display);
        updatePromptVisibility();
    });
}

function updatePromptVisibility() {
    if (!showPromptToggle || !promptEditor) return;
    
    const isVisible = showPromptToggle.checked;
    console.log('Should be visible:', isVisible);
    
    if (!isVisible) {
        promptEditor.style.display = 'none';
        return;
    }
    
    const action = actionSelect.value;
    const summarizePrompt = document.getElementById('summarizePrompt');
    const notesPrompt = document.getElementById('notesPrompt');
    
    if (summarizePrompt && notesPrompt) {
        requestAnimationFrame(() => {
            summarizePrompt.style.display = action === 'summarize' ? 'block' : 'none';
            notesPrompt.style.display = action === 'notes' ? 'block' : 'none';
            console.log('Prompts visibility updated');
        });
    }
}

async function processTranscription() {
    const transcription = transcriptionDiv.textContent;
    if (!transcription) return;

    const action = actionSelect.value;
    const model = modelSelect.value;
    const prompt = action === 'summarize' ? 
        summaryPromptText.value : 
        notesPromptText.value;
    
    processBtn.disabled = true;
    processProgress.style.display = 'block';
    status.textContent = `Processing ${action === 'summarize' ? 'summary' : 'notes'}...`;
    summaryDiv.style.display = 'none';
    notesDiv.style.display = 'none';
    let progress = 0;

    const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) progress = 90;
        processPercentage.textContent = `${Math.round(progress)}%`;
    }, 1000);

    try {
        const formData = new FormData();
        formData.append('text', transcription);
        formData.append('model', model);
        formData.append('prompt', prompt);

        const endpoint = action === 'summarize' ? '/summarize/' : '/convert-to-notes/';
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        processPercentage.textContent = '100%';
        
        setTimeout(() => {
            processProgress.style.display = 'none';
            resultBlock.style.display = 'block';
            if (action === 'summarize') {
                summaryDiv.textContent = data.summary;
                summaryDiv.style.display = 'block';
                notesDiv.style.display = 'none';
            } else {
                notesDiv.innerHTML = marked.parse(data.notes);
                notesDiv.style.display = 'block';
                summaryDiv.style.display = 'none';
            }
            copyResultBtn.style.display = 'flex';
            status.textContent = `${action === 'summarize' ? 'Summary' : 'Notes'} complete`;
            processBtn.disabled = false;
        }, 500);

    } catch (error) {
        showError(`Error: ${error.message}`);
        processBtn.disabled = false;
    } finally {
        clearInterval(progressInterval);
    }
}

// Initialize everything when the DOM is fully loaded
function initializeUI() {
    console.log('Initializing UI...');
    
    // Initialize prompts if they exist
    if (summaryPromptText) summaryPromptText.value = DEFAULT_SUMMARY_PROMPT;
    if (notesPromptText) notesPromptText.value = DEFAULT_NOTES_PROMPT;
    
    // Initialize prompt controls with Chrome-specific handling
    initializePromptControls();
    
    // Add action select listener
    if (actionSelect) {
        actionSelect.addEventListener('change', updatePromptVisibility);
    }
    
    // Initial visibility update
    updatePromptVisibility();
}

// Use multiple initialization points for better browser compatibility
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUI);
} else {
    initializeUI();
}

window.addEventListener('load', initializeUI);

// Add this function to handle text copying
async function copyText(type) {
    let text = '';
    let button;
    
    if (type === 'transcription') {
        text = transcriptionDiv.textContent;
        button = document.querySelector('.copy-btn[onclick*="transcription"]');
    } else if (type === 'result') {
        // Get the currently visible result
        if (summaryDiv.style.display !== 'none') {
            text = summaryDiv.textContent;
        } else if (notesDiv.style.display !== 'none') {
            // For notes, get the text content without HTML formatting
            text = notesDiv.textContent;
        }
        button = document.querySelector('.copy-btn[onclick*="result"]');
    }

    if (!text) {
        console.log('No text to copy');
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="copy-icon">✓</span> Copied!';
        button.classList.add('copied');
        
        // Reset button after 2 seconds
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
        
    } catch (err) {
        console.error('Failed to copy text:', err);
        
        // Fallback method
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            
            // Visual feedback
            const originalText = button.innerHTML;
            button.innerHTML = '<span class="copy-icon">✓</span> Copied!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('copied');
            }, 2000);
            
        } catch (err) {
            console.error('Fallback copy failed:', err);
            button.innerHTML = '<span class="copy-icon">❌</span> Failed to copy';
            
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        }
        
        document.body.removeChild(textarea);
    }
}

function clearChat() {
    // ... existing code ...
    copyTranscriptBtn.style.display = 'none';
    copyResultBtn.style.display = 'none';
}

// Update the resetUI function to be more specific
function resetUI() {
    // Hide blocks
    transcriptionBlock.style.display = 'none';
    resultBlock.style.display = 'none';
    
    // Reset transcription
    transcriptionDiv.style.display = 'none';
    transcriptionDiv.textContent = '';
    
    // Reset result sections
    summaryDiv.style.display = 'none';
    summaryDiv.textContent = '';
    notesDiv.style.display = 'none';
    notesDiv.innerHTML = '';
    
    // Hide buttons and controls
    copyTranscriptBtn.style.display = 'none';
    copyResultBtn.style.display = 'none';
    actionControls.style.display = 'none';
    
    // Reset progress
    transcribeProgress.style.display = 'none';
    processProgress.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const modelSelectTranscribe = document.getElementById('modelSelect');

    if (!modelSelectTranscribe) {
        console.error('Dropdown element not found!');
        return; // Exit if the element is not found
    }

    // Fetch available models
    fetch('/models')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched models:', data); // Debug log
            if (data.models) {
                console.log('Models array:', data.models); // Log the models array
                modelSelectTranscribe.innerHTML = data.models
                    .map(model => `<option value="${model}">${model}</option>`)
                    .join('');
                console.log('Dropdown options:', modelSelectTranscribe.innerHTML); // Log the dropdown options
            } else {
                console.error('No models found in response');
            }
        })
        .catch(error => console.error('Error fetching models:', error));

    // Add change event listener
    modelSelectTranscribe.addEventListener('change', () => {
        console.log('Dropdown changed, selected model:', modelSelectTranscribe.value);
    });
}); 