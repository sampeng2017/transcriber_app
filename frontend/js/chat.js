const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');
const modelSelect = document.getElementById('modelSelect');
const sendButton = document.getElementById('sendButton');
const statusDiv = document.getElementById('status');
const useSearchCheckbox = document.getElementById('useSearch');
let ws = null;
let currentResponse = null;
let chatHistory = [];
const MAX_HISTORY_LENGTH = 4096; // Adjust based on model's context window

class Chat {
    constructor() {
        this.isConnected = false;
        // Additional initialization if needed
    }

    sendMessage(message) {
        if (this.isConnected) {
            // Logic to send the message
            console.log(`Sending message: ${message}`);
            // Update UI or handle response
        } else {
            console.error('Not connected to chat server.');
        }
    }

    connect() {
        // Logic to connect to chat server
        this.isConnected = true;
        ui.updateStatus('Connected');
    }

    disconnect() {
        // Logic to disconnect from chat server
        this.isConnected = false;
        ui.updateStatus('Disconnected');
    }
}

// Initialize Chat
const chat = new Chat();

function connect() {
    console.log('Connecting to WebSocket...');
    ws = new WebSocket(`ws://${window.location.host}/chat`);

    ws.onopen = () => {
        console.log('WebSocket connection opened');
        statusDiv.textContent = 'Connected';
        statusDiv.style.color = '#4caf50';
        enableInterface();
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed, attempting to reconnect...');
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
        console.log('Received message from WebSocket:', event.data);
        const data = JSON.parse(event.data);
        
        if (data.error) {
            console.error('Error received from WebSocket:', data.error);
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
            currentResponse.setAttribute('data-content', ''); // Initialize empty content
            messageContainer.appendChild(currentResponse);
        }

        if (!data.done) {
            // Accumulate content
            const newContent = currentResponse.getAttribute('data-content') + data.chunk;
            currentResponse.setAttribute('data-content', newContent);
            
            // Render accumulated content
            try {
                currentResponse.innerHTML = marked.parse(newContent, {
                    breaks: true,
                    gfm: true,
                    sanitize: true
                });
            } catch (e) {
                // If markdown parsing fails, show raw content
                currentResponse.textContent = newContent;
            }
            
            messageContainer.scrollTop = messageContainer.scrollHeight;
        } else {
            // Final render
            const finalContent = currentResponse.getAttribute('data-content');
            try {
                currentResponse.innerHTML = marked.parse(finalContent, {
                    breaks: true,
                    gfm: true,
                    sanitize: true
                });
            } catch (e) {
                currentResponse.textContent = finalContent;
            }
            
            // Add to history and cleanup
            addMessageToHistory('assistant', finalContent);
            currentResponse = null;
            enableInterface();
        }
    };
}

function clearChat() {
    console.log('Clearing chat history...');
    chatHistory = [];
    messageContainer.innerHTML = '';
    statusDiv.textContent = 'Chat cleared';
}

function addMessageToHistory(role, content) {
    console.log(`Adding message to history: role=${role}, content=${content}`);
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

    // Get the selected model from the dropdown
    const selectedModel = modelSelect.value; // Ensure this captures the selected model
    console.log('Selected model from dropdown:', selectedModel); // Debug log

    if (!selectedModel) {
        showError('Please select a model before sending a message.');
        return;
    }

    // Check if "Use Search" is checked
    const useSearch = useSearchCheckbox.checked;
    console.log('Use Search checked:', useSearch);

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
            model: selectedModel, // Use the selected model here
            history: chatHistory,
            useSearch: useSearch // Include the useSearch flag
        }));

        // Clear input and disable interface while waiting
        messageInput.value = '';
        disableInterface();
        messageContainer.scrollTop = messageContainer.scrollHeight;
        currentResponse = null;

    } catch (error) {
        console.error('Error sending message:', error);
        showError(`Error: ${error.message}`);
        enableInterface();
    }
}

function enableInterface() {
    console.log('Enabling interface...');
    messageInput.disabled = false;
    modelSelect.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
}

function disableInterface() {
    console.log('Disabling interface...');
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

document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('modelSelect');
    const useSearchCheckbox = document.getElementById('useSearch');
    const useSearchLabel = document.querySelector('label[for="useSearch"]');
    let defaultModel = null;

    // Fetch configuration to get the DEFAULT_MODEL and check if Google API key and search engine ID are set
    fetch('/api/config')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched config:', data); // Debug log
            defaultModel = data.defaultModel;
            if (data.googleApiKey && data.searchEngineId) {
                useSearchCheckbox.style.display = 'inline';
                useSearchLabel.style.display = 'inline';
            } else {
                useSearchCheckbox.style.display = 'none';
                useSearchLabel.style.display = 'none';
            }

            // Fetch available models after getting the default model
            fetch('/models')
                .then(response => response.json())
                .then(data => {
                    console.log('Fetched models:', data); // Debug log
                    if (data.models) {
                        console.log('Models array:', data.models); // Log the models array
                        modelSelect.innerHTML = data.models
                            .map(model => `<option value="${model}">${model}</option>`)
                            .join('');
                        console.log('Dropdown options:', modelSelect.innerHTML); // Log the dropdown options

                        // Select the DEFAULT_MODEL if it is present in the models array
                        if (data.models.includes(defaultModel)) {
                            modelSelect.value = defaultModel;
                        }
                    }
                })
                .catch(error => console.error('Error fetching models:', error));
        })
        .catch(error => console.error('Error fetching config:', error));

    // Add change event listener
    modelSelect.addEventListener('change', () => {
        console.log('Dropdown changed, selected model:', modelSelect.value);
    });
});

// Initial connection
connect();

// Update containsMarkdown function to be more precise
function containsMarkdown(text) {
    // Check for common markdown patterns
    const markdownPatterns = [
        /#{1,6}\s/m, // headers
        /\*\*.+?\*\*/s, // bold
        /\*.+?\*/s, // italic
        /^-\s.+/m, // unordered lists
        /^\d+\.\s.+/m, // ordered lists
        /\[.+?\]\(.+?\)/s, // links
        /```[\s\S]+?```/m, // code blocks
        /^>\s.+/m, // blockquotes
        /\|.+?\|/m, // tables
        /^-{3,}/m, // horizontal rules
        /^###\s/m, // specific header pattern often used
    ];
    
    return markdownPatterns.some(pattern => pattern.test(text));
}

// Helper function to safely render markdown
function safeMarkdownRender(content) {
    try {
        return marked.parse(content, {
            breaks: true,
            gfm: true,
            sanitize: true
        });
    } catch (e) {
        console.warn('Markdown parsing failed:', e);
        return content;
    }
}

// Update the message display function
function addMessageToUI(content, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'ai-message';
    
    if (!isUser && containsMarkdown(content)) {
        // Use marked to render markdown
        messageDiv.innerHTML = marked.parse(content, {
            breaks: true, // Enable line breaks
            gfm: true, // Enable GitHub Flavored Markdown
            sanitize: true // Prevent XSS attacks
        });
    } else {
        messageDiv.textContent = content;
    }
    
    messageContainer.appendChild(messageDiv);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}