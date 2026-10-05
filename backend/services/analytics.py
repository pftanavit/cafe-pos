from datetime import datetime
from collections import Counter
import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio
from services.firestore_client import db

ORDER_COLLECTION = "orders"


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _fetch_orders(start_date=None, end_date=None):
    collection = db.collection(ORDER_COLLECTION)
    docs = collection.stream()
    orders = []
    for doc in docs:
        order = {"orderId": doc.id, **doc.to_dict()}
        created_at = order.get("createdAt")
        if start_date and created_at and created_at < start_date:
            continue
        if end_date and created_at and created_at > end_date:
            continue
        orders.append(order)
    return orders


def get_order_history(start_date=None, end_date=None):
    start = _parse_date(start_date)
    end = _parse_date(end_date)
    orders = _fetch_orders(start, end)
    for order in orders:
        if isinstance(order.get("createdAt"), datetime):
            order["createdAt"] = order["createdAt"].isoformat()
        if isinstance(order.get("startedAt"), datetime):
            order["startedAt"] = order["startedAt"].isoformat()
        if isinstance(order.get("completedAt"), datetime):
            order["completedAt"] = order["completedAt"].isoformat()
    return orders


def get_summary(start_date=None, end_date=None):
    start = _parse_date(start_date)
    end = _parse_date(end_date)
    orders = _fetch_orders(start, end)
    if not orders:
        return {
            "totalOrders": 0,
            "totalRevenue": 0.0,
            "averageOrderValue": 0.0,
            "averageFulfillmentMinutes": 0.0,
            "ordersPerDay": {},
            "topSellingItems": [],
            "salesByDateChart": {},
        }

    df = pd.DataFrame(orders)
    df["totalPrice"] = df["totalPrice"].fillna(0.0).astype(float)
    df["subtotal"] = df["subtotal"].fillna(0.0).astype(float)
    df["createdAt"] = pd.to_datetime(df["createdAt"])
    df["startedAt"] = pd.to_datetime(df["startedAt"])
    df["completedAt"] = pd.to_datetime(df["completedAt"])

    revenue = float(df["totalPrice"].sum())
    average_value = float(df["totalPrice"].mean())

    fulfillment_mask = df["startedAt"].notna() & df["completedAt"].notna()
    if fulfillment_mask.any():
        fulfillment_minutes = (df.loc[fulfillment_mask, "completedAt"] - df.loc[fulfillment_mask, "startedAt"]).dt.total_seconds() / 60.0
        average_fulfillment = float(fulfillment_minutes.mean())
    else:
        average_fulfillment = 0.0

    df["date"] = df["createdAt"].dt.date
    orders_per_day = df.groupby("date").size().to_dict()
    orders_per_day = {str(k): int(v) for k, v in orders_per_day.items()}

    order_item_counts = Counter()
    for order in orders:
        order_ref = db.collection(ORDER_COLLECTION).document(order["orderId"])
        for item_doc in order_ref.collection("orderItems").stream():
            item = item_doc.to_dict()
            order_item_counts[item.get("menuItemName", "Unknown")] += 1

    top_selling = [
        {"menuItemName": name, "count": count}
        for name, count in order_item_counts.most_common(10)
    ]

    chart = go.Figure(
        data=[go.Bar(x=list(orders_per_day.keys()), y=list(orders_per_day.values()))],
    )
    chart.update_layout(title="Orders per Day", xaxis_title="Date", yaxis_title="Orders")

    return {
        "totalOrders": int(len(orders)),
        "totalRevenue": revenue,
        "averageOrderValue": average_value,
        "averageFulfillmentMinutes": average_fulfillment,
        "ordersPerDay": orders_per_day,
        "topSellingItems": top_selling,
        "salesByDateChart": chart.to_json(),
    }


def get_graphs(start_date=None, end_date=None):
    start = _parse_date(start_date)
    end = _parse_date(end_date)
    orders = _fetch_orders(start, end)

    if orders:
        df = pd.DataFrame(orders)
        df["createdAt"] = pd.to_datetime(df["createdAt"], errors="coerce")
        df = df.dropna(subset=["createdAt"])
        df["date"] = df["createdAt"].dt.date
        orders_per_day = df.groupby("date").size().reset_index(name="orders")
        orders_per_day["date"] = orders_per_day["date"].astype(str)
    else:
        orders_per_day = pd.DataFrame(columns=["date", "orders"])

    order_item_counts = Counter()
    for order in orders:
        order_ref = db.collection(ORDER_COLLECTION).document(order["orderId"])
        for item_doc in order_ref.collection("orderItems").stream():
            item = item_doc.to_dict()
            order_item_counts[item.get("menuItemName", "Unknown")] += 1

    top_items = pd.DataFrame(
        [{"menuItemName": name, "count": count} for name, count in order_item_counts.most_common(10)]
    )

    orders_figure = go.Figure()
    orders_figure.add_trace(
        go.Scatter(
            x=orders_per_day["date"],
            y=orders_per_day["orders"],
            mode="lines+markers",
            line={"color": "#1f6feb", "width": 3},
            marker={"size": 8},
            name="Orders",
        )
    )
    orders_figure.update_layout(
        title="Daily Number of Orders Over Time",
        xaxis_title="Date",
        yaxis_title="Number of Orders",
        margin={"l": 48, "r": 24, "t": 56, "b": 48},
        paper_bgcolor="#ffffff",
        plot_bgcolor="#ffffff",
    )

    pie_figure = go.Figure()
    if not top_items.empty:
        pie_figure.add_trace(
            go.Pie(
                labels=top_items["menuItemName"],
                values=top_items["count"],
                hole=0.35,
                textinfo="label+percent",
            )
        )
    else:
        pie_figure.add_annotation(
            text="No completed menu item data yet",
            showarrow=False,
            font={"size": 16},
        )
    pie_figure.update_layout(
        title="Top Selling Menu Items",
        margin={"l": 24, "r": 24, "t": 56, "b": 24},
        paper_bgcolor="#ffffff",
        plot_bgcolor="#ffffff",
    )

    html = "\n".join(
        [
            "<style>",
            "body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: #fff; }",
            ".plotly-graph-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr); gap: 18px; padding: 12px; }",
            ".plotly-graph-grid .plotly-graph-div { width: 100% !important; min-height: 460px; }",
            "@media (max-width: 820px) { .plotly-graph-grid { grid-template-columns: 1fr; } }",
            "</style>",
            '<div class="plotly-graph-grid">',
            pio.to_html(orders_figure, full_html=False, include_plotlyjs=True, config={"responsive": True}),
            pio.to_html(pie_figure, full_html=False, include_plotlyjs=False, config={"responsive": True}),
            "</div>",
        ]
    )
    return {"html": html}
