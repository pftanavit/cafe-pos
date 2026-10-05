# Cafe POS — Database Structure & Interaction Guidelines

---

## Table of Contents

1. [Database at a Glance](#1-database-at-a-glance)
2. [Full Schema Tree](#2-full-schema-tree)
3. [Collection Reference](#3-collection-reference)
4. [Embedded Structures Reference](#4-embedded-structures-reference)
5. [Relationships & Foreign Keys](#5-relationships--foreign-keys)
6. [How Everything Works Together](#6-how-everything-works-together)
7. [The Order Lifecycle (Critical Flow)](#7-the-order-lifecycle-critical-flow)
8. [Inventory Rules](#8-inventory-rules)
9. [Pricing Rules](#9-pricing-rules)
10. [Discount Code Rules](#10-discount-code-rules)
11. [Menu Availability Rules](#11-menu-availability-rules)
12. [Who Reads and Writes What](#12-who-reads-and-writes-what)
13. [What Flask Owns vs What the Client Can Do](#13-what-flask-owns-vs-what-the-client-can-do)
14. [Field Snapshot Policy](#14-field-snapshot-policy)
15. [Quick Reference — Field Types Cheatsheet](#15-quick-reference--field-types-cheatsheet)

---

## 1. Database at a Glance

**Database:** Firebase Firestore (Native mode, NoSQL document database)

**5 top-level collections:**

| Collection | What it stores | # of docs expected |
|---|---|---|
| `users` | One profile per user (admin / employee / customer) | Small (tens) |
| `ingredients` | One entry per physical ingredient in stock | Small-medium (dozens) |
| `menuItems` | One entry per item on the cafe menu | Small (dozens) |
| `orders` | One entry per customer order, all statuses | Medium-large (grows daily) |
| `discountCodes` | One entry per generated discount code | Medium (grows daily) |

**1 subcollection:**

| Subcollection | Parent | What it stores |
|---|---|---|
| `orders/{orderId}/orderItems` | Each `orders` doc | One entry per line item within that order |

**Design decisions in plain English:**

- `ingredientSlots` is **embedded inside each `menuItems` document** — not a separate collection — because you always need all slot details whenever you load a menu item. One document = one Firestore read.
- `orderItems` is a **subcollection under each order** — not embedded in the order document — because the queue list only needs the order header (status, time, takeaway flag), and the full item detail is only loaded when a barista expands a specific order. Separating them avoids loading unnecessary data.
- All **name, price, and recipe fields on `orderItems` are snapshots** (copied at the time the order is placed). If a menu item is edited later, historical orders remain accurate.
- The `discountCodes` **document ID is the code string itself** (e.g. `DISC-A3F9`). This makes validation a single `get()` call instead of a query.
- `isAvailable` on `menuItems` is **never computed by the client**. A Cloud Function writes it automatically whenever any `ingredients` document changes.

---

## 2. Full Schema Tree

```
Firestore (root)
│
├── users/
│   └── {uid}                                ← Document ID = Firebase Auth UID
│       ├── uid              : string
│       ├── username         : string
│       ├── role             : string         → "admin" | "employee" | "customer"
│       └── createdAt        : Timestamp
│
├── ingredients/
│   └── {ingredientId}                       ← Auto-generated ID
│       ├── ingredientId     : string
│       ├── name             : string
│       ├── amount           : float          ← current stock level
│       ├── unit             : string         → "ml" | "g" | "kg" | "pcs" | "l" | "oz"
│       └── updatedAt        : Timestamp
│
├── menuItems/
│   └── {menuItemId}                         ← Auto-generated ID
│       ├── menuItemId       : string
│       ├── name             : string
│       ├── recipe           : string         ← step-by-step barista instructions (\n separated)
│       ├── basePrice        : float
│       ├── isAvailable      : boolean        ← written by Cloud Function ONLY
│       ├── updatedAt        : Timestamp
│       └── ingredientSlots  : array          ← see section 4 for slot structures
│           ├── [normal slot]
│           ├── [customizable_amount slot]
│           └── [customizable_options slot]
│
├── orders/
│   └── {orderId}                            ← Auto-generated ID
│       ├── orderId          : string
│       ├── status           : string         → "unconfirmed" | "on_queue" | "ongoing" | "completed" | "canceled"
│       ├── employeeId       : string         → FK → users/{uid}
│       ├── customerId       : string | null  → FK → users/{uid}
│       ├── discountCode     : string | null  → FK → discountCodes/{code}
│       ├── discountAmount   : float | null
│       ├── subtotal         : float
│       ├── totalPrice       : float
│       ├── isTakeaway       : boolean
│       ├── appearanceTags   : string[]
│       ├── notes            : string | null
│       ├── createdAt        : Timestamp
│       ├── startedAt        : Timestamp | null
│       ├── completedAt      : Timestamp | null
│       │
│       └── orderItems/                      ← SUBCOLLECTION
│           └── {itemId}                     ← Auto-generated ID
│               ├── itemId           : string
│               ├── menuItemId       : string       → FK → menuItems/{menuItemId}
│               ├── menuItemName     : string       ← SNAPSHOT
│               ├── recipeSnapshot   : string       ← SNAPSHOT
│               ├── basePrice        : float        ← SNAPSHOT
│               ├── itemPrice        : float        ← resolved by Flask
│               └── customizations   : map          ← see section 4
│
└── discountCodes/
    └── {code}                               ← Document ID = the code string itself
        ├── code             : string
        ├── type             : string         → "percentage" | "fixed"
        ├── value            : float
        ├── used             : boolean
        ├── usedInOrderId    : string | null  → FK → orders/{orderId}
        └── createdAt        : Timestamp
```

---

## 3. Collection Reference

### `users`

The single source of truth for user identity and role. Every other collection references users by their `uid`.

| Field | Type | Notes |
|---|---|---|
| `uid` | `string` | Document ID. Matches Firebase Auth UID exactly. Never changes. |
| `username` | `string` | Display name. |
| `role` | `string` | `"admin"` `"employee"` `"customer"`. Drives all permission checks. |
| `createdAt` | `Timestamp` | Set once, never updated. |

**Who writes it:** Cloud Function on first login only. No client or Flask route writes directly.
**Who reads it:** Flask middleware on every request to resolve the caller's role.

---

### `ingredients`

The live inventory. Every deduction and restoration flows through these documents.

| Field | Type | Notes |
|---|---|---|
| `ingredientId` | `string` | Auto-generated document ID. |
| `name` | `string` | e.g. `"Oat Milk"`. |
| `amount` | `float` | Current stock. Never goes below 0 by convention (not enforced by Firestore — enforce in Flask). |
| `unit` | `string` | Must match the unit used in every `ingredientSlot` that references this ingredient. |
| `updatedAt` | `Timestamp` | Updated on every write. Triggers the Cloud Function that recomputes `isAvailable`. |

**Critical:** Always use `firestore.Increment()` to modify `amount` — never read-modify-write. `Increment` is atomic and safe against concurrent updates.

---

### `menuItems`

The menu. Each document is self-contained — it holds everything needed to display the item, take an order, and deduct ingredients.

| Field | Type | Notes |
|---|---|---|
| `menuItemId` | `string` | Auto-generated document ID. |
| `name` | `string` | Display name. |
| `recipe` | `string` | Full barista instructions. Newline (`\n`) between steps. |
| `basePrice` | `float` | Price before customization. |
| `isAvailable` | `boolean` | Computed by Cloud Function. **Never sent by the client.** |
| `updatedAt` | `Timestamp` | Updated on every admin write. |
| `ingredientSlots` | `array` | Embedded. Never its own subcollection. See section 4. |

**Note on `ingredientName` inside slots:** The name is denormalized (copied from `ingredients` at the time the admin saves the menu item). If an ingredient is later renamed, `ingredientName` inside slots will be stale until the admin re-saves the menu item. This is acceptable for this project scope.

---

### `orders`

One document per order, across all statuses including completed and canceled (orders are never deleted).

| Field | Type | Notes |
|---|---|---|
| `orderId` | `string` | Auto-generated. |
| `status` | `string` | See lifecycle in section 7. |
| `employeeId` | `string` | FK → `users`. |
| `customerId` | `string\|null` | FK → `users`. Set when a customer links their session. |
| `discountCode` | `string\|null` | FK → `discountCodes`. The code string, not the doc ID (they are the same). |
| `discountAmount` | `float\|null` | THB value of the discount. Stored for display and analytics. |
| `subtotal` | `float` | Sum of all `orderItems[].itemPrice`. Starts at 0. |
| `totalPrice` | `float` | `subtotal − discountAmount`. What the customer pays. Starts at 0. |
| `isTakeaway` | `boolean` | Affects queue sort order. |
| `appearanceTags` | `string[]` | e.g. `["glasses", "red cap"]`. |
| `notes` | `string\|null` | Free-text from employee. |
| `createdAt` | `Timestamp` | Set once at creation. |
| `startedAt` | `Timestamp\|null` | Set when → `ongoing`. |
| `completedAt` | `Timestamp\|null` | Set when → `completed` or `canceled`. |

---

### `orders/{orderId}/orderItems` (subcollection)

One document per line item. Always fetched alongside the parent order when a barista needs full detail. **All text and price fields are snapshots.**

| Field | Type | Notes |
|---|---|---|
| `itemId` | `string` | Auto-generated. |
| `menuItemId` | `string` | FK → `menuItems`. Used to look up current menu data if needed. |
| `menuItemName` | `string` | **Snapshot.** |
| `recipeSnapshot` | `string` | **Snapshot.** The recipe text at the moment the item was added. |
| `basePrice` | `float` | **Snapshot.** |
| `itemPrice` | `float` | Resolved by Flask. Accounts for `overridePrice` or `priceMarkup`. |
| `customizations` | `map` | One key per customized slot. Key = slot `label`. See section 4. |

---

### `discountCodes`

| Field | Type | Notes |
|---|---|---|
| `code` | `string` | Document ID AND field value. e.g. `"DISC-A3F9"`. |
| `type` | `string` | `"percentage"` or `"fixed"`. |
| `value` | `float` | For `"percentage"`: 10 = 10% off. For `"fixed"`: 20 = 20 THB off. |
| `used` | `boolean` | Starts `false`. Set to `true` atomically via Firestore transaction when redeemed. Never reset. |
| `usedInOrderId` | `string\|null` | Set at the same time as `used = true`. |
| `createdAt` | `Timestamp` | When generated. |

---

## 4. Embedded Structures Reference

### `ingredientSlots` — inside `menuItems`

Every slot has a `type` field that determines its shape.

---

#### Type: `"normal"`

Fixed ingredient, fixed amount. No customer choice. Always deducted at the same amount.

```
{
  type           : "normal"
  ingredientId   : string      → FK → ingredients/{id}
  ingredientName : string      (denormalized)
  amount         : float
  unit           : string
}
```

---

#### Type: `"customizable_amount"`

Customer picks from predefined levels. Each level deducts a different amount of the same ingredient.

```
{
  type              : "customizable_amount"
  ingredientId      : string      → FK → ingredients/{id}
  ingredientName    : string      (denormalized)
  unit              : string
  defaultLevelIndex : int         (0-based index into levels[])
  levels            : array of:
    {
      label  : string   (e.g. "None", "Light", "Normal", "Extra")
      amount : float    (e.g. 0, 5, 10, 15)
    }
}
```

---

#### Type: `"customizable_options"`

Customer swaps the default ingredient for an alternative. Each alternative is a different ingredient with its own pricing rule.

```
{
  type    : "customizable_options"
  label   : string      (e.g. "Milk type" — this becomes the key in orderItems.customizations)
  options : array of:
    {
      ingredientId   : string        → FK → ingredients/{id}
      ingredientName : string        (denormalized)
      amount         : float
      unit           : string
      isDefault      : boolean       (exactly one option per slot must be true)
      priceMarkup    : float | null  (added to basePrice — use this OR overridePrice, not both)
      overridePrice  : float | null  (replaces the entire item price — takes priority over priceMarkup)
    }
}
```

**Pricing rule for `customizable_options`:**
- If the chosen option has `overridePrice` set (non-null) → `itemPrice = overridePrice`. Done. `basePrice` and all markups are ignored.
- If the chosen option only has `priceMarkup` → `itemPrice = basePrice + sum(all priceMarkups)`.
- Set the unused field to `null` on every option. Both should never be non-null at the same time.

---

### `customizations` map — inside `orderItems`

One key-value pair per customized slot. The key is the slot's `label` string.

#### Entry for `"customizable_amount"` slots:

```
"<slot label>": {
  type          : "customizable_amount"
  ingredientId  : string
  ingredientName: string
  chosenLabel   : string   (e.g. "Light")
  chosenAmount  : float    (e.g. 5.0)
  unit          : string
}
```

#### Entry for `"customizable_options"` slots:

```
"<slot label>": {
  type                 : "customizable_options"
  chosenIngredientId   : string
  chosenIngredientName : string
  chosenAmount         : float
  unit                 : string
  priceMarkup          : float | null
  overridePrice        : float | null
}
```

`normal` slots are not represented in `customizations` — they have no customer input.

---

## 5. Relationships & Foreign Keys

Firestore has no native joins or enforced foreign keys. These references are maintained by convention and enforced in Flask.

```
users ──────────────────────────────────────────────────────────┐
  uid                                                            │
   │                                                             │
   ├── orders.employeeId  (who took the order)                   │
   └── orders.customerId  (who placed the order, optional)       │
                                                                 │
ingredients ──────────────────────────────────────────────────┐  │
  ingredientId                                                 │  │
   │                                                           │  │
   ├── menuItems.ingredientSlots[].ingredientId                │  │
   │   (normal and customizable_amount slots)                  │  │
   └── menuItems.ingredientSlots[].options[].ingredientId      │  │
       (customizable_options slots)                            │  │
                                                               │  │
menuItems ─────────────────────────────────────────────────┐  │  │
  menuItemId                                                │  │  │
   │                                                        │  │  │
   └── orderItems.menuItemId                                │  │  │
       (reference preserved; actual data is snapshotted)    │  │  │
                                                            │  │  │
orders ─────────────────────────────────────────────────┐  │  │  │
  orderId                                                │  │  │  │
   │                                                     │  │  │  │
   ├── orderItems (subcollection — implicit parent link)  │  │  │  │
   └── discountCodes.usedInOrderId ◄────────────────────┘  │  │  │
                                                            │  │  │
discountCodes ──────────────────────────────────────────┐  │  │  │
  code                                                   │  │  │  │
   │                                                     │  │  │  │
   └── orders.discountCode ◄────────────────────────────┘  │  │  │
                                                            │  │  │
                    [referenced by]  ◄────────────────────┘  │  │
                    [references]     ────────────────────────┘  │
                    [created by]     ──────────────────────────┘
```

---

## 6. How Everything Works Together

Below is the full map of how all collections interact during normal cafe operation.

### Adding a new ingredient (Admin)

```
Admin → Flask POST /ingredients
  └── Flask writes new doc to ingredients/
        └── Cloud Function triggers on write
              └── Checks all menuItems that reference this ingredient
                    └── Updates menuItems[].isAvailable
                          (likely no change since amount > 0 for a new ingredient)
```

### Building the menu (Admin)

```
Admin → Flask POST /menu-items
  └── Admin provides: name, recipe, basePrice, ingredientSlots[]
        └── Each slot references ingredientId(s) from ingredients/
              └── Flask copies ingredientName (denormalized) into each slot
                    └── Flask computes isAvailable by checking current stock
                          └── Writes new doc to menuItems/
```

### Customer browses menu

```
Customer app → Firestore SDK (direct read, no Flask)
  └── onSnapshot on menuItems where isAvailable == true
        └── Returns all available menu items with their ingredientSlots embedded
              (single read per document — no additional joins needed)
```

### Employee takes an order

```
Employee → Flask POST /orders
  └── Flask creates order doc in orders/ with status = "unconfirmed"
        └── orderId is returned immediately to employee
              └── Employee adds items one by one:
                    Flask POST /orders/{id}/items
                      └── Flask reads menuItems/{menuItemId}
                            └── Snapshots: name, recipe, basePrice
                                  └── Resolves itemPrice from customizations
                                        └── Writes to orders/{id}/orderItems/
```

### Employee confirms order

```
Employee → Flask POST /orders/{id}/confirm
  └── Flask reads all docs in orders/{id}/orderItems/
        └── Resolves final itemPrice for each item
              └── Computes subtotal and totalPrice
                    └── Runs batched write to ingredients/ (Increment(-amount) per ingredient)
                          └── Cloud Function triggers on each ingredient write
                                └── Recomputes isAvailable for affected menuItems
                                      └── Flask updates orders/{id}: status = "on_queue"
                                            └── Customer's onSnapshot sees queue position
                                                  └── Queue screen's onSnapshot sees new order
```

### Barista starts an order

```
Employee → Flask POST /orders/{id}/start
  └── Flask validates: status must be "on_queue"
        └── Flask updates orders/{id}: status = "ongoing", startedAt = now
              └── Customer's onSnapshot updates: "Currently being made"
                    └── Queue screen moves this order to top
```

### Order completed

```
Employee → Flask POST /orders/{id}/complete
  └── Flask validates: status must be "ongoing"
        └── Flask updates orders/{id}: status = "completed", completedAt = now
              └── Customer's onSnapshot updates: "Ready at pickup counter"
                    └── Order is now queryable in analytics (status == "completed")
```

### Order canceled

```
Employee → Flask POST /orders/{id}/cancel
  └── Flask validates: status must be "on_queue" or "ongoing"
        └── Flask reads all docs in orders/{id}/orderItems/
              └── Runs batched write to ingredients/ (Increment(+amount) — restores stock)
                    └── Cloud Function triggers → recomputes isAvailable for affected menuItems
                          └── Flask updates orders/{id}: status = "canceled", completedAt = now
                                └── Customer's onSnapshot updates: "Canceled — see counter"
```

### Discount code flow

```
Customer → Flask POST /discount-codes/generate
  └── Flask generates code: "DISC-XXXX" (checksum-verified format)
        └── Flask writes to discountCodes/{code}: used = false
              └── Customer shows code to employee

Employee → Flask POST /orders/{id}/discount  { code: "DISC-XXXX" }
  └── Flask verifies format (no DB read needed for format check)
        └── Flask opens Firestore transaction:
              ├── Reads discountCodes/{code} — checks used == false
              ├── Reads orders/{id} — checks status == "unconfirmed"
              ├── Computes discount amount
              ├── Writes discountCodes/{code}: used = true, usedInOrderId = orderId
              └── Writes orders/{id}: discountCode, discountAmount, totalPrice updated
```

---

## 7. The Order Lifecycle (Critical Flow)

### Valid status transitions

```
unconfirmed ──→ on_queue      (confirm — deducts inventory)
on_queue    ──→ ongoing       (start making)
on_queue    ──→ canceled      (cancel before started — restores inventory)
ongoing     ──→ completed     (done)
ongoing     ──→ canceled      (cancel mid-process — restores inventory)
```

**No other transitions are valid.** Flask must reject any other transition attempt with a 400 error.

### What changes at each transition

| Transition | Fields updated on `orders` doc | Side effects |
|---|---|---|
| Created (`unconfirmed`) | All fields set, `subtotal = 0`, `totalPrice = 0` | None |
| Items added | `orderItems` subcollection grows | None |
| Discount applied | `discountCode`, `discountAmount`, `totalPrice` | `discountCodes/{code}.used = true` (transaction) |
| `→ on_queue` | `status`, `subtotal`, `totalPrice` | Inventory deducted (batch write) |
| `→ ongoing` | `status`, `startedAt` | None |
| `→ completed` | `status`, `completedAt` | None |
| `→ canceled` | `status`, `completedAt` | Inventory restored (batch write) |

### Timestamps and their purpose

| Timestamp | When set | Used for |
|---|---|---|
| `createdAt` | On order creation | Queue sort order (older = higher) |
| `startedAt` | On → `ongoing` | Elapsed time display; fulfillment time analytics |
| `completedAt` | On → `completed` or `canceled` | Analytics; order history display |

---

## 8. Inventory Rules

### Rule 1 — Always use `Increment`, never read-modify-write

```python
# CORRECT
batch.update(ref, { "amount": firestore.Increment(-30.0) })

# WRONG — race condition if two orders confirm simultaneously
current = doc.get().to_dict()["amount"]
ref.update({ "amount": current - 30.0 })
```

### Rule 2 — Deduction happens only on `→ on_queue`

Not when items are added (`unconfirmed`). Not when started (`ongoing`). Only on confirm.

### Rule 3 — Restoration happens only on `canceled`

And only if the order was previously confirmed (i.e. was in `on_queue` or `ongoing`). An `unconfirmed` order that is deleted or abandoned does not trigger any inventory change because nothing was ever deducted.

### Rule 4 — What gets deducted per slot type

| Slot type | Ingredient deducted | Amount deducted |
|---|---|---|
| `normal` | `slot.ingredientId` | `slot.amount` |
| `customizable_amount` | `slot.ingredientId` | `customizations[label].chosenAmount` |
| `customizable_options` | `customizations[label].chosenIngredientId` | `customizations[label].chosenAmount` |

### Rule 5 — `amount` should never go below 0

Flask should check that `current amount >= deduction amount` before committing the batch write. If stock is insufficient, reject the confirm with a 400 error and tell the client which ingredient is short.

---

## 9. Pricing Rules

### Item price resolution — applied by Flask when an item is added

```
1. Look at all customizable_options choices in customizations map.
2. If ANY chosen option has overridePrice != null:
       itemPrice = that overridePrice
       STOP. basePrice and all markups are ignored.
3. Otherwise:
       itemPrice = basePrice + sum(priceMarkup for all chosen options)
```

### Edge case — two options with `overridePrice` in one order item

This should not happen by design (one selection per slot). If it does, **last override wins** — iterate through the customizations map in insertion order and use the final non-null `overridePrice` found.

### Order totals

```
subtotal   = sum(itemPrice for all orderItems)
discountAmount = calculated from discountCodes.type and discountCodes.value
totalPrice = max(subtotal - discountAmount, 0.0)    ← never goes negative
```

### Discount calculation

```
if discountCodes.type == "percentage":
    discountAmount = subtotal * (value / 100)
if discountCodes.type == "fixed":
    discountAmount = min(value, subtotal)   ← can't discount more than the total
```

---

## 10. Discount Code Rules

| Rule | Detail |
|---|---|
| Format | `DISC-` followed by exactly 4 uppercase alphanumeric characters |
| Verifiability | The 4th character is a checksum of the first 3. Flask can verify format without a DB read. |
| Single-use | `used` is set to `true` atomically in a Firestore **transaction**. Two simultaneous redemptions of the same code will result in exactly one succeeding. |
| Timing | Can only be applied to an `unconfirmed` order. Cannot apply after confirming. |
| Who generates | Customer (via Flask `POST /discount-codes/generate`). The code is shown to the employee. |
| Who validates | Flask only. Never the client directly. |
| Storage | The code string is both the field value and the document ID in `discountCodes`. |

---

## 11. Menu Availability Rules

### What "out of stock" means

A menu item is `isAvailable = false` if **any required ingredient has `amount <= 0`**.

For `normal` and `customizable_amount` slots: check `slot.ingredientId`.
For `customizable_options` slots: check only the **default option's** `ingredientId` (the one where `isDefault = true`). If the default is out of stock, the item is unavailable even if alternatives are in stock.

### Who updates `isAvailable`

**Only the Cloud Function.** It triggers on every write to any `ingredients` document (including batched writes) and recomputes `isAvailable` for all affected menu items.

Flask **never** writes `isAvailable` directly. Clients **never** send `isAvailable` in requests. If a client sends this field, Flask must ignore it.

### Propagation chain

```
Flask batch-writes ingredients/ (deduct or restore)
  └── Firestore triggers onIngredientUpdated Cloud Function for each changed doc
        └── Cloud Function scans all menuItems
              └── For each menuItem using the changed ingredient:
                    └── Checks all required ingredient stock levels
                          └── Writes menuItems/{id}.isAvailable = true/false
                                └── Customer app's onSnapshot on menuItems fires
                                      └── Out-of-stock items disappear from menu in real time
```

---

## 12. Who Reads and Writes What

### Firestore security model

| Collection | Public (no auth) | Customer | Employee | Admin | Cloud Function / Flask Admin SDK |
|---|---|---|---|---|---|
| `users` | ✗ | Own doc only (read) | Own doc only (read) | Own doc only (read) | Full access |
| `ingredients` | ✗ | ✗ | Read + write amount | Full CRUD | Full access |
| `menuItems` | Read | Read | Read | Full CRUD | Full access |
| `orders` | ✗ | Own order (read) | Full CRUD | Full CRUD | Full access |
| `orderItems` | ✗ | Own order's items (read) | Full CRUD | Full CRUD | Full access |
| `discountCodes` | ✗ | Read (own code) | Read | Read | Full access |

### Flask Admin SDK bypasses security rules

Flask uses the Firebase Admin SDK with a service account key. This bypasses all Firestore security rules. Flask is therefore responsible for enforcing its own permission checks via the `@require_auth` middleware.

---

## 13. What Flask Owns vs What the Client Can Do

This boundary is important. Crossing it breaks atomicity and correctness.

### Flask owns exclusively (never let the client do these)

| Operation | Reason |
|---|---|
| Inventory deduction / restoration | Must be atomic across multiple documents. `Increment` + batch write. |
| Discount code validation and application | Requires Firestore transaction. Race condition risk. |
| `itemPrice` resolution | Business logic (`overridePrice` vs `priceMarkup` rules). |
| `subtotal` and `totalPrice` computation | Depends on `itemPrice` resolution. |
| Status transitions | Must enforce valid transitions and trigger side effects. |
| Writing `isAvailable` | Cloud Function only. Flask never touches this field directly. |
| Writing `users` documents | Cloud Function only. |

### Clients can do directly (Firestore SDK, no Flask)

| Operation | Notes |
|---|---|
| Real-time queue listener | `onSnapshot` on `orders` filtered by status. |
| Real-time order status tracker | `onSnapshot` on `orders/{orderId}`. |
| Real-time menu display | `onSnapshot` on `menuItems` filtered by `isAvailable`. |

Everything else — any write that changes business state — goes through Flask.

---

## 14. Field Snapshot Policy

When an `orderItems` document is created, the following fields are **copied from the current state of `menuItems`** and stored directly on the order item:

| Field on `orderItems` | Source | Why snapshotted |
|---|---|---|
| `menuItemName` | `menuItems.name` | Menu item could be renamed later |
| `recipeSnapshot` | `menuItems.recipe` | Recipe could be updated; barista history must reflect what was current |
| `basePrice` | `menuItems.basePrice` | Price could change; order history must reflect what was charged |

**The `menuItemId` FK is still stored** so that if needed, Flask can look up the current menu item (e.g. to compare with a snapshot or for admin tools). But for display purposes, always use the snapshot fields.

**Fields NOT snapshotted** (these are resolved at order time, not copied from the menu):

| Field | Notes |
|---|---|
| `itemPrice` | Computed by Flask at the time items are added, based on chosen customizations |
| `customizations` | Entered fresh per order — no source doc to snapshot from |

---

## 15. Quick Reference — Field Types Cheatsheet

| Firestore type | Used for | Example |
|---|---|---|
| `string` | IDs, names, labels, status values, units | `"on_queue"`, `"Oat Milk"`, `"ml"` |
| `float` | All numeric quantities (prices, amounts) | `120.0`, `30.0`, `10.5` |
| `int` | Index values only | `defaultLevelIndex: 2` |
| `boolean` | Flags | `isAvailable`, `isTakeaway`, `used` |
| `Timestamp` | All date/time fields | `createdAt`, `updatedAt`, `startedAt` |
| `string[]` | Tag lists | `appearanceTags: ["glasses", "red cap"]` |
| `array` | Embedded slot and level lists | `ingredientSlots`, `levels` |
| `map` | Structured sub-objects | `customizations` on `orderItems` |
| `null` | Optional fields not yet set | `customerId`, `startedAt`, `discountCode` |

**Use `firestore.SERVER_TIMESTAMP`** for all timestamp writes — never send a client-generated timestamp. This ensures consistency across time zones and prevents clock skew.

**Use `float` for all quantities and prices** — not `int`. Even whole numbers like `120` should be stored as `120.0` to avoid type inconsistencies in Pandas and across platforms.
