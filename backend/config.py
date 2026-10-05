import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

SERVICE_ACCOUNT_KEY_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
if not SERVICE_ACCOUNT_KEY_PATH:
    SERVICE_ACCOUNT_KEY_PATH = str(BASE_DIR / "serviceAccountKey.json")
else:
    SERVICE_ACCOUNT_KEY_PATH = str(Path(SERVICE_ACCOUNT_KEY_PATH).resolve())

# Optional Firebase project settings
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
FIRESTORE_EMULATOR_HOST = os.getenv("FIRESTORE_EMULATOR_HOST")
