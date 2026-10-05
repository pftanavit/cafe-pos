from firebase_admin import firestore
from services.firestore_client import db
from services.ids import next_sequential_id

COLLECTION = "users"
VALID_ROLES = {"admin", "employee", "customer"}


def list_users():
    docs = db.collection(COLLECTION).stream()
    return [{"uid": doc.id, **doc.to_dict()} for doc in docs]


def get_user(uid):
    doc = db.collection(COLLECTION).document(uid).get()
    return {"uid": doc.id, **doc.to_dict()} if doc.exists else None


def create_user(data):
    username = data.get("username", "").strip()
    if not username:
        raise ValueError("username is required")
    role = data.get("role", "customer")
    if role not in VALID_ROLES:
        raise ValueError("role must be admin, employee, or customer")
    uid = data.get("uid") or next_sequential_id(COLLECTION, "customer")

    existing = db.collection(COLLECTION).where("username", "==", username).limit(1).stream()
    if any(True for _ in existing):
        raise ValueError("username already exists")

    user = {
        "uid": uid,
        "username": username,
        "role": role,
        "createdAt": firestore.SERVER_TIMESTAMP,
    }
    db.collection(COLLECTION).document(uid).set(user)
    # Refetch to get actual timestamp instead of Sentinel
    return get_user(uid)


def update_user(uid, data):
    doc_ref = db.collection(COLLECTION).document(uid)
    if not doc_ref.get().exists:
        return None

    patch_data = {}
    if "username" in data:
        patch_data["username"] = data["username"]
    if "role" in data:
        patch_data["role"] = data["role"]
    if not patch_data:
        return get_user(uid)

    patch_data["updatedAt"] = firestore.SERVER_TIMESTAMP
    doc_ref.update(patch_data)
    return get_user(uid)


def delete_user(uid):
    doc_ref = db.collection(COLLECTION).document(uid)
    if not doc_ref.get().exists:
        return False
    doc_ref.delete()
    return True
