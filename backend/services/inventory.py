from firebase_admin import firestore
from services.firestore_client import db

COLLECTION = "ingredients"


def _format_doc(doc):
    return {"ingredientId": doc.id, **doc.to_dict()}


def list_ingredients():
    docs = db.collection(COLLECTION).stream()
    return [_format_doc(doc) for doc in docs]


def get_ingredient(ingredient_id):
    doc = db.collection(COLLECTION).document(ingredient_id).get()
    return _format_doc(doc) if doc.exists else None


def create_ingredient(data):
    if "name" not in data or "amount" not in data or "unit" not in data:
        raise ValueError("name, amount, and unit are required")

    payload = {
        "name": data["name"],
        "amount": float(data["amount"]),
        "unit": data["unit"],
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }
    doc_ref = db.collection(COLLECTION).document()
    doc_ref.set(payload)
    _refresh_menu_availability()
    # Refetch to get actual timestamp instead of Sentinel
    return get_ingredient(doc_ref.id)


def update_ingredient(ingredient_id, data):
    doc_ref = db.collection(COLLECTION).document(ingredient_id)
    if not doc_ref.get().exists:
        return None

    patch_data = {}
    if "name" in data:
        patch_data["name"] = data["name"]
    if "amount" in data:
        patch_data["amount"] = float(data["amount"])
    if "unit" in data:
        patch_data["unit"] = data["unit"]
    if not patch_data:
        return _format_doc(doc_ref.get())

    patch_data["updatedAt"] = firestore.SERVER_TIMESTAMP
    doc_ref.update(patch_data)
    _refresh_menu_availability()
    return _format_doc(doc_ref.get())


def delete_ingredient(ingredient_id):
    doc_ref = db.collection(COLLECTION).document(ingredient_id)
    if not doc_ref.get().exists:
        return False
    doc_ref.delete()
    _refresh_menu_availability()
    return True


def adjust_ingredient_amount(ingredient_id, delta):
    doc_ref = db.collection(COLLECTION).document(ingredient_id)
    doc_ref.update(
        {
            "amount": firestore.Increment(delta),
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
    )
    _refresh_menu_availability()


def _refresh_menu_availability():
    try:
        from services.menu import refresh_menu_availability
        refresh_menu_availability()
    except Exception:
        pass
