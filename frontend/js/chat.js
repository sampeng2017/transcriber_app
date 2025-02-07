const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');
const modelSelect = document.getElementById('modelSelect');
const sendButton = document.getElementById('sendButton');
const statusDiv = document.getElementById('status');
let ws = null;
let currentResponse = null;

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

        if (data.chunk) {
            currentResponse.textContent += data.chunk;
        }

        if (data.done) {
            currentResponse = null;
            enableInterface();
        }

        messageContainer.scrollTop = messageContainer.scrollHeight;
    };
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (message && ws && ws.readyState === WebSocket.OPEN) {
        // Add user message to chat
        const userDiv = document.createElement('div');
        userDiv.className = 'user-message';
        userDiv.textContent = message;
        messageContainer.appendChild(userDiv);

        // Send message to server
        ws.send(JSON.stringify({
            message: message,
            model: modelSelect.value
        }));

        // Clear input and disable interface while waiting
        messageInput.value = '';
        disableInterface();
        messageContainer.scrollTop = messageContainer.scrollHeight;
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