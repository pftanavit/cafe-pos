"""
Utility functions for handling Firestore Sentinel values and JSON serialization
"""

import json
from datetime import datetime
from firebase_admin import firestore


def convert_sentinel_to_none(obj):
    """
    Recursively convert Firestore Sentinel values to None for JSON serialization.
    Firestore SERVER_TIMESTAMP is a Sentinel that cannot be JSON serialized.
    """
    if isinstance(obj, dict):
        return {k: convert_sentinel_to_none(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_sentinel_to_none(item) for item in obj]
    elif isinstance(obj, firestore.Sentinel):
        # Replace Sentinel values with ISO format timestamp placeholder
        return datetime.utcnow().isoformat() + "Z"
    else:
        return obj


def serialize_firestore_doc(doc_dict):
    """
    Serialize a Firestore document dictionary for JSON, handling Sentinel and Timestamp objects.
    """
    if isinstance(doc_dict, dict):
        result = {}
        for key, value in doc_dict.items():
            result[key] = serialize_firestore_doc(value)
        return result
    elif isinstance(doc_dict, list):
        return [serialize_firestore_doc(item) for item in doc_dict]
    elif isinstance(doc_dict, firestore.Sentinel):
        # Replace Sentinel with current timestamp
        return datetime.utcnow().isoformat() + "Z"
    elif hasattr(doc_dict, 'isoformat'):
        # Handle datetime objects
        return doc_dict.isoformat() if hasattr(doc_dict, 'isoformat') else str(doc_dict)
    else:
        return doc_dict
