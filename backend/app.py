from fastapi import FastAPI, File, UploadFile, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import whisper
import ollama
from ollama._types import ResponseError
import os
import json
from typing import List

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
async def read_root():
    return FileResponse("frontend/chat.html")

@app.get("/chat")
async def read_chat():
    return FileResponse("frontend/chat.html")

@app.get("/transcribe")
async def read_transcribe():
    return FileResponse("frontend/transcribe.html")

# Load Whisper model
try:
    whisper_model = whisper.load_model("base")
except Exception as e:
    raise RuntimeError(f"Failed to load Whisper model: {str(e)}")

# Ensure a temp folder exists
TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# Available Ollama models
AVAILABLE_MODELS = ["mistral:7b", "qwen2:7b"]
DEFAULT_MODEL = "llama3:8b"

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        # Save uploaded file
        file_path = os.path.join(TEMP_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Transcribe audio to text
        if not os.path.exists(file_path):
            raise HTTPException(status_code=400, detail="Uploaded file not found.")
        
        result = whisper_model.transcribe(file_path)
        transcription = result["text"]

        # Remove temporary file after processing
        os.remove(file_path)

        return {"transcription": transcription}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/summarize/")
async def summarize_text(
    text: str = Form(...), 
    model: str = Form(DEFAULT_MODEL),
    prompt: str = Form("Please summarize this text concisely:\n\n")
):
    try:
        response = ollama.chat(
            model=model,
            messages=[{
                "role": "user", 
                "content": f"{prompt}{text}"
            }]
        )
        return {"summary": response["message"]["content"]}
    except ResponseError as e:
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@app.post("/convert-to-notes/")
async def convert_to_notes(
    text: str = Form(...), 
    model: str = Form(DEFAULT_MODEL),
    prompt: str = Form(None)
):
    try:
        if prompt is None:
            prompt = """Convert this transcript into detailed yet informal meeting notes..."""  # Your existing default prompt
            
        response = ollama.chat(
            model=model,
            messages=[{
                "role": "user", 
                "content": f"{prompt}\n\nTranscript:\n{text}"
            }]
        )
        return {"notes": response["message"]["content"]}
    except ResponseError as e:
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notes conversion failed: {str(e)}")

@app.get("/models")
async def get_models():
    return {
        "models": [
            "llama3:8b",
            "qwen2.5:7b",
            "qwen2:7b",
            "mistral:7b"
        ]
    }

@app.websocket("/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "error": "Invalid JSON format"
                }))
                continue
            
            # Extract message data
            model = message_data.get("model", DEFAULT_MODEL)
            message = message_data.get("message", "").strip()
            history = message_data.get("history", [])
            
            if not message:
                await websocket.send_text(json.dumps({
                    "error": "Empty message"
                }))
                continue

            # Stream the response from Ollama
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

                # Send completion message
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

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({
                "error": f"Unexpected error: {str(e)}"
            }))
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass

# For development server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)