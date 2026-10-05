from flask import Blueprint, request, jsonify
from services.menu import (
    list_menu_items,
    get_menu_item,
    create_menu_item,
    update_menu_item,
    delete_menu_item,
)

menu_items_bp = Blueprint("menu_items", __name__)

@menu_items_bp.route("", methods=["GET"])
def list_menu_items_route():
    return jsonify(list_menu_items())

@menu_items_bp.route("/<menu_item_id>", methods=["GET"])
def get_menu_item_route(menu_item_id):
    item = get_menu_item(menu_item_id)
    if not item:
        return jsonify({"error": "Menu item not found"}), 404
    return jsonify(item)

@menu_items_bp.route("", methods=["POST"])
def create_menu_item_route():
    payload = request.get_json(force=True)
    item = create_menu_item(payload)
    return jsonify(item), 201

@menu_items_bp.route("/<menu_item_id>", methods=["PATCH", "PUT"])
def update_menu_item_route(menu_item_id):
    payload = request.get_json(force=True)
    item = update_menu_item(menu_item_id, payload)
    if not item:
        return jsonify({"error": "Menu item not found"}), 404
    return jsonify(item)

@menu_items_bp.route("/<menu_item_id>", methods=["DELETE"])
def delete_menu_item_route(menu_item_id):
    deleted = delete_menu_item(menu_item_id)
    if not deleted:
        return jsonify({"error": "Menu item not found"}), 404
    return jsonify({"success": True})
