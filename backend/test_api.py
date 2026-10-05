#!/usr/bin/env python3
"""
Test script for POS system Flask API endpoints
"""

import requests
import json
import sys
import time

BASE_URL = "http://localhost:5000"
HEADERS = {"Content-Type": "application/json"}

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def test_health():
    """Test health check endpoint"""
    print(f"\n{BLUE}Testing Health Check Endpoint{RESET}")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"{RED}✗ Error: {e}{RESET}")
        return False


def test_users_endpoints():
    """Test users endpoints"""
    print(f"\n{BLUE}Testing Users Endpoints{RESET}")
    
    try:
        # List users
        print("\n1. GET /users - List all users")
        response = requests.get(f"{BASE_URL}/users", headers=HEADERS)
        print(f"Status: {response.status_code}")
        users = response.json()
        print(f"Found {len(users)} users")
        if len(users) > 0:
            print(f"Sample: {users[0]}")
        
        # Create user
        print("\n2. POST /users - Create new user")
        user_data = {
            "uid": "test-customer-001",
            "username": "test_customer",
            "role": "customer"
        }
        response = requests.post(f"{BASE_URL}/users", json=user_data, headers=HEADERS)
        print(f"Status: {response.status_code}")
        created_user = response.json()
        print(f"Created: {created_user}")
        
        # Get user
        print("\n3. GET /users/{uid} - Get specific user")
        response = requests.get(f"{BASE_URL}/users/test-customer-001", headers=HEADERS)
        print(f"Status: {response.status_code}")
        print(f"User: {response.json()}")
        
        # Update user
        print("\n4. PATCH /users/{uid} - Update user")
        update_data = {"username": "updated_customer"}
        response = requests.patch(f"{BASE_URL}/users/test-customer-001", json=update_data, headers=HEADERS)
        print(f"Status: {response.status_code}")
        print(f"Updated: {response.json()}")
        
        # Delete user
        print("\n5. DELETE /users/{uid} - Delete user")
        response = requests.delete(f"{BASE_URL}/users/test-customer-001", headers=HEADERS)
        print(f"Status: {response.status_code}")
        print(f"Result: {response.json()}")
        
        return True
    except Exception as e:
        print(f"{RED}✗ Error: {e}{RESET}")
        import traceback
        traceback.print_exc()
        return False


def test_ingredients_endpoints():
    """Test ingredients endpoints"""
    print(f"\n{BLUE}Testing Ingredients Endpoints{RESET}")
    
    try:
        # List ingredients
        print("\n1. GET /ingredients - List all ingredients")
        response = requests.get(f"{BASE_URL}/ingredients", headers=HEADERS)
        print(f"Status: {response.status_code}")
        ingredients = response.json()
        print(f"Found {len(ingredients)} ingredients")
        
        # Create ingredient
        print("\n2. POST /ingredients - Create new ingredient")
        ing_data = {
            "name": "Test Syrup",
            "amount": 3000,
            "unit": "ml"
        }
        response = requests.post(f"{BASE_URL}/ingredients", json=ing_data, headers=HEADERS)
        print(f"Status: {response.status_code}")
        created_ing = response.json()
        ing_id = created_ing.get("ingredientId")
        print(f"Created: {created_ing}")
        
        # Get ingredient
        print("\n3. GET /ingredients/{id} - Get specific ingredient")
        response = requests.get(f"{BASE_URL}/ingredients/{ing_id}", headers=HEADERS)
        print(f"Status: {response.status_code}")
        print(f"Ingredient: {response.json()}")
        
        # Update ingredient
        print("\n4. PATCH /ingredients/{id} - Update ingredient")
        update_data = {"amount": 4000}
        response = requests.patch(f"{BASE_URL}/ingredients/{ing_id}", json=update_data, headers=HEADERS)
        print(f"Status: {response.status_code}")
        print(f"Updated: {response.json()}")
        
        # Delete ingredient
        print("\n5. DELETE /ingredients/{id} - Delete ingredient")
        response = requests.delete(f"{BASE_URL}/ingredients/{ing_id}", headers=HEADERS)
        print(f"Status: {response.status_code}")
        print(f"Result: {response.json()}")
        
        return True
    except Exception as e:
        print(f"{RED}✗ Error: {e}{RESET}")
        import traceback
        traceback.print_exc()
        return False


def test_menu_items_endpoints():
    """Test menu items endpoints"""
    print(f"\n{BLUE}Testing Menu Items Endpoints{RESET}")
    
    try:
        # List menu items
        print("\n1. GET /menu-items - List all menu items")
        response = requests.get(f"{BASE_URL}/menu-items", headers=HEADERS)
        print(f"Status: {response.status_code}")
        menu_items = response.json()
        print(f"Found {len(menu_items)} menu items")
        
        # Get ingredients for new item
        response = requests.get(f"{BASE_URL}/ingredients", headers=HEADERS)
        ingredients = response.json()
        if len(ingredients) < 2:
            print(f"{YELLOW}! Not enough ingredients to test menu item creation{RESET}")
            return True
        
        ing1, ing2 = ingredients[0], ingredients[1]
        
        # Create menu item
        print("\n2. POST /menu-items - Create new menu item")
        item_data = {
            "name": "API Test Drink",
            "recipe": "Test recipe",
            "basePrice": 85.0,
            "isAvailable": True,
            "ingredientSlots": [
                {
                    "type": "normal",
                    "ingredientId": ing1["ingredientId"],
                    "ingredientName": ing1["name"],
                    "amount": 20,
                    "unit": ing1["unit"]
                }
            ]
        }
        response = requests.post(f"{BASE_URL}/menu-items", json=item_data, headers=HEADERS)
        print(f"Status: {response.status_code}")
        created_item = response.json()
        item_id = created_item.get("menuItemId")
        print(f"Created: {created_item}")
        
        # Get menu item
        print("\n3. GET /menu-items/{id} - Get specific menu item")
        response = requests.get(f"{BASE_URL}/menu-items/{item_id}", headers=HEADERS)
        print(f"Status: {response.status_code}")
        print(f"Menu item: {response.json()}")
        
        # Update menu item
        print("\n4. PATCH /menu-items/{id} - Update menu item")
        update_data = {"basePrice": 95.0}
        response = requests.patch(f"{BASE_URL}/menu-items/{item_id}", json=update_data, headers=HEADERS)
        print(f"Status: {response.status_code}")
        print(f"Updated: {response.json()}")
        
        # Delete menu item
        print("\n5. DELETE /menu-items/{id} - Delete menu item")
        response = requests.delete(f"{BASE_URL}/menu-items/{item_id}", headers=HEADERS)
        print(f"Status: {response.status_code}")
        print(f"Result: {response.json()}")
        
        return True
    except Exception as e:
        print(f"{RED}✗ Error: {e}{RESET}")
        import traceback
        traceback.print_exc()
        return False


def test_discount_codes_endpoints():
    """Test discount codes endpoints"""
    print(f"\n{BLUE}Testing Discount Codes Endpoints{RESET}")
    
    try:
        # List discount codes
        print("\n1. GET /discount-codes - List all discount codes")
        response = requests.get(f"{BASE_URL}/discount-codes", headers=HEADERS)
        print(f"Status: {response.status_code}")
        codes = response.json()
        print(f"Found {len(codes)} discount codes")
        
        # Create discount code
        print("\n2. POST /discount-codes - Create new discount code")
        code_data = {
            "code": "API-TEST-DISC",
            "type": "percentage",
            "value": 20
        }
        response = requests.post(f"{BASE_URL}/discount-codes", json=code_data, headers=HEADERS)
        print(f"Status: {response.status_code}")
        created_code = response.json()
        print(f"Created: {created_code}")
        
        # Get discount code
        print("\n3. GET /discount-codes/{code} - Get specific discount code")
        response = requests.get(f"{BASE_URL}/discount-codes/API-TEST-DISC", headers=HEADERS)
        print(f"Status: {response.status_code}")
        print(f"Code: {response.json()}")
        
        return True
    except Exception as e:
        print(f"{RED}✗ Error: {e}{RESET}")
        import traceback
        traceback.print_exc()
        return False


def test_orders_endpoints():
    """Test orders endpoints"""
    print(f"\n{BLUE}Testing Orders Endpoints{RESET}")
    
    try:
        # List orders
        print("\n1. GET /orders - List all orders")
        response = requests.get(f"{BASE_URL}/orders", headers=HEADERS)
        print(f"Status: {response.status_code}")
        orders = response.json()
        print(f"Found {len(orders)} orders")
        
        # Get menu items and employees
        response = requests.get(f"{BASE_URL}/menu-items", headers=HEADERS)
        menu_items = response.json()
        response = requests.get(f"{BASE_URL}/users", headers=HEADERS)
        users = response.json()
        
        employees = [u for u in users if u.get("role") == "employee"]
        if not employees or not menu_items:
            print(f"{YELLOW}! Missing employees or menu items for order test{RESET}")
            return True
        
        # Create order
        print("\n2. POST /orders - Create new order")
        order_data = {
            "employeeId": employees[0]["uid"],
            "isTakeaway": False,
            "appearanceTags": ["test"]
        }
        response = requests.post(f"{BASE_URL}/orders", json=order_data, headers=HEADERS)
        print(f"Status: {response.status_code}")
        created_order = response.json()
        order_id = created_order.get("orderId")
        print(f"Created order: {order_id}")
        
        # Get order
        print("\n3. GET /orders/{id} - Get specific order")
        response = requests.get(f"{BASE_URL}/orders/{order_id}", headers=HEADERS)
        print(f"Status: {response.status_code}")
        print(f"Order: {response.json()}")
        
        # Add item to order
        print("\n4. POST /orders/{id}/items - Add item to order")
        item_data = {
            "menuItemId": menu_items[0]["menuItemId"],
            "customizations": {}
        }
        response = requests.post(f"{BASE_URL}/orders/{order_id}/items", json=item_data, headers=HEADERS)
        print(f"Status: {response.status_code}")
        created_item = response.json()
        item_id = created_item.get("itemId")
        print(f"Created order item: {item_id}")
        
        # List order items
        print("\n5. GET /orders/{id}/items - List order items")
        response = requests.get(f"{BASE_URL}/orders/{order_id}/items", headers=HEADERS)
        print(f"Status: {response.status_code}")
        items = response.json()
        print(f"Found {len(items)} order items")
        
        # Confirm order
        print("\n6. PATCH /orders/{id}/confirm - Confirm order")
        response = requests.patch(f"{BASE_URL}/orders/{order_id}/confirm", headers=HEADERS)
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Result: {result}")
        
        # Start order
        print("\n7. PATCH /orders/{id}/start - Start order")
        response = requests.patch(f"{BASE_URL}/orders/{order_id}/start", headers=HEADERS)
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Result: {result}")
        
        # Complete order
        print("\n8. PATCH /orders/{id}/complete - Complete order")
        response = requests.patch(f"{BASE_URL}/orders/{order_id}/complete", headers=HEADERS)
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Result: {result}")
        
        # Get queue
        print("\n9. GET /orders/queue - Get queue")
        response = requests.get(f"{BASE_URL}/orders/queue", headers=HEADERS)
        print(f"Status: {response.status_code}")
        print(f"Queue: {response.json()}")
        
        return True
    except Exception as e:
        print(f"{RED}✗ Error: {e}{RESET}")
        import traceback
        traceback.print_exc()
        return False


def test_analytics_endpoints():
    """Test analytics endpoints"""
    print(f"\n{BLUE}Testing Analytics Endpoints{RESET}")
    
    try:
        # Get order history
        print("\n1. GET /analytics/history - Get order history")
        response = requests.get(f"{BASE_URL}/analytics/history", headers=HEADERS)
        print(f"Status: {response.status_code}")
        history = response.json()
        print(f"Found {len(history)} orders in history")
        
        # Get summary
        print("\n2. GET /analytics/summary - Get analytics summary")
        response = requests.get(f"{BASE_URL}/analytics/summary", headers=HEADERS)
        print(f"Status: {response.status_code}")
        summary = response.json()
        print(f"Summary:")
        print(f"  - Total orders: {summary.get('totalOrders')}")
        print(f"  - Total revenue: ${summary.get('totalRevenue'):.2f}")
        print(f"  - Average order value: ${summary.get('averageOrderValue'):.2f}")
        
        return True
    except Exception as e:
        print(f"{RED}✗ Error: {e}{RESET}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all API tests"""
    print("\n" + "="*60)
    print(f"{BLUE}CAFE POS SYSTEM - FLASK API TEST SUITE{RESET}")
    print("="*60)
    
    # Check if server is running
    print(f"\n{YELLOW}Checking if Flask server is running at {BASE_URL}...{RESET}")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=2)
        print(f"{GREEN}✓ Server is running{RESET}")
    except:
        print(f"{RED}✗ Server is NOT running. Please start the Flask app first.{RESET}")
        print(f"\nStart the server with: cd backend && python app.py")
        return 1
    
    results = {
        "Health": test_health(),
        "Users": test_users_endpoints(),
        "Ingredients": test_ingredients_endpoints(),
        "Menu Items": test_menu_items_endpoints(),
        "Discount Codes": test_discount_codes_endpoints(),
        "Orders": test_orders_endpoints(),
        "Analytics": test_analytics_endpoints(),
    }
    
    # Summary
    print("\n" + "="*60)
    print(f"{BLUE}TEST SUMMARY{RESET}")
    print("="*60)
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"\nPassed: {passed}/{total}")
    for endpoint, result in results.items():
        status = f"{GREEN}✓ PASS{RESET}" if result else f"{RED}✗ FAIL{RESET}"
        print(f"  {endpoint.ljust(20)} {status}")
    
    if passed == total:
        print(f"\n{GREEN}✓ ALL TESTS PASSED!{RESET}")
        return 0
    else:
        print(f"\n{RED}✗ {total - passed} test(s) failed{RESET}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
