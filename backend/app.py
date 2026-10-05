from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS

from routes.ingredients import ingredients_bp
from routes.menu_items import menu_items_bp
from routes.discount_codes import discount_codes_bp
from routes.orders import orders_bp
from routes.analytics import analytics_bp
from routes.users import users_bp
from services.orders import get_queue


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    def json_default(value):
        if value.__class__.__name__ == "Sentinel":
            return datetime.utcnow().isoformat() + "Z"
        if hasattr(value, "isoformat"):
            return value.isoformat()
        raise TypeError

    app.json.default = json_default

    app.register_blueprint(users_bp, url_prefix="/users")
    app.register_blueprint(ingredients_bp, url_prefix="/ingredients")
    app.register_blueprint(menu_items_bp, url_prefix="/menu-items")
    app.register_blueprint(discount_codes_bp, url_prefix="/discount-codes")
    app.register_blueprint(orders_bp, url_prefix="/orders")
    app.register_blueprint(analytics_bp, url_prefix="/analytics")

    @app.route("/")
    def health_check():
        return jsonify({"status": "ok", "service": "Cafe POS Backend"})

    @app.route("/queue")
    def root_queue():
        return jsonify(get_queue())

    @app.errorhandler(ValueError)
    def value_error(error):
        return jsonify({"error": str(error)}), 400

    @app.errorhandler(KeyError)
    def key_error(error):
        return jsonify({"error": f"Missing required field: {error.args[0]}"}), 400

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
