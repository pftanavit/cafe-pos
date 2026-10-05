# Cafe POS — API Usage Examples

> All requests require `Authorization: Bearer <firebase_id_token>` unless marked **Public**.
> All bodies are `Content-Type: application/json`.
> Base URL: `http://localhost:5000` (dev)

---

## Table of Contents

1. [Ingredients — Add / Edit / Delete](#1-ingredients)
2. [Menu Items — Add / Edit / Delete](#2-menu-items)
3. [Orders — Full Lifecycle](#3-orders)
4. [Discount Codes — Generate & Apply](#4-discount-codes)
5. [Queue — Reading the Live Queue](#5-queue)
6. [Analytics](#6-analytics)

---

## 1. Ingredients

### 1.1 — Add a new ingredient

**Role required:** Admin

```http
POST /ingredients
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Oat Milk",
  "amount": 3000.0,
  "unit": "ml"
}
```

**Response `201`:**
```json
{
  "ingredientId": "xK92mLpQaT",
  "name": "Oat Milk",
  "amount": 3000.0,
  "unit": "ml",
  "updatedAt": "2026-05-11T10:00:00Z"
}
```

> After this write, the Cloud Function fires and checks if any menu items that use Oat Milk should now become `isAvailable = true`.

---

### 1.2 — Add more examples (all ingredients we'll use later)

```http
POST /ingredients    →   { "name": "Espresso",       "amount": 5000.0, "unit": "ml" }
POST /ingredients    →   { "name": "Whole Milk",      "amount": 4000.0, "unit": "ml" }
POST /ingredients    →   { "name": "Almond Milk",     "amount": 2000.0, "unit": "ml" }
POST /ingredients    →   { "name": "Syrup",           "amount": 1000.0, "unit": "ml" }
POST /ingredients    →   { "name": "Standard Beans",  "amount": 500.0,  "unit": "g"  }
POST /ingredients    →   { "name": "Premium Beans",   "amount": 300.0,  "unit": "g"  }
POST /ingredients    →   { "name": "Whipped Cream",   "amount": 800.0,  "unit": "ml" }
POST /ingredients    →   { "name": "Chocolate Sauce", "amount": 600.0,  "unit": "ml" }
```

Assume each returns an auto-generated `ingredientId`. We'll use these IDs below:

| Name | ID used in examples |
|---|---|
| Oat Milk | `ing_oat_milk` |
| Espresso | `ing_espresso` |
| Whole Milk | `ing_whole_milk` |
| Almond Milk | `ing_almond_milk` |
| Syrup | `ing_syrup` |
| Standard Beans | `ing_std_beans` |
| Premium Beans | `ing_prem_beans` |
| Whipped Cream | `ing_whip_cream` |
| Chocolate Sauce | `ing_choc_sauce` |

---

### 1.3 — Edit an ingredient (update stock amount)

**Role required:** Employee or Admin

```http
PATCH /ingredients/ing_oat_milk
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "amount": 2500.0
}
```

**Response `200`:**
```json
{
  "ingredientId": "ing_oat_milk",
  "name": "Oat Milk",
  "amount": 2500.0,
  "unit": "ml",
  "updatedAt": "2026-05-11T10:05:00Z"
}
```

---

### 1.4 — Edit an ingredient (rename + change unit)

**Role required:** Admin only

```http
PATCH /ingredients/ing_oat_milk
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Oat Milk (Barista Edition)",
  "unit": "ml"
}
```

> **Note:** Renaming an ingredient does NOT automatically update `ingredientName` inside `menuItems.ingredientSlots`. That denormalized field becomes stale. The admin must re-save any affected menu items to sync the name.

---

### 1.5 — Get all ingredients

**Role required:** Employee or Admin

```http
GET /ingredients
Authorization: Bearer <employee_token>
```

**Response `200`:**
```json
[
  { "ingredientId": "ing_oat_milk",    "name": "Oat Milk",        "amount": 2500.0, "unit": "ml" },
  { "ingredientId": "ing_espresso",    "name": "Espresso",        "amount": 5000.0, "unit": "ml" },
  { "ingredientId": "ing_whole_milk",  "name": "Whole Milk",      "amount": 4000.0, "unit": "ml" },
  { "ingredientId": "ing_syrup",       "name": "Syrup",           "amount": 1000.0, "unit": "ml" },
  { "ingredientId": "ing_std_beans",   "name": "Standard Beans",  "amount": 500.0,  "unit": "g"  }
]
```

---

### 1.6 — Delete an ingredient

**Role required:** Admin

```http
DELETE /ingredients/ing_almond_milk
Authorization: Bearer <admin_token>
```

**Response `200`:**
```json
{ "deleted": "ing_almond_milk" }
```

> **Warning:** Deleting an ingredient does NOT cascade. Any menu item with an `ingredientSlot` referencing `ing_almond_milk` will now point to a non-existent ingredient. The Cloud Function will mark those menu items `isAvailable = false`. The admin should also remove or update those menu items manually.

---

---

## 2. Menu Items

We'll create two realistic menu items:

- **Oat Latte** — demonstrates all three slot types
- **Mocha** — demonstrates multiple normal slots + customizable level + customizable options with override price

---

### 2.1 — Create "Oat Latte" (all three slot types)

**Role required:** Admin

```http
POST /menu-items
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Oat Latte",
  "recipe": "1. Grind and pull a double shot espresso into the cup.\n2. Steam oat milk in a large pitcher to ~65°C — aim for a thin, velvety layer of microfoam.\n3. Hold the foam back with a spoon and pour steamed milk over the espresso.\n4. Spoon a thin layer of microfoam on top to finish.",
  "basePrice": 120.0,
  "ingredientSlots": [

    {
      "type": "normal",
      "ingredientId": "ing_espresso",
      "ingredientName": "Espresso",
      "amount": 30.0,
      "unit": "ml"
    },

    {
      "type": "customizable_amount",
      "ingredientId": "ing_syrup",
      "ingredientName": "Syrup",
      "unit": "ml",
      "defaultLevelIndex": 2,
      "levels": [
        { "label": "None",   "amount": 0.0  },
        { "label": "Light",  "amount": 5.0  },
        { "label": "Normal", "amount": 10.0 },
        { "label": "Extra",  "amount": 15.0 }
      ]
    },

    {
      "type": "customizable_options",
      "label": "Milk type",
      "options": [
        {
          "ingredientId": "ing_whole_milk",
          "ingredientName": "Whole Milk",
          "amount": 200.0,
          "unit": "ml",
          "isDefault": true,
          "priceMarkup": 0.0,
          "overridePrice": null
        },
        {
          "ingredientId": "ing_oat_milk",
          "ingredientName": "Oat Milk",
          "amount": 200.0,
          "unit": "ml",
          "isDefault": false,
          "priceMarkup": 15.0,
          "overridePrice": null
        },
        {
          "ingredientId": "ing_almond_milk",
          "ingredientName": "Almond Milk",
          "amount": 200.0,
          "unit": "ml",
          "isDefault": false,
          "priceMarkup": null,
          "overridePrice": 160.0
        }
      ]
    }

  ]
}
```

**Response `201`:**
```json
{
  "menuItemId": "menu_oat_latte",
  "name": "Oat Latte",
  "recipe": "1. Grind and pull a double shot...",
  "basePrice": 120.0,
  "isAvailable": true,
  "updatedAt": "2026-05-11T10:10:00Z",
  "ingredientSlots": [ ... ]
}
```

> Flask computes `isAvailable` immediately by checking current stock of `ing_espresso`, `ing_syrup`, and `ing_whole_milk` (the default milk). Since all have `amount > 0`, it is set to `true`.

---

### 2.2 — Create "Mocha" (multiple normals + customizable level + options with override)

```http
POST /menu-items
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Mocha",
  "recipe": "1. Pull a double shot espresso.\n2. Add chocolate sauce and stir until combined.\n3. Steam whole milk to ~65°C.\n4. Pour milk over the espresso-chocolate base.\n5. Top with whipped cream and a drizzle of chocolate sauce.",
  "basePrice": 140.0,
  "ingredientSlots": [

    {
      "type": "normal",
      "ingredientId": "ing_espresso",
      "ingredientName": "Espresso",
      "amount": 30.0,
      "unit": "ml"
    },

    {
      "type": "normal",
      "ingredientId": "ing_choc_sauce",
      "ingredientName": "Chocolate Sauce",
      "amount": 20.0,
      "unit": "ml"
    },

    {
      "type": "normal",
      "ingredientId": "ing_whip_cream",
      "ingredientName": "Whipped Cream",
      "amount": 30.0,
      "unit": "ml"
    },

    {
      "type": "customizable_amount",
      "ingredientId": "ing_syrup",
      "ingredientName": "Syrup",
      "unit": "ml",
      "defaultLevelIndex": 1,
      "levels": [
        { "label": "None",  "amount": 0.0 },
        { "label": "Light", "amount": 5.0 },
        { "label": "Extra", "amount": 15.0 }
      ]
    },

    {
      "type": "customizable_options",
      "label": "Coffee beans",
      "options": [
        {
          "ingredientId": "ing_std_beans",
          "ingredientName": "Standard Beans",
          "amount": 18.0,
          "unit": "g",
          "isDefault": true,
          "priceMarkup": 0.0,
          "overridePrice": null
        },
        {
          "ingredientId": "ing_prem_beans",
          "ingredientName": "Premium Beans",
          "amount": 18.0,
          "unit": "g",
          "isDefault": false,
          "priceMarkup": 30.0,
          "overridePrice": null
        },
        {
          "ingredientId": "ing_prem_beans",
          "ingredientName": "Premium Beans (Decaf)",
          "amount": 18.0,
          "unit": "g",
          "isDefault": false,
          "priceMarkup": null,
          "overridePrice": 200.0
        }
      ]
    }

  ]
}
```

**Response `201`:**
```json
{
  "menuItemId": "menu_mocha",
  "name": "Mocha",
  "basePrice": 140.0,
  "isAvailable": true,
  ...
}
```

---

### 2.3 — Edit a menu item (change price and add a syrup level)

**Role required:** Admin

Send the full updated document — this is a `PUT` (full replace), not a partial update.

```http
PUT /menu-items/menu_oat_latte
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Oat Latte",
  "recipe": "1. Grind and pull a double shot espresso into the cup.\n2. Steam oat milk in a large pitcher to ~65°C — aim for a thin, velvety layer of microfoam.\n3. Hold the foam back with a spoon and pour steamed milk over the espresso.\n4. Spoon a thin layer of microfoam on top to finish.",
  "basePrice": 125.0,
  "ingredientSlots": [
    {
      "type": "normal",
      "ingredientId": "ing_espresso",
      "ingredientName": "Espresso",
      "amount": 30.0,
      "unit": "ml"
    },
    {
      "type": "customizable_amount",
      "ingredientId": "ing_syrup",
      "ingredientName": "Syrup",
      "unit": "ml",
      "defaultLevelIndex": 2,
      "levels": [
        { "label": "None",      "amount": 0.0  },
        { "label": "Light",     "amount": 5.0  },
        { "label": "Normal",    "amount": 10.0 },
        { "label": "Extra",     "amount": 15.0 },
        { "label": "Very Extra","amount": 20.0 }
      ]
    },
    {
      "type": "customizable_options",
      "label": "Milk type",
      "options": [
        {
          "ingredientId": "ing_whole_milk",
          "ingredientName": "Whole Milk",
          "amount": 200.0, "unit": "ml",
          "isDefault": true, "priceMarkup": 0.0, "overridePrice": null
        },
        {
          "ingredientId": "ing_oat_milk",
          "ingredientName": "Oat Milk",
          "amount": 200.0, "unit": "ml",
          "isDefault": false, "priceMarkup": 15.0, "overridePrice": null
        },
        {
          "ingredientId": "ing_almond_milk",
          "ingredientName": "Almond Milk",
          "amount": 200.0, "unit": "ml",
          "isDefault": false, "priceMarkup": null, "overridePrice": 165.0
        }
      ]
    }
  ]
}
```

**Response `200`:**
```json
{
  "menuItemId": "menu_oat_latte",
  "name": "Oat Latte",
  "basePrice": 125.0,
  "isAvailable": true,
  "updatedAt": "2026-05-11T11:00:00Z"
}
```

> **Note:** Existing `orderItems` that reference this menu item are NOT affected — they already have `basePrice: 120.0` and `recipeSnapshot` from when they were ordered. Snapshots protect historical accuracy.

---

### 2.4 — Partial edit (update only recipe text)

```http
PATCH /menu-items/menu_mocha
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "recipe": "1. Pull a double shot espresso.\n2. Add 20ml chocolate sauce and stir.\n3. Steam whole milk to 65°C with medium microfoam.\n4. Pour milk over the base.\n5. Top with whipped cream. Serve immediately."
}
```

**Response `200`:**
```json
{
  "menuItemId": "menu_mocha",
  "name": "Mocha",
  "recipe": "1. Pull a double shot espresso...",
  "updatedAt": "2026-05-11T11:05:00Z"
}
```

---

### 2.5 — Delete a menu item

**Role required:** Admin

```http
DELETE /menu-items/menu_mocha
Authorization: Bearer <admin_token>
```

**Response `200`:**
```json
{ "deleted": "menu_mocha" }
```

> Deleting a menu item does not affect existing `orderItems` that reference it — those still hold their snapshots. The menu item simply no longer appears in future menu reads.

---

---

## 3. Orders

We'll walk through the **complete lifecycle** of one order:

> **Scenario:** Customer orders 1× Oat Latte (Oat Milk, Light syrup) + 1× Mocha (Premium Beans, Extra syrup). Has a discount code. Takeaway.

---

### 3.1 — Create a new order (status: `unconfirmed`)

**Role required:** Employee

```http
POST /orders
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "isTakeaway": true,
  "notes": "Extra hot on the latte please",
  "appearanceTags": ["glasses", "blue cap", "tall"]
}
```

**Response `201`:**
```json
{
  "orderId": "order_001",
  "status": "unconfirmed",
  "employeeId": "emp_uid_somchai",
  "customerId": null,
  "discountCode": null,
  "discountAmount": null,
  "subtotal": 0.0,
  "totalPrice": 0.0,
  "isTakeaway": true,
  "appearanceTags": ["glasses", "blue cap", "tall"],
  "notes": "Extra hot on the latte please",
  "createdAt": "2026-05-11T11:10:00Z",
  "startedAt": null,
  "completedAt": null
}
```

> The order ID `order_001` is created immediately. The customer can show this ID to match with their generated discount code at any point during the `unconfirmed` phase.

---

### 3.2 — Add first item: Oat Latte (Oat Milk + Light syrup)

**Role required:** Employee

The employee fills in the customizations for each slot. `normal` slots don't appear in customizations — they are always deducted as-is.

```http
POST /orders/order_001/items
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "menuItemId": "menu_oat_latte",
  "customizations": {
    "Sweetness": {
      "type": "customizable_amount",
      "ingredientId": "ing_syrup",
      "ingredientName": "Syrup",
      "chosenLabel": "Light",
      "chosenAmount": 5.0,
      "unit": "ml"
    },
    "Milk type": {
      "type": "customizable_options",
      "chosenIngredientId": "ing_oat_milk",
      "chosenIngredientName": "Oat Milk",
      "chosenAmount": 200.0,
      "unit": "ml",
      "priceMarkup": 15.0,
      "overridePrice": null
    }
  }
}
```

**What Flask does internally:**
1. Reads `menuItems/menu_oat_latte`
2. Snapshots: `menuItemName = "Oat Latte"`, `recipeSnapshot = "1. Grind and pull..."`, `basePrice = 125.0`
3. Resolves `itemPrice`:
   - No `overridePrice` set on any chosen option
   - `itemPrice = basePrice + priceMarkup = 125.0 + 15.0 = 140.0`
4. Writes to `orders/order_001/orderItems/item_001`

**Response `201`:**
```json
{
  "itemId": "item_001",
  "menuItemId": "menu_oat_latte",
  "menuItemName": "Oat Latte",
  "recipeSnapshot": "1. Grind and pull a double shot espresso into the cup.\n2. Steam oat milk...",
  "basePrice": 125.0,
  "itemPrice": 140.0,
  "customizations": {
    "Sweetness": {
      "type": "customizable_amount",
      "ingredientId": "ing_syrup",
      "ingredientName": "Syrup",
      "chosenLabel": "Light",
      "chosenAmount": 5.0,
      "unit": "ml"
    },
    "Milk type": {
      "type": "customizable_options",
      "chosenIngredientId": "ing_oat_milk",
      "chosenIngredientName": "Oat Milk",
      "chosenAmount": 200.0,
      "unit": "ml",
      "priceMarkup": 15.0,
      "overridePrice": null
    }
  }
}
```

---

### 3.3 — Add second item: Mocha (Premium Beans + Extra syrup)

```http
POST /orders/order_001/items
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "menuItemId": "menu_mocha",
  "customizations": {
    "Sweetness": {
      "type": "customizable_amount",
      "ingredientId": "ing_syrup",
      "ingredientName": "Syrup",
      "chosenLabel": "Extra",
      "chosenAmount": 15.0,
      "unit": "ml"
    },
    "Coffee beans": {
      "type": "customizable_options",
      "chosenIngredientId": "ing_prem_beans",
      "chosenIngredientName": "Premium Beans",
      "chosenAmount": 18.0,
      "unit": "g",
      "priceMarkup": 30.0,
      "overridePrice": null
    }
  }
}
```

**What Flask does internally:**
1. Reads `menuItems/menu_mocha`
2. Snapshots: `menuItemName = "Mocha"`, `basePrice = 140.0`
3. Resolves `itemPrice`:
   - No `overridePrice`
   - `itemPrice = 140.0 + 30.0 = 170.0`

**Response `201`:**
```json
{
  "itemId": "item_002",
  "menuItemId": "menu_mocha",
  "menuItemName": "Mocha",
  "basePrice": 140.0,
  "itemPrice": 170.0,
  "customizations": {
    "Sweetness": {
      "type": "customizable_amount",
      "chosenLabel": "Extra",
      "chosenAmount": 15.0,
      ...
    },
    "Coffee beans": {
      "type": "customizable_options",
      "chosenIngredientName": "Premium Beans",
      "priceMarkup": 30.0,
      "overridePrice": null,
      ...
    }
  }
}
```

---

### 3.3b — Edit an existing order item (customer changes mind: Normal syrup instead of Extra)

```http
PATCH /orders/order_001/items/item_002
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "customizations": {
    "Sweetness": {
      "type": "customizable_amount",
      "ingredientId": "ing_syrup",
      "ingredientName": "Syrup",
      "chosenLabel": "Light",
      "chosenAmount": 5.0,
      "unit": "ml"
    },
    "Coffee beans": {
      "type": "customizable_options",
      "chosenIngredientId": "ing_prem_beans",
      "chosenIngredientName": "Premium Beans",
      "chosenAmount": 18.0,
      "unit": "g",
      "priceMarkup": 30.0,
      "overridePrice": null
    }
  }
}
```

Flask re-resolves `itemPrice` and overwrites the `orderItems/item_002` document. `itemPrice` stays `170.0` since only the syrup level changed (syrup has no price effect).

---

### 3.3c — Delete an order item

If the customer removes the Mocha entirely:

```http
DELETE /orders/order_001/items/item_002
Authorization: Bearer <employee_token>
```

**Response `200`:**
```json
{ "deleted": "item_002", "orderId": "order_001" }
```

> Only valid while order is `unconfirmed`. After confirmation, items cannot be removed.

---

### 3.4 — Apply a discount code

The customer shows their generated code `DISC-A3F9` to the employee.

```http
POST /orders/order_001/discount
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "code": "DISC-A3F9"
}
```

**What Flask does internally (Firestore transaction):**
1. Verifies code format passes checksum (no DB read needed)
2. Opens transaction:
   - Reads `discountCodes/DISC-A3F9` → `used: false`, `type: "fixed"`, `value: 20.0`
   - Reads `orders/order_001` → `status: "unconfirmed"`, `subtotal: 140.0` (just item_001, since item_002 was deleted)
   - Computes `discountAmount = min(20.0, 140.0) = 20.0`
   - Computes `totalPrice = 140.0 - 20.0 = 120.0`
   - Writes `discountCodes/DISC-A3F9`: `used = true`, `usedInOrderId = "order_001"`
   - Writes `orders/order_001`: `discountCode = "DISC-A3F9"`, `discountAmount = 20.0`, `totalPrice = 120.0`
3. Commits transaction

**Response `200`:**
```json
{
  "orderId": "order_001",
  "discountCode": "DISC-A3F9",
  "subtotal": 140.0,
  "discountAmount": 20.0,
  "totalPrice": 120.0
}
```

---

### 3.5 — Confirm the order (status: `unconfirmed` → `on_queue`)

This is the most important step. Inventory is deducted here.

```http
POST /orders/order_001/confirm
Authorization: Bearer <employee_token>
```

**What Flask does internally:**
1. Reads all docs from `orders/order_001/orderItems/` → finds `item_001` (Oat Latte, Oat Milk, Light syrup)
2. Resolves and writes `itemPrice` on each item (re-confirmed to be correct)
3. Computes:
   - `subtotal = 140.0`
   - `discountAmount = 20.0`
   - `totalPrice = 120.0`
4. Builds ingredient deduction map:

   | Ingredient | Slot type | Amount |
   |---|---|---|
   | `ing_espresso` | normal | −30.0 ml |
   | `ing_syrup` | customizable_amount (Light) | −5.0 ml |
   | `ing_oat_milk` | customizable_options (chosen) | −200.0 ml |

5. Runs batched write — `Increment(-amount)` on each ingredient
6. Cloud Function fires for each ingredient write → recomputes `isAvailable` on affected menu items
7. Updates `orders/order_001`: `status = "on_queue"`

**Response `200`:**
```json
{
  "orderId": "order_001",
  "status": "on_queue",
  "subtotal": 140.0,
  "discountAmount": 20.0,
  "totalPrice": 120.0
}
```

> From this point, the customer's live tracker shows their queue position. The queue screen shows `order_001` in the active list.

---

### 3.6 — Start making the order (status: `on_queue` → `ongoing`)

```http
POST /orders/order_001/start
Authorization: Bearer <employee_token>
```

**Response `200`:**
```json
{
  "orderId": "order_001",
  "status": "ongoing",
  "startedAt": "2026-05-11T11:18:00Z"
}
```

> Customer's tracker updates to "Currently being made". Order moves to top of queue list.

---

### 3.7a — Complete the order (status: `ongoing` → `completed`)

```http
POST /orders/order_001/complete
Authorization: Bearer <employee_token>
```

**Response `200`:**
```json
{
  "orderId": "order_001",
  "status": "completed",
  "completedAt": "2026-05-11T11:24:00Z"
}
```

> Customer's tracker shows "Ready at pickup counter". Order is now queryable in analytics.

---

### 3.7b — OR: Cancel the order (status: `ongoing` → `canceled`)

If the order is cancelled instead:

```http
POST /orders/order_001/cancel
Authorization: Bearer <employee_token>
```

**What Flask does internally:**
1. Reads all `orderItems` for `order_001`
2. Rebuilds deduction map (same as confirm, but in reverse)
3. Runs batched write — `Increment(+amount)` on each ingredient (restores stock):

   | Ingredient | Restored |
   |---|---|
   | `ing_espresso` | +30.0 ml |
   | `ing_syrup` | +5.0 ml |
   | `ing_oat_milk` | +200.0 ml |

4. Cloud Function fires → recomputes `isAvailable`
5. Updates `orders/order_001`: `status = "canceled"`, `completedAt = now`

**Response `200`:**
```json
{
  "orderId": "order_001",
  "status": "canceled",
  "completedAt": "2026-05-11T11:20:00Z"
}
```

> Customer's tracker shows "Canceled — please see the counter".

---

### 3.8 — Get a single order (with all items)

```http
GET /orders/order_001
Authorization: Bearer <employee_token>
```

**Response `200`:**
```json
{
  "orderId": "order_001",
  "status": "completed",
  "employeeId": "emp_uid_somchai",
  "customerId": null,
  "discountCode": "DISC-A3F9",
  "discountAmount": 20.0,
  "subtotal": 140.0,
  "totalPrice": 120.0,
  "isTakeaway": true,
  "appearanceTags": ["glasses", "blue cap", "tall"],
  "notes": "Extra hot on the latte please",
  "createdAt": "2026-05-11T11:10:00Z",
  "startedAt": "2026-05-11T11:18:00Z",
  "completedAt": "2026-05-11T11:24:00Z",
  "items": [
    {
      "itemId": "item_001",
      "menuItemId": "menu_oat_latte",
      "menuItemName": "Oat Latte",
      "recipeSnapshot": "1. Grind and pull a double shot espresso into the cup.\n2. Steam oat milk...",
      "basePrice": 125.0,
      "itemPrice": 140.0,
      "customizations": {
        "Sweetness": {
          "type": "customizable_amount",
          "chosenLabel": "Light",
          "chosenAmount": 5.0,
          "unit": "ml"
        },
        "Milk type": {
          "type": "customizable_options",
          "chosenIngredientName": "Oat Milk",
          "chosenAmount": 200.0,
          "unit": "ml",
          "priceMarkup": 15.0,
          "overridePrice": null
        }
      }
    }
  ]
}
```

---

### 3.9 — List orders filtered by status

```http
GET /orders?status=on_queue
Authorization: Bearer <employee_token>
```

```http
GET /orders?status=completed&from=2026-05-11&to=2026-05-11
Authorization: Bearer <admin_token>
```

---

---

## 4. Discount Codes

### 4.1 — Customer generates a discount code

```http
POST /discount-codes/generate
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "type": "fixed",
  "value": 20.0
}
```

**What Flask does:**
1. Generates suffix: e.g. `A3F` → computes checksum character `9` → suffix = `A3F9`
2. Full code: `DISC-A3F9`
3. Writes to `discountCodes/DISC-A3F9`: `used: false`

**Response `201`:**
```json
{
  "code": "DISC-A3F9",
  "type": "fixed",
  "value": 20.0,
  "used": false,
  "createdAt": "2026-05-11T11:08:00Z"
}
```

---

### 4.2 — Employee checks a code before applying (optional pre-check)

```http
GET /discount-codes/DISC-A3F9
Authorization: Bearer <employee_token>
```

**Response `200`:**
```json
{
  "code": "DISC-A3F9",
  "type": "fixed",
  "value": 20.0,
  "used": false
}
```

**Response if already used (`200` with `used: true`):**
```json
{
  "code": "DISC-A3F9",
  "type": "fixed",
  "value": 20.0,
  "used": true,
  "usedInOrderId": "order_998"
}
```

---

### 4.3 — Attempting to reuse a code (rejected by transaction)

```http
POST /orders/order_002/discount
Authorization: Bearer <employee_token>
Content-Type: application/json

{ "code": "DISC-A3F9" }
```

**Response `400`:**
```json
{
  "error": "Discount code 'DISC-A3F9' has already been used"
}
```

---

### 4.4 — Applying a percentage discount code

```http
POST /discount-codes/generate
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "type": "percentage",
  "value": 10.0
}
```

Returns `DISC-B7K2`. When applied to an order with `subtotal = 310.0`:

```
discountAmount = 310.0 × (10 / 100) = 31.0
totalPrice = 310.0 - 31.0 = 279.0
```

---

---

## 5. Queue

### 5.1 — Get the sorted active queue

```http
GET /queue
Authorization: Bearer <employee_token>
```

**Response `200`:**
```json
[
  {
    "orderId": "order_003",
    "status": "ongoing",
    "isTakeaway": false,
    "appearanceTags": ["red shirt"],
    "createdAt": "2026-05-11T11:05:00Z",
    "startedAt": "2026-05-11T11:22:00Z",
    "itemNames": ["Oat Latte", "Mocha"]
  },
  {
    "orderId": "order_001",
    "status": "on_queue",
    "isTakeaway": true,
    "appearanceTags": ["glasses", "blue cap", "tall"],
    "createdAt": "2026-05-11T11:10:00Z",
    "startedAt": null,
    "itemNames": ["Oat Latte"]
  },
  {
    "orderId": "order_002",
    "status": "on_queue",
    "isTakeaway": false,
    "appearanceTags": ["ponytail"],
    "createdAt": "2026-05-11T11:12:00Z",
    "startedAt": null,
    "itemNames": ["Mocha", "Mocha"]
  }
]
```

**Sort logic applied:**

| Priority | Rule |
|---|---|
| 1st | `ongoing` orders always first |
| 2nd | `isTakeaway: true` before dine-in |
| 3rd | Older `createdAt` before newer |

So `order_003` (ongoing) → `order_001` (takeaway, older) → `order_002` (dine-in).

---

---

## 6. Analytics

### 6.1 — Summary KPIs for today

```http
GET /analytics/summary?from=2026-05-11&to=2026-05-11
Authorization: Bearer <admin_token>
```

**Response `200`:**
```json
{
  "total_orders": 42,
  "total_revenue": 5880.0,
  "avg_order_value": 140.0,
  "avg_fulfillment_minutes": 6.3
}
```

---

### 6.2 — Top selling items (last 7 days)

```http
GET /analytics/top-items?from=2026-05-04&to=2026-05-11&n=5
Authorization: Bearer <admin_token>
```

**Response `200`:**
```json
{
  "best": [
    { "menuItemName": "Oat Latte", "order_count": 38, "revenue": 5320.0 },
    { "menuItemName": "Mocha",     "order_count": 24, "revenue": 3360.0 },
    { "menuItemName": "Iced Latte","order_count": 19, "revenue": 2280.0 }
  ],
  "worst": [
    { "menuItemName": "Hot Choco", "order_count": 2,  "revenue": 240.0  }
  ]
}
```

---

### 6.3 — Orders over time (by day)

```http
GET /analytics/orders-over-time?from=2026-05-01&to=2026-05-11&period=day
Authorization: Bearer <admin_token>
```

**Response `200`:** Plotly chart JSON (rendered by the frontend into an interactive line chart).

```json
{
  "data": [
    {
      "type": "scatter",
      "mode": "lines+markers",
      "x": ["2026-05-01", "2026-05-02", "2026-05-03", "..."],
      "y": [31, 28, 45, "..."],
      "name": "Orders"
    }
  ],
  "layout": {
    "title": { "text": "Orders per Day" },
    "xaxis": { "title": { "text": "Date" } },
    "yaxis": { "title": { "text": "Orders" } }
  }
}
```

---

---

## Pricing worked examples — quick reference

| Scenario | basePrice | Chosen option | itemPrice | Logic |
|---|---|---|---|---|
| Oat Latte, Whole Milk (default), Normal syrup | 125.0 | `priceMarkup: 0.0` | **125.0** | 125 + 0 |
| Oat Latte, Oat Milk, Normal syrup | 125.0 | `priceMarkup: 15.0` | **140.0** | 125 + 15 |
| Oat Latte, Almond Milk, Normal syrup | 125.0 | `overridePrice: 165.0` | **165.0** | override wins, 125 ignored |
| Mocha, Standard Beans, Light syrup | 140.0 | `priceMarkup: 0.0` | **140.0** | 140 + 0 |
| Mocha, Premium Beans, Light syrup | 140.0 | `priceMarkup: 30.0` | **170.0** | 140 + 30 |
| Mocha, Premium Decaf, Light syrup | 140.0 | `overridePrice: 200.0` | **200.0** | override wins, 140 ignored |

---

## Error responses — common cases

| Situation | Status | Response body |
|---|---|---|
| Missing / invalid token | `401` | `{ "error": "Missing or malformed Authorization header" }` |
| Insufficient role | `403` | `{ "error": "Requires role: ['admin']" }` |
| Resource not found | `404` | `{ "error": "Order order_999 not found" }` |
| Invalid status transition | `400` | `{ "error": "Invalid status transition: 'completed' → 'ongoing'. Allowed: []" }` |
| Discount code already used | `400` | `{ "error": "Discount code 'DISC-A3F9' has already been used" }` |
| Discount applied after confirm | `400` | `{ "error": "Discount codes can only be applied to unconfirmed orders" }` |
| Ingredient stock too low | `400` | `{ "error": "Insufficient stock: Oat Milk needs 200ml, only 50ml remaining" }` |
| Invalid code format | `400` | `{ "error": "Code 'DISC-ZZZZ' has an invalid format" }` |
