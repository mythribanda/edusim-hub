# EduSim-Hub

An educational simulation platform monorepo configured with Turborepo.

## Directory Structure

```text
edusim-hub/
├── apps/
│   ├── web/               # Main web application (Preserved TanStack Start/Vite frontend)
│   └── teacher-portal/    # Teacher portal (Next.js 14, App Router, TypeScript, Tailwind)
├── packages/
│   ├── shared-types/      # Common TypeScript interfaces and types
│   ├── ui/                # Shared UI component library
│   ├── rbac/              # Role-Based Access Control logic
│   ├── asset-registry/    # Asset catalog registry types and utilities
│   ├── ai-tutor/          # AI tutoring components and definitions
│   └── scenario-engine/   # Scenario simulation engine definitions
├── services/
│   ├── api/               # Backend API (FastAPI, Python 3.11)
│   └── events/            # Events service (Node.js/TypeScript microservice)
└── supabase/
    └── migrations/        # Supabase migration scripts
```

## Setup & Scripts

This monorepo uses npm workspaces and Turborepo to orchestrate tasks across the codebase.

### Prerequisites

- Node.js (v18 or newer recommended)
- Python 3.11 (for the API service)
- npm (v9 or newer recommended)

### Getting Started

Install dependencies for all workspaces at the root:

```bash
npm install
```

### Development

To start dev servers for all JS/TS workspaces concurrently:

```bash
npm run dev
```

To run a specific workspace:

```bash
npx turbo run dev --filter=<workspace-name>
```

### Build

To compile all projects:

```bash
npm run build
```

### Formatting & Linting

To run ESLint across all workspaces:

```bash
npm run lint
```

To automatically format the codebase with Prettier:

```bash
npm run format
```

### Backend API (services/api)

The API service is run via Python/Uvicorn.
To run the backend API service:

```bash
cd services/api
# Set up venv and install requirements
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
# Run the server
uvicorn main:app --reload
```
