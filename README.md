# EduSim-Hub

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A unified adaptive learning platform merging EduSim (an AI physics tutor) and the Smart Student Hub. EduSim-Hub provides role-based access control, real-time analytics, and interactive simulations for students, educators, and administrators.

---

## Features

- **AI-Powered Physics Simulations**: Implemented with Matter.js to provide interactive virtual labs and physics exercises.
- **Role-Based Access Control (RBAC)**: Tiers for Admin, Educator (Teacher), and Student with strict row-level and endpoint authorization.
- **Adaptive Learning**: Continuous assessment with progress tracking and personalized AI Tutor hints.
- **Real-Time Analytics Dashboard**: Detailed performance visualizer showing student mastery, class progress, and platform health.
- **Google OAuth + JWT Authentication**: Secure user login with Google identity provider and stateful JWT session tracking.

---

## Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL (Supabase) | High-performance RESTful API endpoints and relational ORM. |
| **Frontend** | React, TanStack Router, Vite, TypeScript | Modern, type-safe, routing-driven SPA. |
| **Auth** | JWT (RS256), Google OAuth2 | Secure, industry-standard authentication flow. |
| **Physics** | Matter.js | 2D rigid body physics engine for browser simulations. |
| **Charts** | Recharts | D3-based charting library for clean statistics rendering. |

---

## Monorepo Structure

```text
edusim-hub/
├── apps/
│   ├── web/                     # React Student Portal (Vite dev server)
│   │   ├── src/
│   │   │   ├── pages/           # Dashboard, Reports, Sandbox
│   │   │   └── routes/          # TanStack Router route definitions
│   │   └── package.json
│   └── teacher-portal/          # Next.js 14 Teacher Portal
│       ├── src/
│       └── package.json
├── services/
│   └── api/                     # FastAPI Backend
│       ├── app/src/
│       │   ├── api/             # API Router endpoints (/auth, /reports)
│       │   └── models/          # SQLModel database schemas
│       ├── tests/               # Pytest unit tests
│       ├── main.py              # Application entrypoint
│       └── requirements.txt     # Python dependencies
├── supabase/
│   └── migrations/              # SQL schema migration scripts
├── .env.example                 # Global environment variables template
├── PORTS.md                     # Port reference sheet
└── docker-compose.yml           # Local orchestration file
```

---

## Port Reference

| Service | Port | Local URL | What it does |
|---|---|---|---|
| **FastAPI Backend** | `8001` | [http://localhost:8001](http://localhost:8001) | REST API, auth, reports, simulation, tutor |
| **Student Portal** (React/Vite) | `8080` | [http://localhost:8080](http://localhost:8080) | UI for students and parents |
| **Teacher Portal** (Next.js) | `3000` | [http://localhost:3000](http://localhost:3000) | UI for teachers/educators |
| **PostgreSQL** (Supabase Local) | `5432` | `postgresql://localhost:5432` | Relational database storage |
| **Swagger UI** | `8001` | [http://localhost:8001/docs](http://localhost:8001/docs) | Interactive API documentation |
| **ReDoc** | `8001` | [http://localhost:8001/redoc](http://localhost:8001/redoc) | Alternate static API documentation |

---

## Prerequisites

Ensure you have the following software installed locally:
- **Python**: version 3.10+
- **Node.js**: version 18+ (npm version 9+)
- **PostgreSQL**: version 14+ (or a Supabase cloud instance)

---

## Setup & Run

### 1. Clone the Repository
```bash
git clone https://github.com/mythribanda/edusim-hub.git
cd edusim-hub
```

### 2. Configure Database Migrations
EduSim-Hub uses Supabase database migrations. Apply the SQL files under `supabase/migrations/` to your database instance:
```bash
# If using Supabase CLI locally:
supabase db push
# Alternatively, execute the SQL files in order directly on your database manager (Supabase Editor / pgAdmin).
```

### 3. Backend Setup (services/api)
```bash
cd services/api
# Create virtual environment
python -m venv venv
# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up local environment
cp .env.example .env  # configure database credentials and OAuth secrets

# Run backend server
uvicorn main:app --reload --port 8001
```

### 4. Frontend Setup
**Student Portal (apps/web):**
```bash
cd apps/web
npm install
npm run dev # Runs on http://localhost:8080
```
**Teacher Portal (apps/teacher-portal):**
```bash
cd apps/teacher-portal
npm install
npm run dev # Runs on http://localhost:3000
```

---

## Environment Variables

The backend and frontend apps rely on `.env` configuration files. Standard variables include:

| Environment Variable | Target App | Description | Example / Fallback |
|---|---|---|---|
| `DATABASE_URL` | Backend | Connection string to your PostgreSQL instance | `postgresql://user:password@localhost:5432/db` |
| `JWT_SECRET` | Backend | Cryptographic secret key for signing JWT tokens | `replace-with-a-strong-random-secret` |
| `GOOGLE_CLIENT_ID` | Backend | Client ID for Google OAuth credentials | `your-google-oauth-client-id` |
| `GOOGLE_CLIENT_SECRET` | Backend | Client secret for Google OAuth credentials | `your-google-oauth-client-secret` |
| `FRONTEND_URL` | Backend | Origin URL where the student portal is served | `http://localhost:8080` |
| `TEACHER_PORTAL_URL` | Backend | Origin URL where the teacher portal is served | `http://localhost:3000` |
| `ENV` | Backend | Deployment environment guard | `development` |
| `VITE_API_URL` | Student App | Endpoint pointing to the API service | `http://localhost:8001` |
| `NEXT_PUBLIC_API_URL` | Teacher App | Endpoint pointing to the API service | `http://localhost:8001` |

---

## API Reference

The FastAPI backend exposes the following primary route namespaces:

- **`/api/auth`**: User registration, password changes, OTP verification, and Google OAuth callback exchanges.
- **`/api/users`**: Fetch profiles, user lists, and link parent/student relationships.
- **`/api/attendance`**: Marked attendance sheets, student rosters, history retrieval, and monthly aggregates.
- **`/api/tutor`**: Socratic AI chatbot responses with automatic models fallbacks, caching, and rate limiting.
- **`/api/simulations`**: Manage, create, and fetch Matter.js physics exercises.
- **`/api/reports`**: Scoped analytics performance metrics and CSV exporters for students, teachers, and admins.

---

## Manual Testing Guide

For swift manual testing, launch the FastAPI server and navigate to:
👉 **[http://localhost:8001/docs](http://localhost:8001/docs)**

This opens the interactive Swagger UI where you can authenticate (using the `Authorize` button with a valid JWT) and execute requests directly against all routes.

---

## Known Issues & Roadmap

- **Offline Support**: Physics simulations require loading assets and dependencies; future releases will support local caching of core bundles.
- **Microservices Deployment**: Plans are underway to deploy the tutor module as a serverless function to isolate heavy AI stream latency.
- **Relational Integrity Limits**: Certain Supabase/PostgreSQL schema updates must be synchronized with the ORM models manually.

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
