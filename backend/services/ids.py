import re

from services.firestore_client import db


def next_sequential_id(collection_name, prefix, width=3):
    pattern = re.compile(rf"^{re.escape(prefix)}-(\d{{{width}}})$")
    highest = 0
    for doc in db.collection(collection_name).stream():
        match = pattern.match(doc.id)
        if match:
            highest = max(highest, int(match.group(1)))
    return f"{prefix}-{highest + 1:0{width}d}"


def next_subcollection_id(parent_ref, subcollection_name, prefix, width=3):
    pattern = re.compile(rf"^{re.escape(prefix)}-(\d{{{width}}})$")
    highest = 0
    for doc in parent_ref.collection(subcollection_name).stream():
        match = pattern.match(doc.id)
        if match:
            highest = max(highest, int(match.group(1)))
    return f"{prefix}-{highest + 1:0{width}d}"
