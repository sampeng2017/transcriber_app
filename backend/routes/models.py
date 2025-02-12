from fastapi import APIRouter
from starlette.responses import JSONResponse
from ..config import logger
import httpx

router = APIRouter()

MODELS = []

async def get_ollama_models() -> list:
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

@router.on_event("startup")
async def startup_event() -> None:
    """Startup event to load models."""
    global MODELS
    MODELS = await get_ollama_models()
    if not MODELS:
        logger.warning("No Ollama models found. Falling back to default models.")
        MODELS.extend(["mistral:7b", "llama2:7b", "qwen2:7b"])
    logger.info(f"Models available at startup: {MODELS}")

@router.get("/models")
async def get_models() -> JSONResponse:
    """Return the list of available models."""
    return JSONResponse(content={"models": MODELS})