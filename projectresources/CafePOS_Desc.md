# Cafe POS System — Project Brief

> **Course:** 2190512 Application Development
> **Deadline:** Monday 18 May 2026 @ 23:59
> **Deliverables:** (1) Presentation PDF, (2) YouTube link of 5–7 min demo video
> **Score weight:** 25% of final grade

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [User Roles & Features](#3-user-roles--features)
4. [Core Domain Concepts](#4-core-domain-concepts)
5. [Database Design — Firebase Firestore](#5-database-design--firebase-firestore)
6. [Backend API — Flask](#6-backend-api--flask)
7. [Mobile App — React Native](#7-mobile-app--react-native)
8. [Web Frontend — React](#8-web-frontend--react)
9. [Analytics — Pandas + Plotly](#9-analytics--pandas--plotly)
10. [Authentication — Firebase Auth](#10-authentication--firebase-auth)
11. [Key Business Logic](#11-key-business-logic)
12. [Out of Scope](#12-out-of-scope)
13. [Project Setup Checklist](#13-project-setup-checklist)

---

## 1. Project Overview

A point-of-sale system built specifically for a cafe, designed to address three gaps in typical off-the-shelf POS software:

- **Ingredient-level customization** — customers can adjust sweetness levels, swap milk types, upgrade coffee beans, etc., and the system automatically deducts the correct ingredient amounts from inventory.
- **Real-time live queue tracking** — customers can see exactly where their order sits in the queue, and baristas get a live-updating to-do list sorted by priority.
- **Unified inventory and menu management** — the menu automatically reflects stock availability; if an ingredient runs out, every affected menu item is marked out of stock in real time.

The system serves three types of users — **customers**, **employees (baristas)**, and **admins** — each with their own interface and permission level.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Main database | Firebase Firestore | All application data — orders, menu, inventory, users |
| Authentication | Firebase Auth API | User identity (no passwords — username + role only) |
| Mobile app | React Native + Android Studio | Employee and customer mobile interface (Android only) |
| Web frontend | React (HTML/CSS) | Shares component logic with mobile; admin/employee web view |
| Backend API | Python + Flask | Business logic, inventory deduction, discount validation, queue sorting |
| Analytics | Pandas + Plotly | Order history analysis, sales charts (served via Flask) |

**How the layers connect:**

```
React Native / React Web
        |
        v
  Flask Backend API  <------>  Firebase Firestore
        |
        v
  Pandas + Plotly (analytics queries, chart generation)
        |
  Firebase Auth (token validation on every request)
```

The mobile and web frontends never write to Firestore directly for business-critical operations (inventory deduction, discount validation, price calculation). Those all go through Flask, which acts as the single source of truth for logic. Simple reads (menu display, queue status) can hit Firestore directly via the client SDK for real-time `onSnapshot` performance.

---

## 3. User Roles & Features

### Customer

Accessed via mobile app. No password required — username and role stored in Firestore.

- **Browse menu** — view all items with name, price, ingredients, and real-time stock availability. Out-of-stock items are flagged automatically.
- **Generate discount code** — tap a button to generate a single-use discount code in a verifiable format (e.g. `DISC-A3F9`). The customer shows this code to the employee at the counter.
- **Track order status** — after an order is placed, the customer sees a live queue position screen:
  - `X orders ahead of you` — while status is `on_queue`
  - `Currently being made` — when barista marks it `ongoing`
  - `Ready for pickup at the counter` — when marked `completed`
  - `Cancelled — please see the counter` — when marked `canceled`

### Employee (Barista)

Accessed via mobile app. Has three main tabs: **Order**, **Queue**, and **Inventory**.

**Order tab:**
- Create a new order — an empty order document is immediately written to Firestore with status `unconfirmed`, giving it an order ID the customer can reference.
- Add menu items to the order — for each item, fill in all customization choices (sweetness level, milk type, etc.).
- Apply a discount code typed in from the customer — the total price auto-updates.
- Set the order as takeaway or dine-in.
- Add quick appearance tags (e.g. "glasses", "red shirt", "tall") to identify the customer.
- Add a free-text note to the order.
- Confirm the order — status moves to `on_queue`, ingredients are deducted from inventory.

**Queue tab:**
- Live split-screen view:
  - Left half: scrollable list of all active orders showing elapsed time, order ID, item names, and takeaway/dine-in label. Takeaway orders are pushed to the top; orders sharing menu items are grouped together.
  - Right half: tap any order card to expand the full detail — complete recipe instructions for each item, all customizations, appearance tags, notes.
- Mark any order as `ongoing` — moves it to the top of the list, triggers a status update visible to the customer.
- Mark an order as `completed` — moves it to order history, no inventory change.
- Mark an order as `canceled` — moves it to order history and **adds the deducted ingredients back** to inventory.

**Inventory tab:**
- View current stock levels for all ingredients.
- Edit the quantity of any existing ingredient.

### Admin

Accessed via the web frontend. Has two main tabs: **Inventory Management** and **Analytics**.

**Inventory management:**
- All employee inventory permissions, plus:
- Add new ingredients (name, starting amount, unit).
- Delete ingredients.
- Add, edit, and delete menu items — including full ingredient slot configuration (see section 4).

**Analytics:**
- Full order history log: date, time ordered, time completed, item name, price.
- Charts and summaries:
  - Best and worst selling menu items.
  - Number of orders over a chosen time period.
  - Average order fulfillment time.
- Read-only. No data export in this version.

---

## 4. Core Domain Concepts

### Ingredient slots

Every menu item has an `ingredientSlots` array. Each slot is one of three types:

**Type 1 — Normal**
A fixed ingredient at a fixed amount. No customer choice. Example: 30 ml espresso in a latte.

**Type 2 — Customizable amount**
The customer chooses from a set of predefined levels for a single ingredient. The admin configures the levels and their amounts. Example:

| Level | Amount |
|---|---|
| None | 0 ml syrup |
| Light | 5 ml syrup |
| Normal (default) | 10 ml syrup |
| Extra | 15 ml syrup |

The amount chosen is what gets deducted from inventory.

**Type 3 — Customizable options**
The customer swaps the default ingredient for an alternative. Each alternative option specifies a different ingredient, amount, and pricing rule. Example: swapping whole milk (default) for oat milk (+15 THB markup) or almond milk (fixed override price of 160 THB regardless of base price).

**Pricing rules for type 3 options:**
- If the chosen option has `overridePrice` set → that price is the item total, ignoring `basePrice` entirely.
- If the chosen option only has `priceMarkup` set → `itemPrice = basePrice + priceMarkup`.
- If multiple options with `overridePrice` are somehow selected (edge case) → the last override wins. Avoid this by enforcing single-selection per slot in the UI.

### Order lifecycle

```
[Employee creates order]
        |
        v
  unconfirmed  ←— Empty order doc created. Order ID generated.
        |           Employee fills in items, customizations,
        |           appearance tags, discount code, notes.
        |
        v
   on_queue  ←— Employee confirms. Ingredients deducted from inventory.
        |        Customer can now see queue position.
        |
        v
   ongoing  ←— Barista taps "Start making". Order moves to top of queue.
        |        Customer sees "Currently being made".
        |
       / \
      /   \
completed  canceled
     |           |
Logged to    Ingredients
  history    restored to
             inventory
```

### Discount codes

- Codes are generated client-side by the customer using a simple verifiable format: `DISC-` followed by 4 alphanumeric characters derived from a checksum or timestamp hash (exact algorithm defined by backend team).
- The employee types the code into the order during the `unconfirmed` phase.
- Flask validates the code: checks format, fetches the Firestore doc, confirms `used: false`, then applies it atomically using a Firestore transaction (to prevent double-use).
- Discount types: `percentage` (e.g. 10% off) or `fixed` (e.g. 20 THB off).

### Out-of-stock detection

A menu item is considered out of stock if **any** of its required ingredients has `amount <= 0` in Firestore. This is computed by a **Cloud Function** (not the client) that triggers every time an `ingredients` document is written. The function checks which menu items reference that ingredient and updates their `isAvailable` field accordingly. Clients read `isAvailable` directly — they never compute stock status themselves.

---

## 5. Database Design — Firebase Firestore

Firestore is a NoSQL document database. Data is organised into **collections** of **documents**. Unlike SQL, you model data around your read patterns — embedding related data inside documents when you always need it together, and using subcollections when you need to fetch the parent without the children.

### Collections overview

| Collection | Type | Description |
|---|---|---|
| `users` | Top-level | One document per user, keyed by Firebase Auth UID |
| `ingredients` | Top-level | One document per ingredient in inventory |
| `menuItems` | Top-level | One document per menu item, with all ingredient slots embedded |
| `orders` | Top-level | One document per order |
| `orders/{id}/orderItems` | Subcollection | One document per line item within an order |
| `discountCodes` | Top-level | One document per discount code, doc ID = the code string |

---

### `users` collection

**Path:** `users/{uid}`

| Field | Type | Description |
|---|---|---|
| `uid` | string | Document ID. Matches the Firebase Auth UID. |
| `username` | string | Display name. |
| `role` | string | `"admin"`, `"employee"`, or `"customer"`. |
| `createdAt` | Timestamp | When the user profile was first created. |

**Notes:** Written only by a Cloud Function triggered on first login. The client never writes to this collection directly. No password is stored — Firebase Auth handles the session token.

---

### `ingredients` collection

**Path:** `ingredients/{ingredientId}`

| Field | Type | Description |
|---|---|---|
| `ingredientId` | string | Auto-generated document ID. |
| `name` | string | Human-readable name, e.g. `"Oat Milk"`. |
| `amount` | float | Current stock level. |
| `unit` | string | Unit of measurement: `"ml"`, `"g"`, `"kg"`, `"pcs"`, etc. |
| `updatedAt` | Timestamp | Last time stock was modified — useful for audit trail. |

**Notes:** When an order is confirmed (`unconfirmed` → `on_queue`), Flask performs a **batched write** that decrements all affected ingredients in a single atomic operation. On cancellation, a corresponding batched write adds them back. The `updatedAt` field is refreshed on every write.

---

### `menuItems` collection

**Path:** `menuItems/{menuItemId}`

| Field | Type | Description |
|---|---|---|
| `menuItemId` | string | Auto-generated document ID. |
| `name` | string | Menu item name, e.g. `"Oat Latte"`. |
| `recipe` | string | Step-by-step instructions for the barista. Plain text, newline-separated steps. e.g. `"1. Pull a double shot espresso.\n2. Steam oat milk to 65°C with thin microfoam.\n3. Pour over espresso."` |
| `basePrice` | float | Base price before any customization markups. |
| `isAvailable` | boolean | Whether all required ingredients are in stock. Set by Cloud Function — never written by the client. |
| `updatedAt` | Timestamp | Last modification time. |
| `ingredientSlots` | array | Embedded array of ingredient slot objects (see below). |

**Why `ingredientSlots` is embedded (not a subcollection):** The full menu item — including all its ingredient slots — needs to be loaded in one read when displaying the menu or when a barista is building an order. Embedding costs nothing extra and avoids a second round-trip.

#### Ingredient slot — type `"normal"`

```json
{
  "type": "normal",
  "ingredientId": "abc123",
  "ingredientName": "Espresso",
  "amount": 30,
  "unit": "ml"
}
```

`ingredientName` is denormalized (copied from the `ingredients` collection at the time of menu item creation) so menu display doesn't require additional reads. If an ingredient is renamed, the admin should re-save the menu item to sync.

#### Ingredient slot — type `"customizable_amount"`

```json
{
  "type": "customizable_amount",
  "ingredientId": "syrup_id",
  "ingredientName": "Syrup",
  "unit": "ml",
  "defaultLevelIndex": 2,
  "levels": [
    { "label": "None",   "amount": 0  },
    { "label": "Light",  "amount": 5  },
    { "label": "Normal", "amount": 10 },
    { "label": "Extra",  "amount": 15 }
  ]
}
```

`defaultLevelIndex` is the 0-based index into `levels` that is pre-selected when the employee opens the item. The admin can add or remove levels freely.

#### Ingredient slot — type `"customizable_options"`

```json
{
  "type": "customizable_options",
  "label": "Milk type",
  "options": [
    {
      "ingredientId": "whole_milk_id",
      "ingredientName": "Whole Milk",
      "amount": 200,
      "unit": "ml",
      "isDefault": true,
      "priceMarkup": 0,
      "overridePrice": null
    },
    {
      "ingredientId": "oat_milk_id",
      "ingredientName": "Oat Milk",
      "amount": 200,
      "unit": "ml",
      "isDefault": false,
      "priceMarkup": 15,
      "overridePrice": null
    },
    {
      "ingredientId": "decaf_beans_id",
      "ingredientName": "Decaf Beans",
      "amount": 18,
      "unit": "g",
      "isDefault": false,
      "priceMarkup": null,
      "overridePrice": 160
    }
  ]
}
```

**Pricing:** `priceMarkup` adds to `basePrice`. `overridePrice` replaces the entire item price — `basePrice` and all markups are ignored if `overridePrice` is non-null. Only one of the two should be set on any given option.

---

### `orders` collection

**Path:** `orders/{orderId}`

| Field | Type | Description |
|---|---|---|
| `orderId` | string | Auto-generated document ID. |
| `status` | string | `"unconfirmed"`, `"on_queue"`, `"ongoing"`, `"completed"`, `"canceled"` |
| `employeeId` | string | FK → `users/{uid}`. The employee who created the order. |
| `customerId` | string \| null | FK → `users/{uid}`. Set if the customer links their session to this order. |
| `discountCode` | string \| null | FK → `discountCodes/{code}`. The code applied, if any. |
| `discountAmount` | float \| null | Computed discount in THB, stored for display and analytics. |
| `subtotal` | float | Sum of all `itemPrice` values before discount. |
| `totalPrice` | float | `subtotal - discountAmount`. |
| `isTakeaway` | boolean | True = takeaway; false = dine-in. Takeaway orders are sorted higher in queue. |
| `appearanceTags` | string[] | Quick description tags for customer identification, e.g. `["glasses", "blue shirt"]`. |
| `notes` | string \| null | Free-text note from the employee. |
| `createdAt` | Timestamp | When the order was first created (i.e. when status became `unconfirmed`). |
| `startedAt` | Timestamp \| null | Set when status moves to `ongoing`. Used for elapsed time display and analytics. |
| `completedAt` | Timestamp \| null | Set when status moves to `completed` or `canceled`. |

**Queue real-time listener:** The queue screen uses Firestore's `onSnapshot` with a query for `status in ["on_queue", "ongoing"]`, ordered by `createdAt`. The sort order and priority logic (takeaway first, overlapping items grouped) is applied in Flask or client-side JS — it does not need a stored priority field.

---

### `orders/{orderId}/orderItems` subcollection

**Path:** `orders/{orderId}/orderItems/{itemId}`

| Field | Type | Description |
|---|---|---|
| `itemId` | string | Auto-generated document ID. |
| `menuItemId` | string | FK → `menuItems/{menuItemId}`. Reference to the source menu item. |
| `menuItemName` | string | **Snapshot.** Name copied at order time. |
| `recipeSnapshot` | string | **Snapshot.** Full recipe text copied at order time. Baristas always see the recipe that was current when the order was placed. |
| `basePrice` | float | **Snapshot.** Base price at order time. |
| `itemPrice` | float | Final resolved price after applying customization pricing rules. |
| `customizations` | map | One entry per customized slot. Key = slot label. See structure below. |

**Why snapshots matter:** If an admin edits a menu item's price or recipe after an order is placed, the order history must reflect what was actually ordered and priced at that time — not the current state of the menu. All `*Snapshot` fields exist for this reason.

#### `customizations` map — amount entry

```json
{
  "Sweetness": {
    "type": "customizable_amount",
    "ingredientId": "syrup_id",
    "chosenLabel": "Light",
    "chosenAmount": 5,
    "unit": "ml"
  }
}
```

#### `customizations` map — options entry

```json
{
  "Milk type": {
    "type": "customizable_options",
    "chosenIngredientId": "oat_milk_id",
    "chosenIngredientName": "Oat Milk",
    "chosenAmount": 200,
    "unit": "ml",
    "priceMarkup": 15,
    "overridePrice": null
  }
}
```

---

### `discountCodes` collection

**Path:** `discountCodes/{code}`

| Field | Type | Description |
|---|---|---|
| `code` | string | The document ID itself. Using the code as the ID enables O(1) lookup — no query needed. |
| `type` | string | `"percentage"` or `"fixed"`. |
| `value` | float | For percentage: e.g. `10` = 10% off. For fixed: e.g. `20` = 20 THB off. |
| `used` | boolean | Whether this code has already been redeemed. |
| `usedInOrderId` | string \| null | FK → `orders/{orderId}`. Set when redeemed. |
| `createdAt` | Timestamp | When the code was generated. |

**Validation flow:** Flask receives the code string, fetches `discountCodes/{code}` directly (no query — it's the doc ID), checks `used == false`, then runs a **Firestore transaction** that atomically sets `used = true`, `usedInOrderId = orderId`, and updates the order's `discountAmount` and `totalPrice`. A transaction prevents a race condition where two employees apply the same code at the same moment.

---

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if false; // Cloud Functions only
    }

    match /ingredients/{id} {
      allow read: if request.auth != null;
      allow write: if isEmployeeOrAdmin();
    }

    match /menuItems/{id} {
      allow read: if true; // Public — customer menu view
      allow write: if isAdmin();
    }

    match /orders/{orderId} {
      allow read: if isEmployeeOrAdmin()
                  || request.auth.uid == resource.data.customerId;
      allow create: if isEmployee();
      allow update: if isEmployeeOrAdmin();

      match /orderItems/{itemId} {
        allow read: if isEmployeeOrAdmin()
                    || request.auth.uid == get(/databases/$(database)/documents/orders/$(orderId)).data.customerId;
        allow write: if isEmployee();
      }
    }

    match /discountCodes/{code} {
      allow read: if request.auth != null;
      allow write: if false; // Flask backend only via Admin SDK
    }

    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    function isEmployee() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['employee', 'admin'];
    }
    function isEmployeeOrAdmin() { return isEmployee(); }
  }
}
```

---

## 6. Backend API — Flask

Flask is the single place where business logic lives. It connects to Firestore using the **Firebase Admin SDK** (which bypasses security rules — it has full access). All sensitive operations must go through Flask, never directly from the client.

### Responsibilities

| Responsibility | Why Flask, not the client |
|---|---|
| Inventory deduction | Must be atomic across multiple ingredient docs — client SDK doesn't guarantee this reliably |
| Discount code validation and application | Requires a Firestore transaction to prevent double-use |
| Item price resolution | Applying `overridePrice` vs `priceMarkup` rules is backend logic, not UI logic |
| Queue sort order | Takeaway priority, overlapping item grouping — computed server-side |
| Analytics queries | Pandas DataFrame operations on order history |
| Discount code generation (optionally) | Verifiable format validation |

### Key endpoints (suggested)

```
POST   /orders                          Create a new unconfirmed order
PATCH  /orders/{orderId}/items          Add/edit an order item
PATCH  /orders/{orderId}/confirm        Confirm order → on_queue (triggers inventory deduction)
PATCH  /orders/{orderId}/start          Mark order → ongoing
PATCH  /orders/{orderId}/complete       Mark order → completed
PATCH  /orders/{orderId}/cancel         Mark order → canceled (restores inventory)
POST   /orders/{orderId}/discount       Validate and apply a discount code
GET    /queue                           Return sorted active orders
GET    /menu                            Return all menu items with availability
GET    /analytics/orders                Return filtered order history for Pandas processing
GET    /analytics/summary               Return pre-computed sales summary charts
```

### Inventory deduction logic

Called when an order moves from `unconfirmed` → `on_queue`.

```python
def deduct_inventory(order_id):
    order_items = db.collection("orders").document(order_id)\
                    .collection("orderItems").get()

    batch = db.batch()
    for item_doc in order_items:
        item = item_doc.to_dict()
        menu_item = db.collection("menuItems")\
                      .document(item["menuItemId"]).get().to_dict()

        for slot in menu_item["ingredientSlots"]:
            if slot["type"] == "normal":
                ingredient_ref = db.collection("ingredients")\
                                   .document(slot["ingredientId"])
                batch.update(ingredient_ref, {
                    "amount": firestore.Increment(-slot["amount"]),
                    "updatedAt": firestore.SERVER_TIMESTAMP
                })

            elif slot["type"] == "customizable_amount":
                chosen = item["customizations"][slot["label"]]
                ingredient_ref = db.collection("ingredients")\
                                   .document(chosen["ingredientId"])
                batch.update(ingredient_ref, {
                    "amount": firestore.Increment(-chosen["chosenAmount"]),
                    "updatedAt": firestore.SERVER_TIMESTAMP
                })

            elif slot["type"] == "customizable_options":
                chosen = item["customizations"][slot["label"]]
                ingredient_ref = db.collection("ingredients")\
                                   .document(chosen["chosenIngredientId"])
                batch.update(ingredient_ref, {
                    "amount": firestore.Increment(-chosen["chosenAmount"]),
                    "updatedAt": firestore.SERVER_TIMESTAMP
                })

    batch.commit()
```

On **cancellation**, run the same logic with positive increments (`+amount` instead of `-amount`).

### Item price resolution logic

```python
def resolve_item_price(base_price: float, customizations: dict) -> float:
    # Check all chosen options for an overridePrice first
    for slot_label, choice in customizations.items():
        if choice.get("overridePrice") is not None:
            return choice["overridePrice"]  # Hard override — stop here

    # No override found — sum all markups on top of base price
    total_markup = sum(
        choice.get("priceMarkup") or 0
        for choice in customizations.values()
        if choice.get("type") == "customizable_options"
    )
    return base_price + total_markup
```

### Queue sort logic

```python
def sort_queue(orders: list) -> list:
    # 1. Ongoing orders always go to the top
    # 2. Among on_queue orders: takeaway orders come first
    # 3. Orders sharing menu items are grouped together (secondary sort)
    def sort_key(order):
        is_ongoing = 0 if order["status"] == "ongoing" else 1
        is_dine_in = 0 if order["isTakeaway"] else 1
        return (is_ongoing, is_dine_in, order["createdAt"])

    return sorted(orders, key=sort_key)
```

The "overlapping menu items" grouping is more complex — it requires comparing item sets across orders. The simplest implementation is to group by shared item IDs as a secondary sort key after takeaway priority.

---

## 7. Mobile App — React Native

**Target platform:** Android only (Android Studio for build and emulation).

### Screens by role

**Customer:**
- Menu screen — fetches `menuItems` where `isAvailable == true`; displays items grouped by category (if categories are added later).
- Order tracker screen — real-time `onSnapshot` on a single `orders/{orderId}` document. Shows queue position, current status.
- Discount code screen — generates and displays a code for the customer to show the employee.

**Employee:**
- Tab 1 — Order: new order creation flow, item picker, customization selectors, discount code entry, notes, appearance tags.
- Tab 2 — Queue: split-pane live order list (calls `GET /queue` or uses `onSnapshot` on `orders` filtered by active statuses).
- Tab 3 — Inventory: read + edit ingredient amounts.

### Sharing logic with the web frontend

Because both the React Native app and the React web frontend use React, business logic (price calculation display, form validation, status formatting) can be extracted into a shared JavaScript module (`/shared/`) that both import. UI components themselves are platform-specific (React Native uses `View`/`Text`; React web uses `div`/`span`).

---

## 8. Web Frontend — React

Used by admins. The web app targets desktop browsers (Chrome, Firefox).

### Screens

**Inventory management tab:**
- Ingredient list — table of all ingredients with current stock, unit, edit button.
- Add ingredient form — name, amount, unit.
- Menu item list — card grid with availability badge, edit/delete buttons.
- Menu item editor — full form with ingredient slot builder:
  - Choose slot type (normal / customizable amount / customizable options).
  - For customizable amount: add/remove levels, set amounts per level, set default.
  - For customizable options: add/remove options, set ingredient, amount, markup vs override price.

**Analytics tab:**
- Date range picker.
- Summary cards: total orders, total revenue, average fulfillment time.
- Charts rendered by Plotly (returned as HTML or JSON from Flask `/analytics/summary`).
- Full order history table with pagination.

---

## 9. Analytics — Pandas + Plotly

Analytics queries are **read-only** and run inside Flask. When the admin requests a report, Flask fetches the relevant `orders` documents (filtered by date range and `status == "completed"`), loads them into a Pandas DataFrame, computes the metrics, and returns either a JSON summary or a Plotly figure (as JSON or embedded HTML).

### Key metrics

```python
import pandas as pd

# Convert Firestore docs to DataFrame
df = pd.DataFrame([doc.to_dict() for doc in order_docs])
df["fulfillment_time"] = (df["completedAt"] - df["startedAt"]).dt.total_seconds() / 60

# Best-selling items (requires exploding orderItems subcollection data into the df)
item_counts = item_df.groupby("menuItemName")["itemId"].count().sort_values(ascending=False)

# Orders per time period
df["date"] = df["createdAt"].dt.date
orders_per_day = df.groupby("date")["orderId"].count()

# Revenue
total_revenue = df["totalPrice"].sum()
avg_order_value = df["totalPrice"].mean()
```

---

## 10. Authentication — Firebase Auth

Firebase Auth manages user sessions. **No passwords** — for this project, users are created by the admin and identified only by username and role.

**Implementation approach:**

- On first login (or account creation), a Cloud Function creates the corresponding `users/{uid}` document with the correct role.
- The Firebase client SDK handles session tokens automatically. The token is attached to every request to Flask.
- Flask verifies the token on every request using the Admin SDK:

```python
from firebase_admin import auth

def verify_token(request):
    id_token = request.headers.get("Authorization", "").replace("Bearer ", "")
    decoded = auth.verify_id_token(id_token)
    return decoded["uid"]
```

- After getting the UID, Flask fetches `users/{uid}` to check the role and enforce permissions.

---

## 11. Key Business Logic

### The order confirmation flow (critical path)

This is the most important sequence in the system. Every step must succeed or the whole operation rolls back.

```
1. Employee taps "Confirm Order"
2. Client calls POST /orders/{id}/confirm
3. Flask verifies employee token and role
4. Flask reads all orderItems for this order
5. Flask resolves itemPrice for each item (overridePrice check → markup sum)
6. Flask computes subtotal and totalPrice (applying discount if present)
7. Flask writes all prices back to each orderItem document
8. Flask performs batched write to decrement all ingredient amounts
9. Flask updates order status to "on_queue" and sets totalPrice/subtotal on the order doc
10. Client receives 200 OK
11. Firestore onSnapshot fires on the queue screen — new order appears for all employees
12. Firestore onSnapshot fires on the customer's tracker — queue position is shown
```

If step 8 fails (e.g. a network error), the batch write is atomic — no partial deductions occur.

### The cancellation flow

```
1. Barista marks order as "canceled"
2. Client calls PATCH /orders/{id}/cancel
3. Flask reads all orderItems and their chosen ingredient amounts
4. Flask performs batched write to INCREMENT all ingredient amounts (restore stock)
5. Flask updates order status to "canceled" and sets completedAt
6. Cloud Function triggers on ingredient writes → recomputes isAvailable for affected menu items
7. Customer's tracker screen updates to show "Canceled — see counter"
```

### Out-of-stock propagation

```
1. Any ingredients document is written (amount changes)
2. Cloud Function triggers
3. Function queries all menuItems where ingredientSlots[].ingredientId == this ingredient
4. For each affected menuItem, checks if ALL its ingredients have amount > 0
5. Writes isAvailable = true/false back to each affected menuItem
6. Customer's menu screen (onSnapshot on menuItems) updates in real time
```

---

## 12. Out of Scope

The following are explicitly **not** part of this project:

- Payment gateway integration (no actual payment processing)
- Multi-branch support
- Kitchen display hardware integration
- Table reservations
- iOS support (Android only)
- Data export from analytics
- Point accumulation / loyalty system (only single-use coupon codes)
- User password management (no passwords at all)

---

## 13. Project Setup Checklist

### Firebase setup

- [ ] Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Enable Firestore in **Native mode** (not Datastore mode)
- [ ] Enable Firebase Authentication (Anonymous or Custom Token — no email/password needed)
- [ ] Copy Firebase config object into the React and React Native apps
- [ ] Generate a **service account key** (JSON) for the Flask backend (Admin SDK)
- [ ] Deploy Firestore security rules (from section 5)
- [ ] Set up Cloud Functions project for `isAvailable` recomputation and user profile creation

### Flask backend setup

```bash
pip install flask firebase-admin pandas plotly
```

```python
# Initialize Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()
```

- [ ] Set up a `.env` file — never commit `serviceAccountKey.json` to git
- [ ] Add `serviceAccountKey.json` to `.gitignore`

### React Native setup

```bash
npx react-native init CafePOS
npm install @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/auth
```

- [ ] Configure Android Studio with an Android emulator (API level 31+)
- [ ] Add `google-services.json` (from Firebase console) to `android/app/`

### React web setup

```bash
npx create-react-app cafe-pos-web
npm install firebase
```

- [ ] Add Firebase config to environment variables (`.env.local`)

### Shared module (recommended)

Create a `/shared/` folder at the repo root containing:
- `priceResolver.js` — `resolveItemPrice(basePrice, customizations)`
- `orderStatus.js` — status label strings and transition rules
- `discountApplier.js` — discount math

Both the React Native and React web apps import from this shared module.

### Suggested repo structure

```
/
├── backend/              # Flask API
│   ├── app.py
│   ├── routes/
│   ├── services/         # inventory.py, orders.py, analytics.py
│   └── serviceAccountKey.json  (gitignored)
├── mobile/               # React Native
│   ├── src/
│   │   ├── screens/
│   │   │     └── customer/
│   │   │     └── employee/
│   │   │     └── admin/
│   │   └── components/
│   └── android/
├── web/                  # React web (admin)
│   └── src/
│       ├── pages/
│       │    └── customer/
│       │    └── employee/
│       │    └── admin/
│       └── components/
└── shared/               # JS logic shared between mobile and web
    ├── priceResolver.js
    ├── orderStatus.js
    └── discountApplier.js
```
