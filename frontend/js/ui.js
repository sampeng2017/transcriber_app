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
        // Call the chat class to handle sending the message
        chat.sendMessage(message);
        this.messageInput.value = ''; // Clear input after sending
    }

    updateStatus(status) {
        this.status.textContent = status;
    }
}

// Initialize UI
const ui = new UI(); 