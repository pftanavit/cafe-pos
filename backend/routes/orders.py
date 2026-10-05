from flask import Blueprint, request, jsonify
from services.orders import (
    list_orders,
    get_order,
    create_order,
    update_order,
    delete_order,
    list_order_items,
    get_order_item,
    create_order_item,
    update_order_item,
    delete_order_item,
    confirm_order,
    start_order,
    complete_order,
    cancel_order,
    receive_order,
    apply_discount_to_order,
    get_queue,
)

orders_bp = Blueprint("orders", __name__)

@orders_bp.route("", methods=["GET"])
def list_orders_route():
    status = request.args.get("status")
    customer_id = request.args.get("customerId")
    return jsonify(list_orders(status=status, customer_id=customer_id))

@orders_bp.route("/<order_id>", methods=["GET"])
def get_order_route(order_id):
    order = get_order(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    return jsonify(order)

@orders_bp.route("", methods=["POST"])
def create_order_route():
    payload = request.get_json(force=True)
    order = create_order(payload)
    return jsonify(order), 201

@orders_bp.route("/<order_id>", methods=["PATCH"])
def update_order_route(order_id):
    payload = request.get_json(force=True)
    order = update_order(order_id, payload)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    return jsonify(order)

@orders_bp.route("/<order_id>", methods=["DELETE"])
def delete_order_route(order_id):
    deleted = delete_order(order_id)
    if not deleted:
        return jsonify({"error": "Order not found"}), 404
    return jsonify({"success": True})

@orders_bp.route("/<order_id>/items", methods=["GET"])
def list_order_items_route(order_id):
    return jsonify(list_order_items(order_id))

@orders_bp.route("/<order_id>/items/<item_id>", methods=["GET"])
def get_order_item_route(order_id, item_id):
    item = get_order_item(order_id, item_id)
    if not item:
        return jsonify({"error": "Order item not found"}), 404
    return jsonify(item)

@orders_bp.route("/<order_id>/items", methods=["POST"])
def create_order_item_route(order_id):
    payload = request.get_json(force=True)
    item = create_order_item(order_id, payload)
    return jsonify(item), 201

@orders_bp.route("/<order_id>/items/<item_id>", methods=["PATCH"])
def update_order_item_route(order_id, item_id):
    payload = request.get_json(force=True)
    item = update_order_item(order_id, item_id, payload)
    if not item:
        return jsonify({"error": "Order item not found"}), 404
    return jsonify(item)

@orders_bp.route("/<order_id>/items/<item_id>", methods=["DELETE"])
def delete_order_item_route(order_id, item_id):
    deleted = delete_order_item(order_id, item_id)
    if not deleted:
        return jsonify({"error": "Order item not found"}), 404
    return jsonify({"success": True})

@orders_bp.route("/<order_id>/confirm", methods=["PATCH", "POST"])
def confirm_order_route(order_id):
    result = confirm_order(order_id)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)

@orders_bp.route("/<order_id>/start", methods=["PATCH", "POST"])
def start_order_route(order_id):
    result = start_order(order_id)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)

@orders_bp.route("/<order_id>/complete", methods=["PATCH", "POST"])
def complete_order_route(order_id):
    result = complete_order(order_id)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)

@orders_bp.route("/<order_id>/cancel", methods=["PATCH", "POST"])
def cancel_order_route(order_id):
    result = cancel_order(order_id)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)

@orders_bp.route("/<order_id>/received", methods=["PATCH", "POST"])
def receive_order_route(order_id):
    result = receive_order(order_id)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)

@orders_bp.route("/<order_id>/discount", methods=["POST"])
def apply_order_discount_route(order_id):
    payload = request.get_json(force=True)
    code = payload.get("code")
    if not code:
        return jsonify({"error": "Missing discount code"}), 400
    result = apply_discount_to_order(order_id, code)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)

@orders_bp.route("/queue", methods=["GET"])
def queue_route():
    return jsonify(get_queue())
