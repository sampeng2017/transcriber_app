from fastapi import APIRouter
from starlette.responses import JSONResponse
import os

router = APIRouter()

DEFAULT_MODEL = "llama3:8b"  # Define the DEFAULT_MODEL variable

@router.get("/api/config")
async def get_config() -> JSONResponse:
    """Return configuration details."""
    google_api_key = os.getenv("GOOGLE_API_KEY")
    search_engine_id = os.getenv("SEARCH_ENGINE_ID")
    return JSONResponse(content={
        "googleApiKey": google_api_key,
        "searchEngineId": search_engine_id,
        "defaultModel": DEFAULT_MODEL
    })