# Cafe POS System Setup Guide

## 1. Firebase Setup

1. Go to https://console.firebase.google.com and create a new Firebase project.
2. Enable Firestore in **Native mode**.
3. Enable Firebase Authentication. Choose one of:
   - Anonymous authentication
   - Custom token authentication
4. In the Firebase console, go to Project settings → Service accounts.
5. Generate a new private key and download the JSON file.
6. Place the downloaded JSON file in `backend/` as `serviceAccountKey.json` or set `FIREBASE_SERVICE_ACCOUNT_PATH` in `backend/.env`.
7. Add `serviceAccountKey.json` to `backend/.gitignore` (already configured).
8. Optionally deploy Firestore security rules later using the rules defined in `CafePOS_Desc.md`.

## 2. Backend Setup

1. Open PowerShell and navigate to the project backend folder:
   ```powershell
   cd "d:\POS System Project\backend"
   ```
2. Install dependencies in the existing virtual environment:
   ```powershell
   d:/POS System Project/.venv/Scripts/python.exe -m pip install -r requirements.txt
   ```
3. Create a `.env` file in `backend/` based on `.env.example`.
4. Confirm the service account file path and optional Firebase settings are correct.
5. Start the Flask app:
   ```powershell
   d:/POS System Project/.venv/Scripts/python.exe app.py
   ```
6. The API should listen on `http://localhost:5000`.

## 3. Initial Database Bootstrapping

1. Run the initial bootstrap script once after the backend has permission to access Firestore:
   ```powershell
   d:/POS System Project/.venv/Scripts/python.exe scripts/db_init.py
   ```
2. The script creates sample users, ingredients, menu items, and example discount codes.
3. After initial seeding, update any placeholder ingredient IDs inside menu documents if needed.

## 4. Android Studio + React Native Setup

1. Install Android Studio from https://developer.android.com/studio.
2. Install the Android SDK and an emulator with API level 31 or later.
3. Install Node.js and npm if not installed.
4. Install React Native CLI or use `npx`.
5. Create the mobile app folder by running in the project root:
   ```powershell
   cd "d:\POS System Project"
   npx react-native init CafePOSMobile --directory mobile
   ```
6. Install Firebase packages for React Native when ready:
   ```powershell
   cd "d:\POS System Project\mobile"
   npm install @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/auth
   ```
7. Add the Firebase Android config file `google-services.json` to `mobile/android/app/`.
8. Configure `android/build.gradle` and `android/app/build.gradle` per React Native Firebase docs.

## 5. Web App Setup

1. Create the React web app in `web/` when ready:
   ```powershell
   cd "d:\POS System Project"
   npx create-react-app web
   ```
2. Install the Firebase web SDK:
   ```powershell
   cd "d:\POS System Project\web"
   npm install firebase
   ```
3. Store Firebase config in `web/.env.local` and load it into your React code.

## 6. Shared Logic

1. Use the `shared/` folder for business logic shared between mobile and web.
2. Add shared modules such as `priceResolver.js`, `orderStatus.js`, and `discountApplier.js`.

## 7. Notes

- Do not commit `serviceAccountKey.json`.
- The backend uses the Firebase Admin SDK to perform secure inventory, discount, and order operations.
- The REST API includes endpoints for users, ingredients, menu items, discount codes, orders, and analytics.
