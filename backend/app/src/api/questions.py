from fastapi import APIRouter, Depends
from app.src.utils.rate_limiter import rate_limit_ai
from pydantic import BaseModel
from app.src.services.question_service import QuestionService
from app.src.models.question_models import QuestionGenerationResponse

router = APIRouter()

class QuestionRequest(BaseModel):
    subject: str = "physics"
    class_name: str = ""
    chapter: str = ""
    topic: str = ""
    formula: str = ""
    difficulty: str = "Medium"
    question_type: str = "mixed"

@router.post("/generate", response_model=QuestionGenerationResponse, dependencies=[Depends(rate_limit_ai)])
async def generate_questions(req: QuestionRequest):
    return await QuestionService.generate_questions(req.subject, req.class_name, req.chapter, req.topic, req.formula, req.difficulty, req.question_type)
