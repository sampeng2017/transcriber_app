# AI-Powered Transcription and Chat Application

A web application that combines audio transcription, text processing, and AI chat capabilities using FastAPI and Ollama.

## Features

### 1. Audio Transcription & Processing
- **Audio File Upload**
  - Drag & drop interface
  - Support for various audio formats
  - Real-time progress tracking
- **Processing Options**
  - Generate Concise Summary
  - Convert to Informal Meeting Notes
- **Model Selection**
  - Choose between different LLM models (Mistral 7B, Qwen2 7B)
- **Output Formats**
  - Clean, formatted transcriptions
  - Markdown-rendered notes
  - Structured summaries

### 2. AI Chat Interface
- Real-time chat with AI models
- Model selection for different conversations
- WebSocket-based streaming responses
- Clean, intuitive interface

## Getting Started

### Prerequisites
- Python 3.11 (other versions may work but not tested)
- [Ollama](https://ollama.ai/) installed locally
- Required models pulled in Ollama:
```bash
ollama pull mistral:7b
ollama pull qwen2:7b
```

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [your-repo-name]
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the server:
```bash
uvicorn backend.app:app --reload
```

4. Access the application:
- Chat Interface: http://localhost:8000/chat
- Transcription Interface: http://localhost:8000/transcribe

## Usage

### Transcription Interface
1. Upload an audio file by:
   - Dragging and dropping onto the upload area
   - Clicking "Choose Audio File" button
2. Wait for transcription to complete
3. Select desired processing option:
   - "Generate Summary" for concise overview
   - "Convert to Notes" for detailed meeting notes
4. Choose preferred AI model
5. Click "Process" to generate output

### Chat Interface
1. Select preferred AI model
2. Type message in input field
3. View real-time streaming responses
4. Navigate between conversations

## Technical Stack
- **Backend**: FastAPI
- **AI Models**: Ollama (Mistral 7B, Qwen2 7B)
- **Frontend**: HTML, CSS, JavaScript
- **Real-time Communication**: WebSocket
- **Audio Processing**: Whisper

## Project Structure
```
project/
├── backend/
│   └── app.py
├── frontend/
│   ├── css/
│   │   ├── common.css
│   │   ├── chat.css
│   │   └── transcribe.css
│   ├── js/
│   │   ├── chat.js
│   │   └── transcribe.js
│   ├── chat.html
│   └── transcribe.html
└── requirements.txt
```

## Contributing
Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License
[Your chosen license]

## 📚 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/transcribe/` | POST | Upload an audio file and get its transcription |
| `/summarize/` | POST | Summarize the transcribed text |

