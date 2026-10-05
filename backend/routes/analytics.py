from flask import Blueprint, request, jsonify
from services.analytics import get_graphs, get_order_history, get_summary

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/history", methods=["GET"])
@analytics_bp.route("/orders", methods=["GET"])
def get_order_history_route():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    return jsonify(get_order_history(start_date=start_date, end_date=end_date))

@analytics_bp.route("/summary", methods=["GET"])
def get_summary_route():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    return jsonify(get_summary(start_date=start_date, end_date=end_date))

@analytics_bp.route("/graphs", methods=["GET"])
def get_graphs_route():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    return jsonify(get_graphs(start_date=start_date, end_date=end_date))
