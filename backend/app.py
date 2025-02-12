from fastapi import FastAPI, File, UploadFile, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import whisper
import ollama
from ollama._types import ResponseError
import os
import json
from typing import List
from .config import DEFAULT_MODEL
import httpx
import logging
import requests

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the frontend directory
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

# Serve index.html at root
@app.get("/")
async def read_root() -> FileResponse:
    """Serve the main chat HTML file."""
    return FileResponse("frontend/chat.html")

@app.get("/chat")
async def read_chat() -> FileResponse:
    """Serve the chat HTML file."""
    return FileResponse("frontend/chat.html")

@app.get("/transcribe")
async def read_transcribe() -> FileResponse:
    """Serve the transcription HTML file."""
    return FileResponse("frontend/transcribe.html")

# Load Whisper model
try:
    whisper_model = whisper.load_model("base")
except Exception as e:
    logger.error(f"Failed to load Whisper model: {str(e)}")
    raise RuntimeError(f"Failed to load Whisper model: {str(e)}")

# Ensure a temp folder exists
TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# Initialize an empty list for models
MODELS: List[str] = []

async def get_ollama_models() -> List[str]:
    """Fetch available models from the Ollama API."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags")
            response.raise_for_status()  # Raise an error for bad responses
            data = response.json()
            models = [model["name"] for model in data["models"]]
            logger.info(f"Retrieved models from Ollama: {models}")
            return models
    except Exception as e:
        logger.error(f"Error fetching Ollama models: {e}")
        return []

@app.on_event("startup")
async def startup_event() -> None:
    """Startup event to load models."""
    global MODELS
    MODELS = await get_ollama_models()
    if not MODELS:
        logger.warning("No Ollama models found. Falling back to default models.")
        MODELS.extend(["mistral:7b", "llama2:7b", "qwen2:7b"])
    logger.info(f"Models available at startup: {MODELS}")

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)) -> dict:
    """Transcribe audio file to text."""
    try:
        file_path = os.path.join(TEMP_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())

        if not os.path.exists(file_path):
            raise HTTPException(status_code=400, detail="Uploaded file not found.")
        
        result = whisper_model.transcribe(file_path)
        transcription = result["text"]
        os.remove(file_path)  # Clean up the temporary file

        return {"transcription": transcription}

    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/summarize/")
async def summarize_text(
    text: str = Form(...), 
    model: str = Form(DEFAULT_MODEL),
    prompt: str = Form("Please summarize this text concisely:\n\n")
) -> dict:
    """Summarize the provided text using the specified model."""
    try:
        response = ollama.chat(
            model=model,
            messages=[{"role": "user", "content": f"{prompt}{text}"}]
        )
        return {"summary": response["message"]["content"]}
    except ResponseError as e:
        logger.error(f"Ollama error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")
    except Exception as e:
        logger.error(f"Summarization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@app.post("/convert-to-notes/")
async def convert_to_notes(
    text: str = Form(...), 
    model: str = Form(DEFAULT_MODEL),
    prompt: str = Form(None)
) -> dict:
    """Convert the provided text into meeting notes."""
    if prompt is None:
        prompt = "Convert this transcript into detailed yet informal meeting notes..."
        
    try:
        response = ollama.chat(
            model=model,
            messages=[{"role": "user", "content": f"{prompt}\n\nTranscript:\n{text}"}]
        )
        return {"notes": response["message"]["content"]}
    except ResponseError as e:
        logger.error(f"Ollama error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")
    except Exception as e:
        logger.error(f"Notes conversion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Notes conversion failed: {str(e)}")

@app.get("/models")
async def get_models() -> JSONResponse:
    """Return the list of available models."""
    return JSONResponse(content={"models": MODELS})

@app.get("/api/config")
async def get_config() -> JSONResponse:
    """Return configuration details."""
    google_api_key = os.getenv("GOOGLE_API_KEY")
    search_engine_id = os.getenv("SEARCH_ENGINE_ID")
    return JSONResponse(content={
        "googleApiKey": google_api_key,
        "searchEngineId": search_engine_id,
        "defaultModel": DEFAULT_MODEL
    })

@app.websocket("/chat")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """Handle WebSocket connections for chat."""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            model = message_data.get("model", DEFAULT_MODEL)
            message = message_data.get("message", "").strip()
            history = message_data.get("history", [])
            use_search = message_data.get("useSearch", False)
            
            logger.info(f"Received message: {message}, use_search: {use_search}")

            if not message:
                await websocket.send_text(json.dumps({"error": "Empty message"}))
                continue

            if use_search:
                search_response = perform_search(message)
                search_results = format_search_results(search_response)
                prompt = f"merge, organize the search response string into a consolidated results, can you bullet list, and can list search sources if available.\n\n{search_results}"
                await stream_ollama_response(websocket, prompt, model, history)
            else:
                await stream_ollama_response(websocket, message, model, history)

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        await websocket.send_text(json.dumps({"error": f"Unexpected error: {str(e)}"}))
    finally:
        await websocket.close()

def perform_search(query: str) -> dict:
    """Perform a search using the Google Custom Search API."""
    google_api_key = os.getenv("GOOGLE_API_KEY")
    search_engine_id = os.getenv("SEARCH_ENGINE_ID")
    if not google_api_key or not search_engine_id:
        raise ValueError("Google API key and search engine ID must be set")
    
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": google_api_key,
        "cx": search_engine_id,
        "q": query,
        "num": 5
    }
    logger.info(f"Performing search with URL: {url} and params: {params}")
    response = requests.get(url, params=params)
    response.raise_for_status()
    logger.info(f"Search API response: {response.json()}")
    return response.json()

def format_search_results(search_response: dict) -> str:
    """Format search results into a readable string."""
    results = []
    for item in search_response.get('items', []):
        title = item.get('title')
        snippet = item.get('snippet')
        link = item.get('link')
        results.append(f"{title}\n{snippet}\n{link}\n")
    return "\n".join(results)

async def stream_ollama_response(websocket: WebSocket, message: str, model: str, history: List[dict]) -> None:
    """Stream responses from the Ollama API to the WebSocket."""
    try:
        stream = ollama.chat(
            model=model,
            messages=history + [{"role": "user", "content": message}],
            stream=True
        )

        for chunk in stream:
            if 'message' in chunk and 'content' in chunk['message']:
                await websocket.send_text(json.dumps({
                    "chunk": chunk['message']['content'],
                    "done": False
                }))

        await websocket.send_text(json.dumps({
            "chunk": "",
            "done": True
        }))

    except ResponseError as e:
        await websocket.send_text(json.dumps({
            "error": f"Ollama error: {str(e)}"
        }))
    except Exception as e:
        await websocket.send_text(json.dumps({
            "error": f"Processing error: {str(e)}"
        }))

# For development server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)