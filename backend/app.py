from fastapi import FastAPI, File, UploadFile, Form, HTTPException
import whisper
import ollama
import os

app = FastAPI()

# Load Whisper model
try:
    whisper_model = whisper.load_model("base")
except Exception as e:
    raise RuntimeError(f"Failed to load Whisper model: {str(e)}")

# Ensure a temp folder exists
TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# Available Ollama models (Modify if needed)
AVAILABLE_MODELS = ["mistral:7b", "gemma:2b", "qwen2:7b", "llama2:7b"]
DEFAULT_MODEL = "mistral:7b" if "mistral:7b" in AVAILABLE_MODELS else "gemma:2b"

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
async def summarize_text(text: str = Form(...)):
    try:
        # Ensure Ollama is running
        response = ollama.chat(model=DEFAULT_MODEL, messages=[{"role": "user", "content": f"Summarize this transcript:\n\n{text}"}])
        
        return {"summary": response["message"]["content"]}

    except ollama._types.ResponseError as e:
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

# Run the app with: uvicorn backend.app:app --reload