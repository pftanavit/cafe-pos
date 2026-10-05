from flask import Blueprint, request, jsonify
from services.users import (
    list_users,
    get_user,
    create_user,
    update_user,
    delete_user,
)

users_bp = Blueprint("users", __name__)

@users_bp.route("", methods=["GET"])
def list_users_route():
    return jsonify(list_users())

@users_bp.route("/<uid>", methods=["GET"])
def get_user_route(uid):
    user = get_user(uid)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user)

@users_bp.route("", methods=["POST"])
def create_user_route():
    payload = request.get_json(force=True)
    user = create_user(payload)
    return jsonify(user), 201

@users_bp.route("/<uid>", methods=["PATCH"])
def update_user_route(uid):
    payload = request.get_json(force=True)
    user = update_user(uid, payload)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user)

@users_bp.route("/<uid>", methods=["DELETE"])
def delete_user_route(uid):
    deleted = delete_user(uid)
    if not deleted:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"success": True})
