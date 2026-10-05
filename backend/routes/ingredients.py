from flask import Blueprint, request, jsonify
from services.inventory import (
    list_ingredients,
    get_ingredient,
    create_ingredient,
    update_ingredient,
    delete_ingredient,
)

ingredients_bp = Blueprint("ingredients", __name__)

@ingredients_bp.route("", methods=["GET"])
def list_ingredients_route():
    return jsonify(list_ingredients())

@ingredients_bp.route("/<ingredient_id>", methods=["GET"])
def get_ingredient_route(ingredient_id):
    ingredient = get_ingredient(ingredient_id)
    if not ingredient:
        return jsonify({"error": "Ingredient not found"}), 404
    return jsonify(ingredient)

@ingredients_bp.route("", methods=["POST"])
def create_ingredient_route():
    payload = request.get_json(force=True)
    ingredient = create_ingredient(payload)
    return jsonify(ingredient), 201

@ingredients_bp.route("/<ingredient_id>", methods=["PATCH"])
def update_ingredient_route(ingredient_id):
    payload = request.get_json(force=True)
    ingredient = update_ingredient(ingredient_id, payload)
    if not ingredient:
        return jsonify({"error": "Ingredient not found"}), 404
    return jsonify(ingredient)

@ingredients_bp.route("/<ingredient_id>", methods=["DELETE"])
def delete_ingredient_route(ingredient_id):
    deleted = delete_ingredient(ingredient_id)
    if not deleted:
        return jsonify({"error": "Ingredient not found"}), 404
    return jsonify({"success": True})
