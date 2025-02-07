const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');
const modelSelect = document.getElementById('modelSelect');
const sendButton = document.getElementById('sendButton');
const statusDiv = document.getElementById('status');
let ws = null;
let currentResponse = null;
let chatHistory = [];
const MAX_HISTORY_LENGTH = 4096; // Adjust based on model's context window

function connect() {
    ws = new WebSocket(`ws://${window.location.host}/chat`);

    ws.onopen = () => {
        statusDiv.textContent = 'Connected';
        statusDiv.style.color = '#4caf50';
        enableInterface();
    };

    ws.onclose = () => {
        statusDiv.textContent = 'Disconnected - Reconnecting...';
        statusDiv.style.color = '#f44336';
        disableInterface();
        setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        statusDiv.textContent = 'Connection error';
        statusDiv.style.color = '#f44336';
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = data.error;
            messageContainer.appendChild(errorDiv);
            enableInterface();
            return;
        }

        if (currentResponse === null) {
            currentResponse = document.createElement('div');
            currentResponse.className = 'ai-message';
            messageContainer.appendChild(currentResponse);
        }

        if (!data.done) {
            currentResponse.textContent += data.chunk;
            messageContainer.scrollTop = messageContainer.scrollHeight;
        } else {
            // Add completed response to history
            addMessageToHistory('assistant', currentResponse.textContent);
            enableInterface();
        }
    };
}

function clearChat() {
    chatHistory = [];
    messageContainer.innerHTML = '';
    statusDiv.textContent = 'Chat cleared';
}

function addMessageToHistory(role, content) {
    chatHistory.push({ role, content });
    
    // Calculate total length of history
    let totalLength = chatHistory.reduce((sum, msg) => sum + msg.content.length, 0);
    
    // If exceeding limit, remove oldest messages until within limit
    while (totalLength > MAX_HISTORY_LENGTH && chatHistory.length > 2) {
        const removed = chatHistory.shift();
        totalLength -= removed.content.length;
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Add user message to UI
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'user-message';
    userMessageDiv.textContent = message;
    messageContainer.appendChild(userMessageDiv);

    // Add to history
    addMessageToHistory('user', message);

    try {
        // Send message with context
        ws.send(JSON.stringify({
            message: message,
            model: modelSelect.value,
            history: chatHistory
        }));

        // Clear input and disable interface while waiting
        messageInput.value = '';
        disableInterface();
        messageContainer.scrollTop = messageContainer.scrollHeight;
        currentResponse = null;

    } catch (error) {
        showError(`Error: ${error.message}`);
        enableInterface();
    }
}

function enableInterface() {
    messageInput.disabled = false;
    modelSelect.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
}

function disableInterface() {
    messageInput.disabled = true;
    modelSelect.disabled = true;
    sendButton.disabled = true;
}

// Handle enter key
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Fetch available models
fetch('/models')
    .then(response => response.json())
    .then(data => {
        if (data.models) {
            modelSelect.innerHTML = data.models
                .map(model => `<option value="${model}">${model}</option>`)
                .join('');
        }
    })
    .catch(error => console.error('Error fetching models:', error));

// Initial connection
connect(); 