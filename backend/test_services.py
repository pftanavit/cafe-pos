#!/usr/bin/env python3
"""
Comprehensive test suite for POS system backend services.
Tests all CRUD operations and business logic.
"""

import sys
import json
from datetime import datetime
sys.path.insert(0, '.')

from services.users import create_user, get_user, list_users, update_user, delete_user
from services.inventory import create_ingredient, get_ingredient, list_ingredients, update_ingredient, delete_ingredient
from services.menu import create_menu_item, get_menu_item, list_menu_items, update_menu_item, delete_menu_item
from services.orders import create_order, get_order, list_orders, create_order_item, get_order_item, list_order_items
from services.discount_codes import create_discount_code, get_discount_code, list_discount_codes, validate_and_apply_discount_code
from services.analytics import get_order_history, get_summary

def test_users_service():
    """Test users service CRUD operations"""
    print("\n" + "="*50)
    print("TESTING USERS SERVICE")
    print("="*50)
    
    try:
        # Create a test user
        print("\n1. Creating a test user...")
        user_data = {
            "uid": "test-employee-001",
            "username": "barista_john",
            "role": "employee"
        }
        user = create_user(user_data)
        print(f"✓ User created: {user}")
        
        # Get the user
        print("\n2. Getting the user...")
        fetched_user = get_user("test-employee-001")
        print(f"✓ User fetched: {fetched_user}")
        
        # List users
        print("\n3. Listing all users...")
        users = list_users()
        print(f"✓ Found {len(users)} users")
        for u in users[:3]:
            print(f"  - {u.get('username')} ({u.get('role')})")
        
        # Update user
        print("\n4. Updating the user...")
        updated = update_user("test-employee-001", {"username": "barista_john_updated"})
        print(f"✓ User updated: {updated}")
        
        # Delete user
        print("\n5. Deleting the user...")
        deleted = delete_user("test-employee-001")
        print(f"✓ User deleted: {deleted}")
        
        print("\n✓ USERS SERVICE TESTS PASSED")
        return True
    except Exception as e:
        print(f"\n✗ USERS SERVICE TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_inventory_service():
    """Test inventory service CRUD operations"""
    print("\n" + "="*50)
    print("TESTING INVENTORY SERVICE")
    print("="*50)
    
    try:
        # Create ingredient
        print("\n1. Creating a test ingredient...")
        ingredient_data = {
            "name": "Test Milk",
            "amount": 5000,
            "unit": "ml"
        }
        ingredient = create_ingredient(ingredient_data)
        ingredient_id = ingredient["ingredientId"]
        print(f"✓ Ingredient created: {ingredient}")
        
        # Get ingredient
        print("\n2. Getting the ingredient...")
        fetched = get_ingredient(ingredient_id)
        print(f"✓ Ingredient fetched: {fetched}")
        
        # List ingredients
        print("\n3. Listing all ingredients...")
        ingredients = list_ingredients()
        print(f"✓ Found {len(ingredients)} ingredients")
        
        # Update ingredient
        print("\n4. Updating the ingredient...")
        updated = update_ingredient(ingredient_id, {"amount": 6000})
        print(f"✓ Ingredient updated: {updated}")
        
        # Delete ingredient
        print("\n5. Deleting the ingredient...")
        deleted = delete_ingredient(ingredient_id)
        print(f"✓ Ingredient deleted: {deleted}")
        
        print("\n✓ INVENTORY SERVICE TESTS PASSED")
        return True
    except Exception as e:
        print(f"\n✗ INVENTORY SERVICE TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_menu_items_service():
    """Test menu items service CRUD operations"""
    print("\n" + "="*50)
    print("TESTING MENU ITEMS SERVICE")
    print("="*50)
    
    try:
        # Get existing ingredients for menu item
        print("\n1. Getting existing ingredients...")
        ingredients = list_ingredients()
        if len(ingredients) < 2:
            print("✗ Need at least 2 ingredients to create menu item")
            return False
        
        ing1, ing2 = ingredients[0], ingredients[1]
        print(f"✓ Found ingredients: {ing1['name']}, {ing2['name']}")
        
        # Create menu item
        print("\n2. Creating a test menu item...")
        menu_item_data = {
            "name": "Test Coffee",
            "recipe": "1. Brew coffee\n2. Add milk\n3. Serve",
            "basePrice": 95.0,
            "isAvailable": True,
            "ingredientSlots": [
                {
                    "type": "normal",
                    "ingredientId": ing1["ingredientId"],
                    "ingredientName": ing1["name"],
                    "amount": 30,
                    "unit": "ml"
                },
                {
                    "type": "customizable_amount",
                    "ingredientId": ing2["ingredientId"],
                    "ingredientName": ing2["name"],
                    "unit": "ml",
                    "defaultLevelIndex": 1,
                    "levels": [
                        {"label": "Light", "amount": 100},
                        {"label": "Normal", "amount": 150}
                    ]
                }
            ]
        }
        menu_item = create_menu_item(menu_item_data)
        menu_item_id = menu_item["menuItemId"]
        print(f"✓ Menu item created: {menu_item}")
        
        # Get menu item
        print("\n3. Getting the menu item...")
        fetched = get_menu_item(menu_item_id)
        print(f"✓ Menu item fetched: {fetched['name']} (${fetched['basePrice']})")
        
        # List menu items
        print("\n4. Listing all menu items...")
        menu_items = list_menu_items()
        print(f"✓ Found {len(menu_items)} menu items")
        
        # Update menu item
        print("\n5. Updating the menu item...")
        updated = update_menu_item(menu_item_id, {"basePrice": 120.0})
        print(f"✓ Menu item updated: {updated}")
        
        # Delete menu item
        print("\n6. Deleting the menu item...")
        deleted = delete_menu_item(menu_item_id)
        print(f"✓ Menu item deleted: {deleted}")
        
        print("\n✓ MENU ITEMS SERVICE TESTS PASSED")
        return True
    except Exception as e:
        print(f"\n✗ MENU ITEMS SERVICE TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_discount_codes_service():
    """Test discount codes service"""
    print("\n" + "="*50)
    print("TESTING DISCOUNT CODES SERVICE")
    print("="*50)
    
    try:
        # Create discount code
        print("\n1. Creating a test discount code...")
        code_data = {
            "code": "TEST-DISCOUNT-001",
            "type": "percentage",
            "value": 15
        }
        code = create_discount_code(code_data)
        print(f"✓ Discount code created: {code}")
        
        # Get discount code
        print("\n2. Getting the discount code...")
        fetched = get_discount_code("TEST-DISCOUNT-001")
        print(f"✓ Discount code fetched: {fetched}")
        
        # List discount codes
        print("\n3. Listing all discount codes...")
        codes = list_discount_codes()
        print(f"✓ Found {len(codes)} discount codes")
        
        print("\n✓ DISCOUNT CODES SERVICE TESTS PASSED")
        return True
    except Exception as e:
        print(f"\n✗ DISCOUNT CODES SERVICE TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_orders_service():
    """Test orders service"""
    print("\n" + "="*50)
    print("TESTING ORDERS SERVICE")
    print("="*50)
    
    try:
        # Get sample data
        print("\n1. Getting sample data for order...")
        employees = [u for u in list_users() if u.get('role') == 'employee']
        menu_items = list_menu_items()
        
        if not employees:
            print("✗ No employees found. Creating test employee...")
            emp = create_user({
                "uid": "test-emp-for-order",
                "username": "test_barista",
                "role": "employee"
            })
            employee_id = "test-emp-for-order"
        else:
            employee_id = employees[0]['uid']
        
        print(f"✓ Using employee: {employee_id}")
        
        if not menu_items:
            print("✗ No menu items found. Please create menu items first.")
            return False
        
        menu_item_id = menu_items[0]['menuItemId']
        print(f"✓ Using menu item: {menu_items[0]['name']}")
        
        # Create order
        print("\n2. Creating an order...")
        order_data = {
            "employeeId": employee_id,
            "isTakeaway": True,
            "appearanceTags": ["glasses"]
        }
        order = create_order(order_data)
        order_id = order["orderId"]
        print(f"✓ Order created: {order}")
        
        # Get order
        print("\n3. Getting the order...")
        fetched = get_order(order_id)
        print(f"✓ Order fetched: {fetched}")
        
        # Add item to order
        print("\n4. Adding item to order...")
        item_data = {
            "menuItemId": menu_item_id,
            "customizations": {}
        }
        item = create_order_item(order_id, item_data)
        item_id = item["itemId"]
        print(f"✓ Order item created: {item}")
        
        # Get order item
        print("\n5. Getting the order item...")
        fetched_item = get_order_item(order_id, item_id)
        print(f"✓ Order item fetched: {fetched_item['menuItemName']}")
        
        # List order items
        print("\n6. Listing all order items...")
        items = list_order_items(order_id)
        print(f"✓ Found {len(items)} order items")
        
        # List orders
        print("\n7. Listing all orders...")
        orders = list_orders()
        print(f"✓ Found {len(orders)} orders")
        
        print("\n✓ ORDERS SERVICE TESTS PASSED")
        return True
    except Exception as e:
        print(f"\n✗ ORDERS SERVICE TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_analytics_service():
    """Test analytics service"""
    print("\n" + "="*50)
    print("TESTING ANALYTICS SERVICE")
    print("="*50)
    
    try:
        # Get order history
        print("\n1. Getting order history...")
        history = get_order_history()
        print(f"✓ Order history retrieved: {len(history)} orders")
        
        # Get summary
        print("\n2. Getting analytics summary...")
        summary = get_summary()
        print(f"✓ Analytics summary:")
        print(f"  - Total orders: {summary.get('totalOrders')}")
        print(f"  - Total revenue: ${summary.get('totalRevenue'):.2f}")
        print(f"  - Average order value: ${summary.get('averageOrderValue'):.2f}")
        print(f"  - Average fulfillment time: {summary.get('averageFulfillmentMinutes'):.1f} minutes")
        print(f"  - Top selling items: {len(summary.get('topSellingItems', []))} items")
        
        print("\n✓ ANALYTICS SERVICE TESTS PASSED")
        return True
    except Exception as e:
        print(f"\n✗ ANALYTICS SERVICE TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("CAFE POS SYSTEM - BACKEND SERVICES TEST SUITE")
    print("="*60)
    
    results = {
        "users": test_users_service(),
        "inventory": test_inventory_service(),
        "menu_items": test_menu_items_service(),
        "discount_codes": test_discount_codes_service(),
        "orders": test_orders_service(),
        "analytics": test_analytics_service(),
    }
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"\nPassed: {passed}/{total}")
    for service, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {service.ljust(20)} {status}")
    
    if passed == total:
        print("\n✓ ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n✗ {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
