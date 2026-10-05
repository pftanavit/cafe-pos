from flask import Blueprint, request, jsonify
from services.discount_codes import (
    list_discount_codes,
    get_discount_code,
    create_discount_code,
    update_discount_code,
    delete_discount_code,
    generate_discount_code,
    validate_and_apply_discount_code,
)

discount_codes_bp = Blueprint("discount_codes", __name__)

@discount_codes_bp.route("", methods=["GET"])
def list_discount_codes_route():
    return jsonify(list_discount_codes())

@discount_codes_bp.route("/<code>", methods=["GET"])
def get_discount_code_route(code):
    discount = get_discount_code(code)
    if not discount:
        return jsonify({"error": "Discount code not found"}), 404
    return jsonify(discount)

@discount_codes_bp.route("", methods=["POST"])
def create_discount_code_route():
    payload = request.get_json(force=True)
    discount = create_discount_code(payload)
    return jsonify(discount), 201

@discount_codes_bp.route("/generate", methods=["POST"])
def generate_discount_code_route():
    payload = request.get_json(silent=True) or {}
    discount = generate_discount_code(payload)
    return jsonify(discount), 201

@discount_codes_bp.route("/<code>", methods=["PATCH"])
def update_discount_code_route(code):
    payload = request.get_json(force=True)
    discount = update_discount_code(code, payload)
    if not discount:
        return jsonify({"error": "Discount code not found"}), 404
    return jsonify(discount)

@discount_codes_bp.route("/<code>", methods=["DELETE"])
def delete_discount_code_route(code):
    deleted = delete_discount_code(code)
    if not deleted:
        return jsonify({"error": "Discount code not found"}), 404
    return jsonify({"success": True})

@discount_codes_bp.route("/<code>/apply", methods=["POST"])
def apply_discount_code_route(code):
    payload = request.get_json(force=True)
    order_id = payload.get("orderId")
    if not order_id:
        return jsonify({"error": "Missing orderId"}), 400
    result = validate_and_apply_discount_code(order_id, code)
    return jsonify(result)
