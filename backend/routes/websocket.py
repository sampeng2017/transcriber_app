from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
import json
import os
import requests
from ollama import chat, ResponseError
from ..config import DEFAULT_MODEL, logger

router = APIRouter()

@router.websocket("/chat")
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

async def stream_ollama_response(websocket: WebSocket, message: str, model: str, history: list) -> None:
    """Stream responses from the Ollama API to the WebSocket."""
    try:
        stream = chat(
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