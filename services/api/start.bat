@echo off
echo Starting EduSim-Hub FastAPI Backend on port 8001...
call venv\Scripts\activate
uvicorn main:app --reload --port 8001 --host 0.0.0.0
