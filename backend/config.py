import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure a temp folder exists
TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# Default model
DEFAULT_MODEL = "mistral:7b"

# CORS settings
CORS_ORIGINS = ["*"]
CORS_CREDENTIALS = True
CORS_METHODS = ["*"]
CORS_HEADERS = ["*"]