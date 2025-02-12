from fastapi import APIRouter, UploadFile, File, HTTPException
import os
from whisper import load_model
from ..config import TEMP_DIR, logger

router = APIRouter()

# Load Whisper model
try:
    whisper_model = load_model("base")
except Exception as e:
    logger.error(f"Failed to load Whisper model: {str(e)}")
    raise RuntimeError(f"Failed to load Whisper model: {str(e)}")

@router.post("/transcribe/")
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