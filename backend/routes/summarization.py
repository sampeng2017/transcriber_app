from fastapi import APIRouter, Form, HTTPException
from ollama import chat, ResponseError
from ..config import DEFAULT_MODEL, logger

router = APIRouter()

@router.post("/summarize/")
async def summarize_text(
    text: str = Form(...), 
    model: str = Form(DEFAULT_MODEL),
    prompt: str = Form("Please summarize this text concisely:\n\n")
) -> dict:
    """Summarize the provided text using the specified model."""
    try:
        response = chat(
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

@router.post("/convert-to-notes/")
async def convert_to_notes(
    text: str = Form(...), 
    model: str = Form(DEFAULT_MODEL),
    prompt: str = Form(None)
) -> dict:
    """Convert the provided text into meeting notes."""
    if prompt is None:
        prompt = "Convert this transcript into detailed yet informal meeting notes..."
        
    try:
        response = chat(
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