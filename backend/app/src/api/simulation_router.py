from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.src.utils.rate_limiter import rate_limit_ai

from app.src.config.database import get_db
from app.src.services.persistence_service import record_activity, resolve_user_from_authorization

from app.src.modules.simulation_synthesis.controller import (
    AgentGenerateRequest,
    synthesis_generate_controller,
    synthesis_list_controller,
    synthesis_get_controller,
    synthesis_export_controller,
    synthesis_generate_stream_controller,
)

simulation_router = APIRouter()


# ============================================================================
# DETERMINISTIC PHYSICS SIMULATION ENDPOINTS
# ============================================================================

class MomentumRequest(BaseModel):
    mass: float
    force: float
    time: Optional[float] = 5.0
    dt: Optional[float] = 0.1


class MomentumTrajectoryPoint(BaseModel):
    t: float
    v: float
    a: float
    f: float
    x: float


class ActionReactionRequest(BaseModel):
    mass1: float
    mass2: float
    force: float
    time: Optional[float] = 5.0
    dt: Optional[float] = 0.1


class ActionReactionTrajectoryPoint(BaseModel):
    t: float
    position: float


@simulation_router.post("/momentum")
def simulate_momentum(request: MomentumRequest):
    if request.mass <= 0:
        raise HTTPException(status_code=400, detail="Mass must be greater than zero.")

    acceleration = request.force / request.mass
    duration = min(max(request.time or 5.0, 0.5), 30.0)
    step = min(max(request.dt or 0.1, 0.01), 1.0)

    trajectory: List[dict] = []
    current_t = 0.0
    while current_t <= duration + 1e-9:
        v = acceleration * current_t
        x = 0.5 * acceleration * (current_t ** 2)
        trajectory.append({
            "t": round(current_t, 2),
            "v": round(v, 4),
            "a": round(acceleration, 4),
            "f": round(request.force, 4),
            "x": round(x, 4),
        })
        current_t += step

    return {
        "success": True,
        "data": {
            "acceleration": round(acceleration, 4),
            "force": request.force,
            "mass": request.mass,
            "trajectory": trajectory,
        },
    }


@simulation_router.post("/action-reaction")
def simulate_action_reaction(request: ActionReactionRequest):
    if request.mass1 <= 0 or request.mass2 <= 0:
        raise HTTPException(status_code=400, detail="Mass values must be greater than zero.")

    # Newton's Third Law: F1 = -F, F2 = F
    acceleration1 = -request.force / request.mass1
    acceleration2 = request.force / request.mass2
    duration = min(max(request.time or 5.0, 0.5), 30.0)
    step = min(max(request.dt or 0.1, 0.01), 1.0)

    traj1: List[dict] = []
    traj2: List[dict] = []
    current_t = 0.0
    while current_t <= duration + 1e-9:
        x1 = 0.5 * acceleration1 * (current_t ** 2)
        x2 = 0.5 * acceleration2 * (current_t ** 2)
        traj1.append({"t": round(current_t, 2), "position": round(x1, 4)})
        traj2.append({"t": round(current_t, 2), "position": round(x2, 4)})
        current_t += step

    return {
        "success": True,
        "data": {
            "acceleration1": round(acceleration1, 4),
            "acceleration2": round(acceleration2, 4),
            "trajectories": {
                "object1": traj1,
                "object2": traj2,
            },
        },
    }


# ============================================================================
# SYNTHESIS GENERATION ENDPOINTS
# ============================================================================

@simulation_router.post("/synthesis/generate", dependencies=[Depends(rate_limit_ai)])
async def generate_synthesized_simulation(
    request: AgentGenerateRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    response = await synthesis_generate_controller(request)
    user = resolve_user_from_authorization(authorization, db)
    if user:
        record_activity(
            db,
            user=user,
            domain="simulation",
            action="synthesis-generate",
            entity_type="simulation",
            entity_id=str(response.get("id") or request.prompt[:120]),
            source="/api/simulations/synthesis/generate",
            metadata={"topic": request.topic},
        )
        try:
            db.commit()
            print("[Database] Activity logs saved in the database: updated")
            if isinstance(response, dict):
                response["message"] = "Simulation progress saved successfully."
        except Exception as e:
            db.rollback()
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=500, content={"success": False, "message": "Failed to save simulation progress."})
    return response


@simulation_router.get("/synthesis/list")
async def list_synthesized_simulations(limit: int = 30):
    return await synthesis_list_controller(limit=limit)


@simulation_router.get("/synthesis/{simulation_id}")
async def get_synthesized_simulation(simulation_id: str):
    return await synthesis_get_controller(simulation_id=simulation_id)


@simulation_router.get("/synthesis/{simulation_id}/export")
async def export_synthesized_simulation(simulation_id: str):
    return await synthesis_export_controller(simulation_id=simulation_id)


@simulation_router.post("/synthesis/generate-stream", dependencies=[Depends(rate_limit_ai)])
async def generate_synthesized_simulation_stream(
    request: AgentGenerateRequest,
):
    return await synthesis_generate_stream_controller(request)


# ============================================================================
# SIMPLIFIED AI SIMULATION ENDPOINTS
# ============================================================================

@simulation_router.post("/agent/generate", dependencies=[Depends(rate_limit_ai)])
async def generate_with_agent(request: AgentGenerateRequest):
    return await synthesis_generate_controller(request)


@simulation_router.post("/agent/generate-stream", dependencies=[Depends(rate_limit_ai)])
async def generate_with_agent_stream(request: AgentGenerateRequest):
    return await synthesis_generate_stream_controller(request)


@simulation_router.post("/agent/error-report")
async def report_agent_error(simulation_id: str | None = None, payload: dict | None = None):
    return {"success": True, "detail": "Telemetry disabled by design."}


@simulation_router.post("/runtime/report")
async def report_runtime_intelligence(report_data: dict):
    return {"success": True, "detail": "Telemetry disabled by design."}
