# Cafe POS

A point-of-sale prototype for cafe operations, with a Flask and Firestore backend, a React web client, and an Expo mobile client.

> **Development status:** The API currently has no request authentication or authorization. Use isolated development data only; do not expose it to the public internet or connect it to production data.

## Features

- Manage menu items, ingredients, and discount codes.
- Process orders through queue, in-progress, completion, and cancellation states.
- Deduct or restore inventory as order state changes.
- View order history and sales analytics.
- Use role-oriented admin, employee, and customer screens in the web and mobile clients.

## Architecture

```text
Web client (React/Vite) ─┐
                         ├── Flask REST API ── Firebase Firestore
Mobile client (Expo) ────┘
```

| Component | Location | Stack |
| --- | --- | --- |
| API | `backend/` | Python, Flask, Firebase Admin SDK |
| Web client | `web/` | React, Vite |
| Mobile client | `mobile/` | React Native, Expo |
| Shared business logic | `shared/` | JavaScript |

## Repository layout

```text
backend/                  Flask API, routes, services, and development scripts
mobile/                   Expo application and Android project
projectresources/         Database, setup, and API reference documents
shared/                   Shared pricing, discount, and order-status utilities
web/                      React/Vite application
CafePOS_Desc.md           Project and data-model notes
PROJECT_OVERVIEW.md       Product scope and implementation notes
requirements.txt          Python dependencies
```

Additional database and setup documentation is available in [`projectresources/`](projectresources/).

## Getting started

### Prerequisites

- Python 3 and pip
- Node.js and npm
- A Firebase project with Cloud Firestore enabled, or a local Firestore emulator
- Android Studio and an Android SDK to run the mobile app on Android

### Configure Firebase

1. Create a Firebase project and enable Cloud Firestore.
2. Create a service-account key for local development. Keep this file private.
3. Copy the example configuration and place the key in `backend/`:

   ```sh
   cp backend/.env.example backend/.env
   # Save the downloaded key as backend/serviceAccountKey.json
   ```

4. Set `FIREBASE_PROJECT_ID` in `backend/.env`. The service-account path defaults to `serviceAccountKey.json` when the API is started from `backend/`.

Never commit service-account keys, `.env` files, or production credentials. The repository ignore rules exclude these files.

### Run the API

From the repository root:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cd backend
python app.py
```

On Windows PowerShell, create the environment with `py -m venv .venv`, install dependencies with `.venv\Scripts\python.exe -m pip install -r requirements.txt`, then start the API from `backend/` with `..\.venv\Scripts\python.exe app.py`.

The development API listens on port `5000`. Check its health endpoint at <http://127.0.0.1:5000/>; a successful response is:

```json
{"status":"ok","service":"Cafe POS Backend"}
```

### Run the web client

In a second terminal:

```sh
cd web
npm ci
npm run dev
```

Vite prints the local development URL when it starts.

### Run the mobile client

In a separate terminal:

```sh
cd mobile
npm ci
npm start
```

Follow the Expo prompts to use a simulator or device. Android builds require the Android SDK and a configured emulator or device.

## API overview

The API is grouped by resource under `/users`, `/ingredients`, `/menu-items`, `/discount-codes`, `/orders`, and `/analytics`. The root path `/` is a health check. Order routes include operations for adding items, applying discounts, confirming, starting, completing, and cancelling orders.

Route implementations are in [`backend/routes/`](backend/routes/); business logic and Firestore access are in [`backend/services/`](backend/services/).

## Tests

The backend includes `backend/test_api.py` and `backend/test_services.py`. These are integration scripts, not isolated unit tests: they connect to Firestore and create or modify records. Run them only against a disposable development Firebase project or emulator, never against production data. The API script also requires the Flask server to be running.

The repository does not currently define an automated CI test workflow.

## Security and licensing

The API is intended for local development and review only. Before any deployment, add authentication and authorization, restrict CORS, use a production WSGI server, and review Firestore access and data-handling rules.

There is no `LICENSE` file. Public visibility does not grant permission to reuse or redistribute the code; select and add a license before accepting external contributions or reuse.

## Project documentation

- [Product scope](PROJECT_OVERVIEW.md)
- [Project description](CafePOS_Desc.md)
- [Setup and database references](projectresources/)
