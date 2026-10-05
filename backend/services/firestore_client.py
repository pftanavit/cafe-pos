import os
import firebase_admin
from firebase_admin import credentials, firestore
from config import SERVICE_ACCOUNT_KEY_PATH

if not firebase_admin._apps:
    if not os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
        raise FileNotFoundError(
            f"Firebase service account key not found at {SERVICE_ACCOUNT_KEY_PATH}. "
            "Set FIREBASE_SERVICE_ACCOUNT_PATH or place serviceAccountKey.json in backend/."
        )
    cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
    firebase_admin.initialize_app(cred)

# Firestore client used by all service functions
db = firestore.client()
