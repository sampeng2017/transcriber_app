from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from .config import logger, TEMP_DIR, CORS_ORIGINS, CORS_CREDENTIALS, CORS_METHODS, CORS_HEADERS
from .routes import transcription, summarization, models, config, websocket

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_CREDENTIALS,
    allow_methods=CORS_METHODS,
    allow_headers=CORS_HEADERS,
)

# Mount the frontend directory
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

# Include routes
app.include_router(transcription.router)
app.include_router(summarization.router)
app.include_router(models.router)
app.include_router(config.router)
app.include_router(websocket.router)

# Serve chat.html
@app.get("/chat", response_class=HTMLResponse)
async def get_chat():
    with open("frontend/chat.html") as f:
        return HTMLResponse(content=f.read())

# Serve transcribe.html
@app.get("/transcribe", response_class=HTMLResponse)
async def get_transcribe():
    with open("frontend/transcribe.html") as f:
        return HTMLResponse(content=f.read())

# For development server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)