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
- Python 3.11 (other versions may work but are not tested)
- [Ollama](https://ollama.ai/) installed locally
-  Pull the necessary models using Ollama (not all are needed, but at least one is needed):

```bash
ollama pull llama3:8b
ollama pull qwen2.5:7b
ollama pull qwen2:7b
ollama pull mistral:7b
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sampeng2017/transcriber_app.git
cd transcriber_app
```

2. Create a virtual environment:
python3 -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

3. Install dependencies:
```bash
pip install -r requirements.txt
```
4. Set environment variables for Search (optional):
On macOS/Linux:
export GOOGLE_API_KEY="your_google_api_key"
export SEARCH_ENGINE_ID="your_search_engine_id"
On Windows:
setx GOOGLE_API_KEY "your_google_api_key"
setx SEARCH_ENGINE_ID "your_search_engine_id"

4. Start the server:
```bash
uvicorn backend.app:app --reload
```

5. Access the application:
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
│   ├── app.py
│   ├── config.py
│   └── requirements.txt
├── frontend/
│   ├── css/
│   │   ├── common.css
│   │   ├── chat.css
│   │   └── transcribe.css
│   ├── js/
│   │   ├── common.js
│   │   ├── chat.js
│   │   └── transcribe.js
│   ├── chat.html
│   └── transcribe.html
└── README.md
```

## Contributing
Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License
[Your chosen license]

## 📚 API Endpoints

| Endpoint       | Method | Description                                         |
|----------------|--------|-----------------------------------------------------|
| `/transcribe/` | POST   | Upload an audio file and get its transcription.     |
| `/summarize/`  | POST   | Summarize the transcribed text.                     |
| `/convert-to-notes/` | POST | Convert the transcribed text into detailed notes. |
| `/models`      | GET    | Retrieve the list of available LLM models.          |

