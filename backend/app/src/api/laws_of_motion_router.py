from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.src.utils.rate_limiter import rate_limit_ai

laws_of_motion_router = APIRouter(prefix="/laws-of-motion", tags=["Laws of Motion"])

# Domain Data for Newton's 3 Laws of Motion
LAWS_METADATA = {
    "first-law": {
        "law": "first-law",
        "title": "Newton's First Law of Motion",
        "subtitle": "Law of Inertia: Objects maintain constant velocity unless acted upon by a net external force.",
        "formula": "ΣF = 0 ⇒ a = 0 (v = constant)",
        "engine": "inertia_engine",
        "scene": "frictionless_air_track",
        "formulaBreakdown": [
            "ΣF : Sum of external forces acting on the body (N)",
            "a : Resulting acceleration (m/s²)",
            "v : Velocity vector of the object (m/s)"
        ],
        "explanation": "Newton's First Law states that if the net external force acting on an object is zero, an object at rest remains at rest, and an object in motion continues moving at a constant velocity along a straight line. Inertia is the intrinsic property of matter that resists changes in motion, directly proportional to mass.",
        "controls": {
            "gravity": 0.0,
            "friction": 0.0,
            "mass": 2.0,
            "force": 0.0,
            "speed": 5.0,
            "slowMotion": False,
            "showVectors": True,
            "showGraphs": True
        },
        "metrics": [
            {"label": "Net Force", "value": "0.0", "unit": "N", "color": "#3b82f6"},
            {"label": "Velocity", "value": "5.0", "unit": "m/s", "color": "#10b981"},
            {"label": "Acceleration", "value": "0.0", "unit": "m/s²", "color": "#f59e0b"},
            {"label": "Mass", "value": "2.0", "unit": "kg", "color": "#8b5cf6"}
        ],
        "objects": [
            {
                "id": "puck_1",
                "shape": "circle",
                "x": 100,
                "y": 250,
                "vx": 5.0,
                "vy": 0.0,
                "radius": 24,
                "mass": 2.0,
                "color": "#38bdf8",
                "label": "Gliding Puck (v = 5 m/s)",
                "trail": True
            }
        ]
    },
    "second-law": {
        "law": "second-law",
        "title": "Newton's Second Law of Motion",
        "subtitle": "Law of Force and Acceleration: The rate of change of momentum is proportional to the applied force.",
        "formula": "F_net = m · a",
        "engine": "force_engine",
        "scene": "linear_acceleration_track",
        "formulaBreakdown": [
            "F_net : Net applied force in Newtons (N)",
            "m : Inertial mass in kilograms (kg)",
            "a : Acceleration in meters per second squared (m/s²)"
        ],
        "explanation": "Newton's Second Law quantifies the relationship between force, mass, and acceleration. When an unbalanced net force acts upon a body, it causes acceleration in the direction of the force. Doubling the net force doubles acceleration; doubling mass halves acceleration.",
        "controls": {
            "gravity": 9.8,
            "friction": 0.1,
            "mass": 3.0,
            "force": 12.0,
            "speed": 0.0,
            "slowMotion": False,
            "showVectors": True,
            "showGraphs": True
        },
        "metrics": [
            {"label": "Applied Force", "value": "12.0", "unit": "N", "color": "#ef4444"},
            {"label": "Mass", "value": "3.0", "unit": "kg", "color": "#8b5cf6"},
            {"label": "Acceleration", "value": "4.0", "unit": "m/s²", "color": "#f59e0b"},
            {"label": "Velocity", "value": "0.0", "unit": "m/s", "color": "#10b981"}
        ],
        "objects": [
            {
                "id": "cart_1",
                "shape": "rect",
                "x": 80,
                "y": 260,
                "vx": 0.0,
                "vy": 0.0,
                "width": 60,
                "height": 36,
                "mass": 3.0,
                "color": "#f43f5e",
                "label": "Dynamics Cart (3 kg)",
                "trail": True
            }
        ]
    },
    "third-law": {
        "law": "third-law",
        "title": "Newton's Third Law of Motion",
        "subtitle": "Law of Action and Reaction: Whenever one object exerts a force on a second, the second exerts an equal and opposite force.",
        "formula": "F_AB = -F_BA",
        "engine": "reaction_engine",
        "scene": "skater_recoil_track",
        "formulaBreakdown": [
            "F_AB : Force exerted by object A on object B (N)",
            "-F_BA : Equal magnitude force exerted in opposite direction by B on A (N)"
        ],
        "explanation": "Forces always occur in matched interaction pairs. An action force cannot exist in isolation. Although the forces are equal in magnitude and opposite in direction, their resulting accelerations depend on the respective masses of the interacting bodies (a = F/m).",
        "controls": {
            "gravity": 0.0,
            "friction": 0.02,
            "mass": 4.0,
            "force": 20.0,
            "speed": 0.0,
            "slowMotion": False,
            "showVectors": True,
            "showGraphs": True
        },
        "metrics": [
            {"label": "Interaction Force", "value": "20.0", "unit": "N", "color": "#3b82f6"},
            {"label": "Mass 1", "value": "4.0", "unit": "kg", "color": "#06b6d4"},
            {"label": "Mass 2", "value": "2.0", "unit": "kg", "color": "#a855f7"},
            {"label": "Recoil Ratio (a2/a1)", "value": "2.0", "unit": "x", "color": "#10b981"}
        ],
        "objects": [
            {
                "id": "skater_a",
                "shape": "circle",
                "x": 200,
                "y": 250,
                "vx": 0.0,
                "vy": 0.0,
                "radius": 26,
                "mass": 4.0,
                "color": "#06b6d4",
                "label": "Astronaut A (4 kg)",
                "trail": True
            },
            {
                "id": "skater_b",
                "shape": "circle",
                "x": 280,
                "y": 250,
                "vx": 0.0,
                "vy": 0.0,
                "radius": 20,
                "mass": 2.0,
                "color": "#a855f7",
                "label": "Astronaut B (2 kg)",
                "trail": True
            }
        ]
    }
}


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class GenerateRequest(BaseModel):
    prompt: Optional[str] = ""
    law_key: str
    learning_mode: str = "interactive"
    context: Optional[str] = None


class TutorRequest(BaseModel):
    question: str
    law_key: str
    learning_mode: str = "interactive"
    context: Optional[str] = None


class ChallengeRequest(BaseModel):
    law_key: str
    learning_mode: str = "interactive"
    context: Optional[str] = None


class QuizRequest(BaseModel):
    law_key: str
    learning_mode: str = "interactive"
    context: Optional[str] = None


class AnalyticsRequest(BaseModel):
    law_key: str
    profile: Dict[str, Any] = {}


class WhatIfRequest(BaseModel):
    law_key: str
    prompt: str
    learning_mode: str = "interactive"
    context: Optional[str] = None


# ============================================================================
# ENDPOINTS
# ============================================================================

@laws_of_motion_router.get("/catalog")
def get_catalog():
    laws = [
        {
            "law": key,
            "title": data["title"],
            "subtitle": data["subtitle"],
            "formula": data["formula"]
        }
        for key, data in LAWS_METADATA.items()
    ]
    return {"success": True, "laws": laws}


@laws_of_motion_router.post("/generate", dependencies=[Depends(rate_limit_ai)])
def generate_simulation(req: GenerateRequest):
    law_key = req.law_key.lower()
    if law_key not in LAWS_METADATA:
        raise HTTPException(status_code=400, detail=f"Unsupported law_key '{req.law_key}'")

    meta = LAWS_METADATA[law_key]
    simulation_config = {
        "law": law_key,
        "engine": meta["engine"],
        "title": meta["title"],
        "subtitle": meta["subtitle"],
        "scene": meta["scene"],
        "learningMode": req.learning_mode,
        "formula": meta["formula"],
        "formulaBreakdown": meta["formulaBreakdown"],
        "explanation": meta["explanation"],
        "curriculum": {
            "class": "9",
            "subject": "physics",
            "chapter": "laws-of-motion",
            "topic": law_key
        },
        "environment": {
            "gravity": meta["controls"]["gravity"],
            "friction": meta["controls"]["friction"],
            "timeScale": 1.0,
            "background": "lab"
        },
        "controls": meta["controls"],
        "objects": meta["objects"],
        "interactions": [
            "Drag objects to reposition them",
            "Adjust force slider to observe immediate acceleration changes",
            "Toggle friction to observe velocity conservation"
        ],
        "tutorHints": [
            f"Notice how the formula {meta['formula']} relates to the live numerical meters.",
            "Try setting friction to 0 to observe ideal theoretical motion."
        ],
        "examples": [
            "Passengers swaying backward when a bus accelerates forward",
            "Kicking a soccer ball: higher mass requires more force for same acceleration",
            "A rocket expelling exhaust gas downward to propel itself upward"
        ],
        "metrics": meta["metrics"],
        "quiz": {
            "prompt": f"If mass is doubled while keeping force constant, what happens to acceleration according to {meta['title']}?",
            "answer": "Acceleration is halved (a = F / 2m)."
        },
        "narration": f"Welcome to the interactive laboratory for {meta['title']}. Use the controls below to run experiments."
    }

    return {
        "success": True,
        "simulation": simulation_config,
        "reasoning": f"Generated interactive model for {meta['title']} matching curriculum requirements.",
        "tutor": f"You are exploring {meta['title']}. Adjust parameters to observe Newton's principles in action.",
        "retrieval": {
            "law": law_key,
            "summary": meta["explanation"],
            "formulas": [meta["formula"]],
            "examples": [
                "Gliding puck on air table",
                "Accelerating cart on track",
                "Recoil of skateboarding pair"
            ],
            "snippets": meta["formulaBreakdown"]
        }
    }


@laws_of_motion_router.post("/tutor", dependencies=[Depends(rate_limit_ai)])
def ask_tutor(req: TutorRequest):
    law_key = req.law_key.lower()
    meta = LAWS_METADATA.get(law_key, LAWS_METADATA["first-law"])

    answer_text = (
        f"Regarding your question '{req.question}': According to {meta['title']}, "
        f"the governing physical relation is {meta['formula']}. {meta['explanation']} "
        f"In practical terms, observe that force is required to change velocity, not to maintain it."
    )

    return {
        "success": True,
        "answer": answer_text,
        "references": [
            "NCERT Class 9 Physics: Chapter 9 - Force and Laws of Motion",
            f"Principles of Mechanics: {meta['formula']}"
        ],
        "insights": {
            "summary": f"Key physical principle: {meta['formula']}",
            "whyThisHappened": "Forces cause changes in momentum; in the absence of net force, momentum is conserved.",
            "adaptiveExplanation": f"Consider a visual analogy: {meta['subtitle']}",
            "followUpQuestions": [
                "What would happen if friction was completely zero?",
                "How does doubling the mass affect the system's response?"
            ],
            "recommendations": [
                "Run the interactive simulation with zero friction.",
                "Review the momentum vector diagram."
            ],
            "mistakeDetection": []
        }
    }


@laws_of_motion_router.post("/challenge")
def generate_challenge(req: ChallengeRequest):
    law_key = req.law_key.lower()
    meta = LAWS_METADATA.get(law_key, LAWS_METADATA["second-law"])

    challenges = {
        "first-law": {
            "law": "first-law",
            "title": "Zero-G Inertia Challenge",
            "objective": "Guide the probe to the target station at exactly 4 m/s by setting net force to 0.",
            "timerSeconds": 60,
            "target": {"targetVelocity": 4.0, "netForce": 0.0},
            "scoringGuide": ["Precision within 5%", "Zero force maintained during glide"],
            "badges": ["Master of Inertia", "Deep Space Navigator"],
            "hints": ["Once up to speed, cut the thruster to keep moving without fuel."]
        },
        "second-law": {
            "law": "second-law",
            "title": "Target Acceleration Sprint",
            "objective": "Set force and mass so the cart reaches an acceleration of exactly 6.0 m/s².",
            "timerSeconds": 45,
            "target": {"targetAcceleration": 6.0},
            "scoringGuide": ["Match acceleration within 2% margin", "Complete within timer"],
            "badges": ["Force Multiplier", "Dynamics Expert"],
            "hints": ["Remember a = F / m. If mass is 2 kg, what force is required?"]
        },
        "third-law": {
            "law": "third-law",
            "title": "Spacewalk Recoil Docking",
            "objective": "Push off an adjacent astronaut to achieve equal and opposite recoil trajectories.",
            "timerSeconds": 60,
            "target": {"momentumConservation": 1.0},
            "scoringGuide": ["Equal impulse verified", "Recoil speeds inversely proportional to masses"],
            "badges": ["Action-Reaction Master", "Orbital Mechanic"],
            "hints": ["Heavier objects will move slower: m1 * v1 = m2 * v2."]
        }
    }

    challenge = challenges.get(law_key, challenges["second-law"])
    return {"success": True, "challenge": challenge}


@laws_of_motion_router.post("/quiz")
def generate_quiz(req: QuizRequest):
    law_key = req.law_key.lower()
    
    quiz_banks = {
        "first-law": [
            {
                "id": "fl_q1",
                "type": "mcq",
                "prompt": "If no net force acts on a moving object, the object will:",
                "options": [
                    "Slow down and eventually stop",
                    "Continue moving with constant speed along a straight line",
                    "Accelerate exponentially",
                    "Change direction randomly"
                ],
                "correctAnswer": "Continue moving with constant speed along a straight line",
                "explanation": "Newton's First Law states an object continues in its state of uniform motion unless acted upon by a net external force.",
                "hint": "Think of an air puck on a frictionless table.",
                "concept": "Inertia"
            },
            {
                "id": "fl_q2",
                "type": "prediction",
                "prompt": "Which property of a body measures its inertia?",
                "options": ["Velocity", "Mass", "Volume", "Weight"],
                "correctAnswer": "Mass",
                "explanation": "Mass is the quantitative measure of inertia. Greater mass resists changes in motion more strongly.",
                "hint": "It does not change even if gravity changes.",
                "concept": "Mass and Inertia"
            }
        ],
        "second-law": [
            {
                "id": "sl_q1",
                "type": "mcq",
                "prompt": "A net force of 15 N is applied to a mass of 3 kg. What is its acceleration?",
                "options": ["45 m/s²", "15 m/s²", "5 m/s²", "0.2 m/s²"],
                "correctAnswer": "5 m/s²",
                "explanation": "From F = m · a, acceleration a = F / m = 15 / 3 = 5 m/s².",
                "hint": "Divide force by mass.",
                "concept": "F = ma calculation"
            },
            {
                "id": "sl_q2",
                "type": "prediction",
                "prompt": "If the net force on an object is doubled and its mass is doubled, the acceleration will:",
                "options": ["Double", "Be halved", "Quadruple", "Remain unchanged"],
                "correctAnswer": "Remain unchanged",
                "explanation": "a' = (2F) / (2m) = F / m = a. The ratio remains identical.",
                "hint": "Write down the ratio (2F) / (2m).",
                "concept": "Proportionality of Force and Acceleration"
            }
        ],
        "third-law": [
            {
                "id": "tl_q1",
                "type": "mcq",
                "prompt": "When a swimmer pushes water backward with their hands, the reaction force is:",
                "options": [
                    "Water pushing the swimmer backward",
                    "Water pushing the swimmer forward",
                    "The swimmer sinking downward",
                    "Zero because water is liquid"
                ],
                "correctAnswer": "Water pushing the swimmer forward",
                "explanation": "Action: swimmer pushes water backward. Reaction: water exerts an equal opposite force pushing swimmer forward.",
                "hint": "Action and reaction are always opposite in direction.",
                "concept": "Action-Reaction Pairs"
            },
            {
                "id": "tl_q2",
                "type": "prediction",
                "prompt": "Why don't action and reaction forces cancel each other out?",
                "options": [
                    "Because they act on different bodies",
                    "Because one is always greater than the other",
                    "Because they act at different times",
                    "Because forces do not obey addition"
                ],
                "correctAnswer": "Because they act on different bodies",
                "explanation": "Action and reaction act simultaneously on two distinct objects, so they do not cancel in a single body's free body diagram.",
                "hint": "Look at which object experiences each force.",
                "concept": "Interaction on Separate Bodies"
            }
        ]
    }

    quiz = quiz_banks.get(law_key, quiz_banks["second-law"])
    return {"success": True, "quiz": quiz}


@laws_of_motion_router.post("/analytics")
def analyze_learning(req: AnalyticsRequest):
    law_key = req.law_key.lower()
    profile = req.profile

    time_spent = profile.get("timeSpentSeconds", 120)
    interactions = profile.get("interactions", 5)
    experiments = profile.get("experimentsCompleted", 2)
    accuracy = profile.get("quizAccuracy", 0.85)

    analytics = {
        "timeSpentSeconds": time_spent,
        "interactions": interactions,
        "experimentsCompleted": experiments,
        "quizAccuracy": accuracy,
        "strengths": [
            "Consistent understanding of vector directions",
            f"Strong intuition for {LAWS_METADATA.get(law_key, {}).get('title', 'Laws of Motion')}"
        ],
        "weaknesses": [
            "Friction compensation in multi-body systems"
        ],
        "recommendedMode": "interactive",
        "progressPercent": min(100, int((experiments * 25) + (accuracy * 50)))
    }

    return {"success": True, "analytics": analytics}


@laws_of_motion_router.post("/what-if")
def explain_what_if(req: WhatIfRequest):
    law_key = req.law_key.lower()
    prompt = req.prompt.lower()
    meta = LAWS_METADATA.get(law_key, LAWS_METADATA["first-law"])

    if "friction" in prompt or "disappear" in prompt:
        explanation = (
            "If friction completely disappeared, moving objects would never slow down on their own. "
            "Vehicles could not brake or steer, walking would become impossible because feet would slip, "
            "and all kinetic energy would remain conserved indefinitely unless stopped by collisions."
        )
        predicted = "Permanent perpetual motion at constant velocity for any initially moving object."
    elif "gravity" in prompt or "zero" in prompt:
        explanation = (
            "In zero gravity, normal forces disappear unless surfaces are tethered. Objects float in straight "
            "lines at constant velocities until deflected by walls or external impulses."
        )
        predicted = "True 3D ballistic drift matching Newton's First Law without downward gravitational acceleration."
    elif "mass" in prompt or "double" in prompt:
        explanation = (
            "Doubling the mass doubles the inertia (resistance to motion). Under the same applied force, "
            "the resulting acceleration will be halved according to a = F / (2m)."
        )
        predicted = "Acceleration reduces to 50% of its initial value; velocity changes at half the previous rate."
    else:
        explanation = (
            f"Under this hypothetical condition in {meta['title']}, we examine the governing equation {meta['formula']}. "
            "Changing boundary parameters shifts the system's dynamic equilibrium while preserving momentum conservation."
        )
        predicted = "Dynamic response varies proportionally according to Newton's Second and Third Laws."

    return {
        "success": True,
        "whatIf": {
            "prompt": req.prompt,
            "law": law_key,
            "explanation": explanation,
            "predictedOutcome": predicted,
            "followUp": [
                "How would this affect energy conservation?",
                "What would an observer in an accelerating frame see?"
            ],
            "recommendedMode": req.learning_mode
        }
    }
