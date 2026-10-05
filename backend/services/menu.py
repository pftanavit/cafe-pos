from firebase_admin import firestore

from services.firestore_client import db

COLLECTION = "menuItems"


def _format_doc(doc):
    data = doc.to_dict()
    return {"menuItemId": doc.id, **data}


def _ingredient_amounts():
    amounts = {}
    for doc in db.collection("ingredients").stream():
        data = doc.to_dict()
        amounts[doc.id] = float(data.get("amount") or 0)
    return amounts


def is_menu_item_available(menu_item, amounts=None):
    amounts = amounts if amounts is not None else _ingredient_amounts()
    for slot in menu_item.get("ingredientSlots", []):
        slot_type = slot.get("type")
        if slot_type == "normal":
            if amounts.get(slot.get("ingredientId"), 0) < float(slot.get("amount") or 0):
                return False
        elif slot_type == "customizable_amount":
            largest = max([float(level.get("amount") or 0) for level in slot.get("levels", [])] or [0])
            if amounts.get(slot.get("ingredientId"), 0) < largest:
                return False
        elif slot_type == "customizable_options":
            has_available_option = any(
                amounts.get(option.get("ingredientId"), 0) >= float(option.get("amount") or 0)
                for option in slot.get("options", [])
            )
            if not has_available_option:
                return False
        else:
            return False
    return True


def _normalize_slot(slot):
    slot_type = slot.get("type")
    if slot_type not in {"normal", "customizable_amount", "customizable_options"}:
        raise ValueError("ingredient slot type must be normal, customizable_amount, or customizable_options")

    if slot_type == "normal":
        ingredient_id = slot.get("ingredientId")
        if not ingredient_id:
            raise ValueError("normal ingredient slots require ingredientId")
        ingredient = db.collection("ingredients").document(ingredient_id).get()
        if not ingredient.exists:
            raise ValueError(f"Ingredient {ingredient_id} not found")
        ingredient_data = ingredient.to_dict()
        return {
            "type": "normal",
            "ingredientId": ingredient_id,
            "ingredientName": ingredient_data.get("name"),
            "amount": float(slot.get("amount") or 0),
            "unit": slot.get("unit") or ingredient_data.get("unit"),
        }

    if slot_type == "customizable_amount":
        ingredient_id = slot.get("ingredientId")
        if not ingredient_id:
            raise ValueError("customizable amount slots require ingredientId")
        ingredient = db.collection("ingredients").document(ingredient_id).get()
        if not ingredient.exists:
            raise ValueError(f"Ingredient {ingredient_id} not found")
        ingredient_data = ingredient.to_dict()
        levels = [
            {"label": level.get("label", "").strip(), "amount": float(level.get("amount") or 0)}
            for level in slot.get("levels", [])
            if level.get("label", "").strip()
        ]
        if not levels:
            raise ValueError("customizable amount slots require at least one level")
        default_index = int(slot.get("defaultLevelIndex") or 0)
        return {
            "type": "customizable_amount",
            "label": slot.get("label") or ingredient_data.get("name"),
            "ingredientId": ingredient_id,
            "ingredientName": ingredient_data.get("name"),
            "unit": slot.get("unit") or ingredient_data.get("unit"),
            "defaultLevelIndex": min(max(default_index, 0), len(levels) - 1),
            "levels": levels,
        }

    options = []
    for index, option in enumerate(slot.get("options", [])):
        ingredient_id = option.get("ingredientId")
        if not ingredient_id:
            raise ValueError("customizable option entries require ingredientId")
        ingredient = db.collection("ingredients").document(ingredient_id).get()
        if not ingredient.exists:
            raise ValueError(f"Ingredient {ingredient_id} not found")
        ingredient_data = ingredient.to_dict()
        override_price = option.get("overridePrice")
        price_markup = option.get("priceMarkup")
        options.append(
            {
                "ingredientId": ingredient_id,
                "ingredientName": option.get("ingredientName") or ingredient_data.get("name"),
                "amount": float(option.get("amount") or 0),
                "unit": option.get("unit") or ingredient_data.get("unit"),
                "isDefault": bool(option.get("isDefault", index == 0)),
                "priceMarkup": None if price_markup in ("", None) else float(price_markup),
                "overridePrice": None if override_price in ("", None) else float(override_price),
            }
        )
    if not options:
        raise ValueError("customizable option slots require at least one option")
    if not any(option["isDefault"] for option in options):
        options[0]["isDefault"] = True
    default_seen = False
    for option in options:
        if option["isDefault"] and not default_seen:
            default_seen = True
        elif option["isDefault"]:
            option["isDefault"] = False
    return {
        "type": "customizable_options",
        "label": slot.get("label") or "Options",
        "options": options,
    }


def _normalize_menu_payload(data, existing=None):
    payload = {}
    source = existing or {}
    if "name" in data:
        name = data["name"].strip()
        if not name:
            raise ValueError("name is required")
        payload["name"] = name
    elif not existing:
        raise ValueError("name is required")

    if "recipe" in data:
        payload["recipe"] = data.get("recipe", "")
    elif not existing:
        payload["recipe"] = ""

    if "basePrice" in data:
        payload["basePrice"] = float(data["basePrice"])
    elif not existing:
        raise ValueError("basePrice is required")

    if "ingredientSlots" in data:
        payload["ingredientSlots"] = [_normalize_slot(slot) for slot in data.get("ingredientSlots", [])]
    elif not existing:
        payload["ingredientSlots"] = []

    if "imageUrl" in data:
        payload["imageUrl"] = data.get("imageUrl") or None

    availability_doc = {**source, **payload}
    payload["isAvailable"] = is_menu_item_available(availability_doc)
    payload["updatedAt"] = firestore.SERVER_TIMESTAMP
    return payload


def list_menu_items():
    amounts = _ingredient_amounts()
    docs = list(db.collection(COLLECTION).stream())
    items = []
    batch = db.batch()
    needs_commit = False
    for doc in docs:
        item = _format_doc(doc)
        available = is_menu_item_available(item, amounts)
        item["isAvailable"] = available
        items.append(item)
        if doc.to_dict().get("isAvailable") != available:
            batch.update(doc.reference, {"isAvailable": available, "updatedAt": firestore.SERVER_TIMESTAMP})
            needs_commit = True
    if needs_commit:
        batch.commit()
    return items


def refresh_menu_availability():
    list_menu_items()


def get_menu_item(menu_item_id):
    doc = db.collection(COLLECTION).document(menu_item_id).get()
    if not doc.exists:
        return None
    item = _format_doc(doc)
    item["isAvailable"] = is_menu_item_available(item)
    return item


def create_menu_item(data):
    payload = _normalize_menu_payload(data)
    doc_ref = db.collection(COLLECTION).document()
    doc_ref.set(payload)
    return get_menu_item(doc_ref.id)


def update_menu_item(menu_item_id, data):
    doc_ref = db.collection(COLLECTION).document(menu_item_id)
    existing_doc = doc_ref.get()
    if not existing_doc.exists:
        return None
    patch_data = _normalize_menu_payload(data, existing_doc.to_dict())
    doc_ref.update(patch_data)
    return get_menu_item(menu_item_id)


def delete_menu_item(menu_item_id):
    doc_ref = db.collection(COLLECTION).document(menu_item_id)
    if not doc_ref.get().exists:
        return False
    doc_ref.delete()
    return True
