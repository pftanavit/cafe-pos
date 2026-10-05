from services.users import create_user
from services.inventory import create_ingredient
from services.menu import create_menu_item
from services.discount_codes import create_discount_code


def bootstrap():
    print("Creating sample admin user...")
    create_user({
        "uid": "admin-placeholder",
        "username": "admin",
        "role": "admin",
    })

    print("Creating sample ingredients...")
    espresso = create_ingredient({"name": "Espresso", "amount": 10000, "unit": "ml"})
    oat_milk = create_ingredient({"name": "Oat Milk", "amount": 5000, "unit": "ml"})
    syrup = create_ingredient({"name": "Syrup", "amount": 2000, "unit": "ml"})

    print("Creating sample menu item...")
    create_menu_item(
        {
            "name": "Oat Latte",
            "recipe": "1. Pull a double shot espresso.\n2. Steam oat milk to 65°C with thin microfoam.\n3. Pour over espresso.",
            "basePrice": 120.0,
            "isAvailable": True,
            "ingredientSlots": [
                {
                    "type": "normal",
                    "ingredientId": espresso["ingredientId"],
                    "ingredientName": "Espresso",
                    "amount": 30,
                    "unit": "ml",
                },
                {
                    "type": "customizable_amount",
                    "ingredientId": syrup["ingredientId"],
                    "ingredientName": "Syrup",
                    "unit": "ml",
                    "defaultLevelIndex": 2,
                    "levels": [
                        {"label": "None", "amount": 0},
                        {"label": "Light", "amount": 5},
                        {"label": "Normal", "amount": 10},
                        {"label": "Extra", "amount": 15},
                    ],
                },
                {
                    "type": "customizable_options",
                    "label": "Milk type",
                    "options": [
                        {
                            "ingredientId": oat_milk["ingredientId"],
                            "ingredientName": "Oat Milk",
                            "amount": 200,
                            "unit": "ml",
                            "isDefault": True,
                            "priceMarkup": 0,
                            "overridePrice": None,
                        }
                    ],
                },
            ],
        }
    )

    print("Creating sample discount codes...")
    create_discount_code({"code": "DISC-SAMPLE10", "type": "percentage", "value": 10})
    create_discount_code({"code": "DISC-20THB", "type": "fixed", "value": 20})

    print("Bootstrap complete. Update placeholder ingredient references in menu items after seeding the actual ingredient IDs.")


if __name__ == "__main__":
    bootstrap()
