from firebase_admin import firestore
from services.firestore_client import db
from services.menu import get_menu_item
from services.discount_codes import compute_discount_amount
from services.ids import next_sequential_id, next_subcollection_id

ORDER_COLLECTION = "orders"


def _format_doc(doc):
    return {"orderId": doc.id, **doc.to_dict()}


def _format_order_item_doc(doc):
    return {"itemId": doc.id, **doc.to_dict()}


def list_orders(status=None, customer_id=None):
    collection = db.collection(ORDER_COLLECTION)
    if status:
        collection = collection.where("status", "==", status)
    if customer_id:
        collection = collection.where("customerId", "==", customer_id)
    docs = collection.stream()
    orders = [_format_doc(doc) for doc in docs]
    if customer_id:
        orders.sort(key=lambda order: order.get("createdAt") or order.get("orderId"), reverse=True)
    return orders


def get_order(order_id, include_items=True):
    doc = db.collection(ORDER_COLLECTION).document(order_id).get()
    if not doc.exists:
        return None
    order = _format_doc(doc)
    if include_items:
        order["items"] = list_order_items(order_id)
    return order


def create_order(data):
    order_id = data.get("orderId") or next_sequential_id(ORDER_COLLECTION, "order")
    payload = {
        "orderId": order_id,
        "status": "unconfirmed",
        "employeeId": data["employeeId"],
        "customerId": data.get("customerId"),
        "discountCode": data.get("discountCode"),
        "discountAmount": None,
        "subtotal": 0.0,
        "totalPrice": 0.0,
        "isTakeaway": bool(data.get("isTakeaway", False)),
        "appearanceTags": data.get("appearanceTags", []),
        "notes": data.get("notes"),
        "customerReceived": False,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "startedAt": None,
        "completedAt": None,
    }
    doc_ref = db.collection(ORDER_COLLECTION).document(order_id)
    doc_ref.set(payload)
    # Refetch to get actual timestamp instead of Sentinel
    return get_order(order_id)


def update_order(order_id, data):
    doc_ref = db.collection(ORDER_COLLECTION).document(order_id)
    if not doc_ref.get().exists:
        return None
    patch_data = {}
    editable_fields = ["status", "employeeId", "customerId", "discountCode", "discountAmount", "subtotal", "totalPrice", "isTakeaway", "appearanceTags", "notes", "startedAt", "completedAt", "customerReceived"]
    for key in editable_fields:
        if key in data:
            patch_data[key] = data[key]
    if not patch_data:
        return _format_doc(doc_ref.get())
    patch_data["updatedAt"] = firestore.SERVER_TIMESTAMP
    doc_ref.update(patch_data)
    return get_order(order_id)


def delete_order(order_id):
    doc_ref = db.collection(ORDER_COLLECTION).document(order_id)
    if not doc_ref.get().exists:
        return False
    items_ref = doc_ref.collection("orderItems")
    for item_doc in items_ref.list_documents():
        item_doc.delete()
    doc_ref.delete()
    return True


def list_order_items(order_id):
    parent = db.collection(ORDER_COLLECTION).document(order_id)
    docs = parent.collection("orderItems").stream()
    return [_format_order_item_doc(doc) for doc in docs]


def get_order_item(order_id, item_id):
    doc = db.collection(ORDER_COLLECTION).document(order_id).collection("orderItems").document(item_id).get()
    return _format_order_item_doc(doc) if doc.exists else None


def resolve_item_price(base_price, customizations):
    for choice in (customizations or {}).values():
        if choice.get("overridePrice") is not None:
            return float(choice["overridePrice"])
    total_markup = sum(
        float(choice.get("priceMarkup") or 0)
        for choice in (customizations or {}).values()
        if choice.get("type") == "customizable_options"
    )
    return float(base_price) + total_markup


def _slot_label(slot):
    return slot.get("label") or slot.get("ingredientName") or "Customization"


def _default_customizations(menu_item, customizations):
    result = dict(customizations or {})
    for slot in menu_item.get("ingredientSlots", []):
        label = _slot_label(slot)
        if slot.get("type") == "customizable_amount" and label not in result:
            levels = slot.get("levels", [])
            if levels:
                index = int(slot.get("defaultLevelIndex") or 0)
                level = levels[min(max(index, 0), len(levels) - 1)]
                result[label] = {
                    "type": "customizable_amount",
                    "ingredientId": slot.get("ingredientId"),
                    "ingredientName": slot.get("ingredientName"),
                    "chosenLabel": level.get("label"),
                    "chosenAmount": float(level.get("amount") or 0),
                    "unit": slot.get("unit"),
                }
        elif slot.get("type") == "customizable_options" and label not in result:
            options = slot.get("options", [])
            chosen = next((option for option in options if option.get("isDefault")), options[0] if options else None)
            if chosen:
                result[label] = {
                    "type": "customizable_options",
                    "chosenIngredientId": chosen.get("ingredientId"),
                    "chosenIngredientName": chosen.get("ingredientName"),
                    "chosenAmount": float(chosen.get("amount") or 0),
                    "unit": chosen.get("unit"),
                    "priceMarkup": chosen.get("priceMarkup"),
                    "overridePrice": chosen.get("overridePrice"),
                }
    return result


def _order_status(order_ref):
    doc = order_ref.get()
    if not doc.exists:
        raise ValueError("Order not found")
    return doc.to_dict().get("status")


def _calculate_subtotal(order_id):
    total = 0.0
    for item in list_order_items(order_id):
        total += resolve_item_price(item.get("basePrice", 0), item.get("customizations", {}))
    return total


def _recalculate_unconfirmed_order(order_id):
    order_ref = db.collection(ORDER_COLLECTION).document(order_id)
    order_doc = order_ref.get()
    if not order_doc.exists:
        return
    order = order_doc.to_dict()
    if order.get("status") != "unconfirmed":
        return
    subtotal = _calculate_subtotal(order_id)
    discount_amount = 0.0
    if order.get("discountCode"):
        discount_doc = db.collection("discountCodes").document(order["discountCode"]).get()
        if discount_doc.exists:
            discount_amount = compute_discount_amount(subtotal, discount_doc.to_dict())
    order_ref.update({
        "subtotal": subtotal,
        "discountAmount": discount_amount if order.get("discountCode") else order.get("discountAmount"),
        "totalPrice": max(subtotal - discount_amount, 0.0),
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })


def create_order_item(order_id, data):
    order_ref = db.collection(ORDER_COLLECTION).document(order_id)
    if _order_status(order_ref) != "unconfirmed":
        raise ValueError("Order items can only be changed while the order is unconfirmed")
    if "menuItemId" not in data:
        raise ValueError("menuItemId is required")

    menu_item = get_menu_item(data["menuItemId"])
    if not menu_item:
        raise ValueError("Menu item not found")

    customizations = _default_customizations(menu_item, data.get("customizations", {}))
    item_price = resolve_item_price(menu_item["basePrice"], customizations)
    payload = {
        "menuItemId": data["menuItemId"],
        "menuItemName": menu_item["name"],
        "recipeSnapshot": menu_item.get("recipe", ""),
        "basePrice": float(menu_item["basePrice"]),
        "itemPrice": item_price,
        "customizations": customizations,
        "ingredientSlots": menu_item.get("ingredientSlots", []),
        "createdAt": firestore.SERVER_TIMESTAMP,
    }
    item_id = next_subcollection_id(order_ref, "orderItems", "item")
    item_ref = order_ref.collection("orderItems").document(item_id)
    item_ref.set(payload)
    _recalculate_unconfirmed_order(order_id)
    # Refetch to get actual timestamp instead of Sentinel
    return get_order_item(order_id, item_id)


def update_order_item(order_id, item_id, data):
    order_ref = db.collection(ORDER_COLLECTION).document(order_id)
    if _order_status(order_ref) != "unconfirmed":
        raise ValueError("Order items can only be changed while the order is unconfirmed")
    item_ref = db.collection(ORDER_COLLECTION).document(order_id).collection("orderItems").document(item_id)
    existing = item_ref.get()
    if not existing.exists:
        return None
    payload = existing.to_dict()
    patch_data = {}
    if "menuItemId" in data and data["menuItemId"] != payload.get("menuItemId"):
        menu_item = get_menu_item(data["menuItemId"])
        if not menu_item:
            raise ValueError("Menu item not found")
        patch_data["menuItemId"] = data["menuItemId"]
        patch_data["menuItemName"] = menu_item["name"]
        patch_data["recipeSnapshot"] = menu_item.get("recipe", "")
        patch_data["basePrice"] = float(menu_item["basePrice"])
        patch_data["ingredientSlots"] = menu_item.get("ingredientSlots", [])
    if "customizations" in data:
        patch_data["customizations"] = data["customizations"]
    if "itemPrice" in data:
        patch_data["itemPrice"] = float(data["itemPrice"])

    if patch_data:
        if "customizations" in patch_data or "basePrice" in patch_data:
            base_price = float(patch_data.get("basePrice", payload["basePrice"]))
            menu_item = get_menu_item(patch_data.get("menuItemId", payload.get("menuItemId")))
            customizations = _default_customizations(menu_item, patch_data.get("customizations", payload.get("customizations", {})))
            patch_data["customizations"] = customizations
            patch_data["itemPrice"] = resolve_item_price(base_price, customizations)
        item_ref.update(patch_data)

    _recalculate_unconfirmed_order(order_id)
    return _format_order_item_doc(item_ref.get())


def delete_order_item(order_id, item_id):
    order_ref = db.collection(ORDER_COLLECTION).document(order_id)
    if _order_status(order_ref) != "unconfirmed":
        raise ValueError("Order items can only be changed while the order is unconfirmed")
    item_ref = db.collection(ORDER_COLLECTION).document(order_id).collection("orderItems").document(item_id)
    if not item_ref.get().exists:
        return False
    item_ref.delete()
    _recalculate_unconfirmed_order(order_id)
    return True


def _build_inventory_changes(order_item):
    changes = []
    customizations = order_item.get("customizations", {})
    for slot in order_item.get("ingredientSlots", []):
        slot_type = slot.get("type")
        if slot_type == "normal":
            ingredient_id = slot.get("ingredientId")
            quantity = float(slot.get("amount", 0))
            if ingredient_id:
                changes.append((ingredient_id, quantity))
        elif slot_type == "customizable_amount":
            chosen = customizations.get(_slot_label(slot))
            if chosen:
                ingredient_id = chosen.get("ingredientId")
                quantity = float(chosen.get("chosenAmount", 0))
                if ingredient_id:
                    changes.append((ingredient_id, quantity))
        elif slot_type == "customizable_options":
            chosen = customizations.get(_slot_label(slot))
            if chosen:
                ingredient_id = chosen.get("chosenIngredientId")
                quantity = float(chosen.get("chosenAmount", 0))
                if ingredient_id:
                    changes.append((ingredient_id, quantity))
    return changes


def _collect_inventory_changes(order_id):
    changes = {}
    order_ref = db.collection(ORDER_COLLECTION).document(order_id)
    for item_doc in order_ref.collection("orderItems").stream():
        item = item_doc.to_dict()
        for ingredient_id, quantity in _build_inventory_changes(item):
            changes[ingredient_id] = changes.get(ingredient_id, 0.0) + quantity
    return changes


def confirm_order(order_id):
    order_ref = db.collection(ORDER_COLLECTION).document(order_id)
    order_doc = order_ref.get()
    if not order_doc.exists:
        return {"error": "Order not found"}
    order_data = order_doc.to_dict()
    if order_data.get("status") != "unconfirmed":
        return {"error": "Only unconfirmed orders can be confirmed"}

    item_docs = list(order_ref.collection("orderItems").stream())
    if not item_docs:
        return {"error": "Order must contain at least one item"}

    batch = db.batch()
    subtotal = 0.0
    for item_doc in item_docs:
        item = item_doc.to_dict()
        item_price = resolve_item_price(item["basePrice"], item.get("customizations", {}))
        subtotal += item_price
        batch.update(item_doc.reference, {"itemPrice": item_price})

    discount_amount = 0.0
    if order_data.get("discountCode"):
        discount_ref = db.collection("discountCodes").document(order_data["discountCode"])
        discount_doc = discount_ref.get()
        if not discount_doc.exists:
            return {"error": "Discount code not found"}
        discount_data = discount_doc.to_dict()
        if discount_data.get("used") and discount_data.get("usedInOrderId") != order_id:
            return {"error": "Discount code already redeemed"}
        discount_amount = compute_discount_amount(subtotal, discount_data)

    total_price = max(subtotal - discount_amount, 0.0)
    inventory_changes = _collect_inventory_changes(order_id)
    for ingredient_id, quantity in inventory_changes.items():
        ingredient_doc = db.collection("ingredients").document(ingredient_id).get()
        if not ingredient_doc.exists:
            return {"error": f"Ingredient {ingredient_id} not found"}
        ingredient = ingredient_doc.to_dict()
        current = float(ingredient.get("amount") or 0)
        if current < quantity:
            name = ingredient.get("name", ingredient_id)
            unit = ingredient.get("unit", "")
            return {"error": f"Insufficient stock: {name} needs {quantity}{unit}, only {current}{unit} remaining"}
    for ingredient_id, quantity in inventory_changes.items():
        ingredient_ref = db.collection("ingredients").document(ingredient_id)
        batch.update(
            ingredient_ref,
            {
                "amount": firestore.Increment(-quantity),
                "updatedAt": firestore.SERVER_TIMESTAMP,
            },
        )

    order_patch = {
        "status": "on_queue",
        "subtotal": subtotal,
        "totalPrice": total_price,
        "discountAmount": discount_amount,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }
    batch.update(order_ref, order_patch)
    batch.commit()
    _refresh_menu_availability()
    # Refetch to get actual timestamps instead of Sentinel
    return get_order(order_id)


def start_order(order_id):
    order_ref = db.collection(ORDER_COLLECTION).document(order_id)
    order_doc = order_ref.get()
    if not order_doc.exists:
        return {"error": "Order not found"}
    order_data = order_doc.to_dict()
    if order_data.get("status") != "on_queue":
        return {"error": "Only orders with status on_queue can be started"}

    order_ref.update(
        {
            "status": "ongoing",
            "startedAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
    )
    return get_order(order_id)


def complete_order(order_id):
    order_ref = db.collection(ORDER_COLLECTION).document(order_id)
    order_doc = order_ref.get()
    if not order_doc.exists:
        return {"error": "Order not found"}
    order_data = order_doc.to_dict()
    if order_data.get("status") not in ["on_queue", "ongoing"]:
        return {"error": "Only active orders can be completed"}

    order_ref.update(
        {
            "status": "completed",
            "completedAt": firestore.SERVER_TIMESTAMP,
            "customerReceived": False,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
    )
    return get_order(order_id)


def cancel_order(order_id):
    order_ref = db.collection(ORDER_COLLECTION).document(order_id)
    order_doc = order_ref.get()
    if not order_doc.exists:
        return {"error": "Order not found"}
    order_data = order_doc.to_dict()
    if order_data.get("status") not in ["on_queue", "ongoing"]:
        return {"error": "Only on_queue or ongoing orders can be canceled"}

    batch = db.batch()
    inventory_changes = _collect_inventory_changes(order_id)
    for ingredient_id, quantity in inventory_changes.items():
        ingredient_ref = db.collection("ingredients").document(ingredient_id)
        batch.update(
            ingredient_ref,
            {
                "amount": firestore.Increment(quantity),
                "updatedAt": firestore.SERVER_TIMESTAMP,
            },
        )
    batch.update(
        order_ref,
        {
            "status": "canceled",
            "completedAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        },
    )
    batch.commit()
    _refresh_menu_availability()
    return get_order(order_id)


def receive_order(order_id):
    order_ref = db.collection(ORDER_COLLECTION).document(order_id)
    order_doc = order_ref.get()
    if not order_doc.exists:
        return {"error": "Order not found"}
    order_data = order_doc.to_dict()
    if order_data.get("status") != "completed":
        return {"error": "Only completed orders can be received"}
    order_ref.update({"customerReceived": True, "updatedAt": firestore.SERVER_TIMESTAMP})
    return get_order(order_id)


def apply_discount_to_order(order_id, code):
    from services.discount_codes import validate_and_apply_discount_code
    return validate_and_apply_discount_code(order_id, code)


def sort_queue(orders):
    def sort_key(order):
        is_ongoing = 0 if order.get("status") == "ongoing" else 1
        is_takeaway = 0 if order.get("isTakeaway") else 1
        created_at = order.get("createdAt")
        return (is_ongoing, is_takeaway, created_at)

    return sorted(orders, key=sort_key)


def get_queue():
    active_orders = list_orders()
    active = [order for order in active_orders if order.get("status") in ["on_queue", "ongoing"]]
    queue = sort_queue(active)
    for order in queue:
        items = list_order_items(order["orderId"])
        order["items"] = items
        order["itemNames"] = [item.get("menuItemName") for item in items]
    return queue


def _refresh_menu_availability():
    try:
        from services.menu import refresh_menu_availability
        refresh_menu_availability()
    except Exception:
        pass
