class UI {
    constructor() {
        this.clearBtn = document.getElementById('clearBtn');
        this.sendButton = document.getElementById('sendButton');
        this.messageInput = document.getElementById('messageInput');
        this.messageContainer = document.getElementById('messageContainer');
        this.status = document.getElementById('status');

        this.clearBtn.addEventListener('click', this.clearChat.bind(this));
        this.sendButton.addEventListener('click', this.sendMessage.bind(this));
    }

    clearChat() {
        this.messageContainer.innerHTML = '';
    }

    sendMessage() {
        const message = this.messageInput.value;
        if (typeof sendMessageToServer === 'function') {
            sendMessageToServer(message);
        } else {
            console.error('sendMessageToServer function is not defined.');
        }
        this.messageInput.value = ''; // Clear input after sending
    }

    updateStatus(status) {
        this.status.textContent = status;
    }
}

// Initialize UI
const ui = new UI();

function sendMessageToServer() {
    // Function implementation
    console.log("Message sent to server");
}

// Ensure the function is bound to the send button's click event
document.getElementById('sendButton').addEventListener('click', sendMessageToServer);