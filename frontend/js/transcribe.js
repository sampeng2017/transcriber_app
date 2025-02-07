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

    // Reset all displays
    transcribeProgress.style.display = 'block';
    actionControls.style.display = 'none';
    processBtn.disabled = true;
    transcriptionDiv.style.display = 'none';
    summaryDiv.style.display = 'none';
    notesDiv.style.display = 'none';
    
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
            transcriptionDiv.textContent = data.transcription;
            transcriptionDiv.style.display = 'block';
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

async function processTranscription() {
    const transcription = transcriptionDiv.textContent;
    if (!transcription) return;

    const action = actionSelect.value;
    const model = modelSelect.value;
    
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
        formData.append('model', model);  // Add model to request

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
            if (action === 'summarize') {
                summaryDiv.textContent = data.summary;
                summaryDiv.style.display = 'block';
            } else {
                notesDiv.innerHTML = marked.parse(data.notes);
                notesDiv.style.display = 'block';
            }
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