import random
import string

from firebase_admin import firestore
from services.firestore_client import db

COLLECTION = "discountCodes"


def _format_doc(doc):
    return {"code": doc.id, **doc.to_dict()}


def list_discount_codes():
    docs = db.collection(COLLECTION).stream()
    return [_format_doc(doc) for doc in docs]


def get_discount_code(code):
    doc = db.collection(COLLECTION).document(code).get()
    return _format_doc(doc) if doc.exists else None


def create_discount_code(data):
    if "code" not in data or "type" not in data or "value" not in data:
        raise ValueError("code, type, and value are required")

    payload = {
        "type": data["type"],
        "value": float(data["value"]),
        "used": bool(data.get("used", False)),
        "usedInOrderId": data.get("usedInOrderId"),
        "createdAt": firestore.SERVER_TIMESTAMP,
    }
    doc_ref = db.collection(COLLECTION).document(data["code"])
    doc_ref.set(payload)
    # Refetch to get actual timestamp instead of Sentinel
    return get_discount_code(data["code"])


def generate_discount_code(data=None):
    data = data or {}
    code_type = data.get("type", "fixed")
    value = float(data.get("value", 20.0))
    alphabet = string.ascii_uppercase + string.digits
    for _ in range(50):
        prefix = "".join(random.choice(alphabet) for _ in range(3))
        checksum = alphabet[sum(alphabet.index(char) for char in prefix) % len(alphabet)]
        code = f"DISC-{prefix}{checksum}"
        if not db.collection(COLLECTION).document(code).get().exists:
            return create_discount_code({"code": code, "type": code_type, "value": value})
    raise ValueError("Could not generate a unique discount code")


def update_discount_code(code, data):
    doc_ref = db.collection(COLLECTION).document(code)
    if not doc_ref.get().exists:
        return None

    patch_data = {}
    if "type" in data:
        patch_data["type"] = data["type"]
    if "value" in data:
        patch_data["value"] = float(data["value"])
    if "used" in data:
        patch_data["used"] = bool(data["used"])
    if "usedInOrderId" in data:
        patch_data["usedInOrderId"] = data["usedInOrderId"]
    if not patch_data:
        return _format_doc(doc_ref.get())

    patch_data["updatedAt"] = firestore.SERVER_TIMESTAMP
    doc_ref.update(patch_data)
    return _format_doc(doc_ref.get())


def delete_discount_code(code):
    doc_ref = db.collection(COLLECTION).document(code)
    if not doc_ref.get().exists:
        return False
    doc_ref.delete()
    return True


def compute_discount_amount(subtotal, discount_data):
    if not discount_data:
        return 0.0
    if discount_data.get("type") == "percentage":
        return round(subtotal * float(discount_data.get("value", 0.0)) / 100.0, 2)
    if discount_data.get("type") == "fixed":
        return min(subtotal, float(discount_data.get("value", 0.0)))
    return 0.0


def validate_and_apply_discount_code(order_id, code):
    order_ref = db.collection("orders").document(order_id)
    order_doc = order_ref.get()
    if not order_doc.exists:
        return {"error": "Order not found"}

    discount_ref = db.collection(COLLECTION).document(code)
    discount_doc = discount_ref.get()
    if not discount_doc.exists:
        return {"error": "Discount code not found"}

    discount_data = discount_doc.to_dict()
    if discount_data.get("used") and discount_data.get("usedInOrderId") != order_id:
        return {"error": "Discount code already redeemed"}

    order_data = order_doc.to_dict()
    if order_data.get("status") != "unconfirmed":
        return {"error": "Discount codes can only be applied to unconfirmed orders"}
    subtotal = _calculate_order_subtotal(order_id)
    discount_amount = compute_discount_amount(subtotal, discount_data)
    total_price = max(subtotal - discount_amount, 0.0)

    transaction = db.transaction()

    @firestore.transactional
    def apply(transaction, order_ref, discount_ref):
        discount_snapshot = discount_ref.get(transaction=transaction)
        discount_snapshot_data = discount_snapshot.to_dict()
        if discount_snapshot_data.get("used") and discount_snapshot_data.get("usedInOrderId") != order_id:
            raise ValueError("Discount code already redeemed")
        transaction.update(discount_ref, {"used": True, "usedInOrderId": order_id, "updatedAt": firestore.SERVER_TIMESTAMP})
        transaction.update(order_ref, {"discountCode": code, "subtotal": subtotal, "discountAmount": discount_amount, "totalPrice": total_price, "updatedAt": firestore.SERVER_TIMESTAMP})

    try:
        apply(transaction, order_ref, discount_ref)
    except ValueError as exc:
        return {"error": str(exc)}

    return {"orderId": order_id, "discountCode": code, "subtotal": subtotal, "discountAmount": discount_amount, "totalPrice": total_price}


def _calculate_order_subtotal(order_id):
    from services.orders import list_order_items, resolve_item_price
    total = 0.0
    for item in list_order_items(order_id):
        total += resolve_item_price(item.get("basePrice", 0), item.get("customizations", {}))
    return total
