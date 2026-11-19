# EduSim Hub

An AI-powered interactive educational simulation platform combining generative physics simulations, deterministic kinematics engines, multi-turn AI tutoring, dynamic formula lab, and multi-subject textbook RAG retrieval.

Repository: [https://github.com/mythribanda/edusim-hub](https://github.com/mythribanda/edusim-hub)

---

## Architecture Overview

EduSim is organized as a unified monorepo containing both the frontend and backend services:

```
edusim-hub/
├── .gitignore               # Comprehensive exclusion rules for temporary/build artifacts
├── README.md                # Project architecture & setup documentation
├── backend/                 # FastAPI, SQLAlchemy, FAISS RAG, SymPy, OpenRouter AI
│   ├── app/                 # Application routers, models, and core modules
│   │   └── src/
│   │       ├── api/         # FastAPI endpoint routers (tutor, curriculum, physics, etc.)
│   │       ├── config/      # Database, security, and model configurations
│   │       ├── models/      # SQLAlchemy ORM models (users, curriculum, history)
│   │       ├── modules/     # Legacy RAG, Sandbox orchestration, Simulation synthesis
│   │       ├── services/    # Formula, question, and persistence service layers
│   │       └── utils/       # Auth, rate limiting, token tracking, avatar storage
│   ├── curriculum/          # Curriculum database seeds and chapter mappings
│   ├── vectorstore/         # Pre-indexed FAISS multi-subject vectorstores (Physics, Math, Bio, Chem)
│   ├── main.py              # Backend entrypoint with automatic DB initialization & schema sync
│   └── requirements.txt     # Python dependencies
└── frontend/                # React 19, TypeScript, Vite, Tailwind CSS, TanStack Router, Matter.js
    ├── src/
    │   ├── ai/              # Physics runtime observer & throttled explanation engine
    │   ├── components/      # UI components (AI tutor, dashboard, navbar, sidebar)
    │   ├── routes/          # TanStack file-based routes (dashboard, tutor, sandbox, etc.)
    │   ├── sandbox/         # Matter.js physics engine, constraints, orbits, observables
    │   ├── services/        # Frontend API clients matching backend contracts
    │   └── store/           # Zustand state management stores
    ├── package.json         # Node.js dependencies
    └── vite.config.ts       # Vite bundler configuration
```

---

## Core Features

1. **AI Tutor with Throttled Explanations:** Real-time multi-turn tutoring with bounded textbook context and automatic query classification.
2. **Interactive Physics Sandbox:** Live Matter.js 2D physics simulation with orbital mechanics, friction, collisions, and gravity systems.
3. **Event Storm Shield:** Physics simulation loops are decoupled from AI calls with a 1,500ms debounce window and in-memory caching to eliminate runaway token billing.
4. **Formula Lab & Introspection:** SymPy-powered equation canonicalization, variable parsing, and dynamic derivation.
5. **Multi-Subject RAG:** Subject-specific vector retrieval across NCERT/CBSE textbooks for Physics, Biology, Chemistry, and Mathematics.
6. **Robust Authentication & Security:** Bcrypt salted passwords, cryptographic JWT session management, isolated verification/password-reset tokens, and in-memory rate limiting.

---

## Quick Start Guide

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment (optional but recommended)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Start the FastAPI server
python main.py
```
*Backend server runs at `http://localhost:8000` (Interactive API docs at `http://localhost:8000/docs`).*

---

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

## Environment Variables

### Backend Configuration (Optional / Defaults provided for local development)
- `JWT_SECRET_KEY`: Cryptographic key for JWT tokens.
- `DATABASE_URL`: Defaults to local SQLite (`sqlite:///edusim.db`) if unset.
- `OPENROUTER_API_KEY`: API key for OpenRouter AI inference.
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed frontend origins (e.g. `http://localhost:5173`).
