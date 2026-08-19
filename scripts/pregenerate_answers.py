import sys
import os
import asyncio
import yaml
import uuid
import logging

# Setup basic logging to console
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("pregenerate_answers")

# Add services/api to python path so we can resolve imports
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "services/api"))

from app.src.config.database import SessionLocal
from app.src.models.user import User
from app.src.models.persistence import TutorCachedAnswer
from app.src.api.tutor_router import call_with_fallback, generate_cache_hash, TUTOR_PROMPTS


async def pregenerate():
    yaml_path = os.path.join(os.path.dirname(__file__), "common_physics_questions.yaml")
    if not os.path.exists(yaml_path):
        logger.error(f"Questions YAML file not found at: {yaml_path}")
        return

    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    # 1. Fetch or create a system user to pass foreign key constraint checks in tutor logs
    db = SessionLocal()
    user = db.query(User).first()
    if not user:
        logger.info("No user found in database. Creating a system user for pregeneration logs...")
        from app.src.models.user import UserRole
        from app.src.models.user import AgeTier
        
        # Resolve AgeTier enum or use string fallback depending on schema
        try:
            tier_enum = AgeTier.MIDDLE
        except Exception:
            tier_enum = "middle"
            
        try:
            role_enum = UserRole.STUDENT
        except Exception:
            role_enum = "student"

        user = User(
            id=uuid.uuid4(),
            email="system.pregen@edusim.edu",
            name="System Pregenerator",
            role=role_enum,
            age_tier=tier_enum
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"System user created with ID: {user.id}")

    student_id = user.id
    db.close()

    # 2. Iterate through all tiers and questions
    for tier, items in data.items():
        logger.info(f"Processing tier: {tier} ({len(items)} questions)...")
        for idx, item in enumerate(items, 1):
            topic = item.get("topic")
            question = item.get("question")
            if not topic or not question:
                continue

            q_hash = generate_cache_hash(tier, topic, question)
            logger.info(f"[{tier}] ({idx}/{len(items)}) Generating answer for: '{question}' (Hash: {q_hash})")

            # Check if already pregenerated
            db = SessionLocal()
            existing = db.query(TutorCachedAnswer).filter(TutorCachedAnswer.question_hash == q_hash).first()
            db.close()
            if existing:
                logger.info(f"  -> Answer already pregenerated in database. Skipping...")
                continue

            # Build messages
            system_template = TUTOR_PROMPTS.get(tier, TUTOR_PROMPTS["high_school"])
            system_prompt = system_template.format(
                topic=topic,
                subject="Physics",
                board="CBSE"
            )
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ]

            response_chunks = []
            try:
                # Call call_with_fallback generator
                async for chunk in call_with_fallback(messages, student_id, tier, SessionLocal, topic, question):
                    response_chunks.append(chunk)

                explanation = "".join(response_chunks)
                if explanation.startswith("Error:"):
                    logger.error(f"  -> Failed to generate answer: {explanation}")
                    continue

                # Save answer into tutor_cached_answers
                db = SessionLocal()
                new_cached_answer = TutorCachedAnswer(
                    question_hash=q_hash,
                    age_tier=tier,
                    answer=explanation
                )
                db.add(new_cached_answer)
                db.commit()
                db.close()
                logger.info("  -> Saved answer successfully.")
                
            except Exception as e:
                logger.error(f"  -> Error occurred during pregeneration: {e}")

            # Sleep slightly to avoid OpenRouter rate limiting
            await asyncio.sleep(1.0)


if __name__ == "__main__":
    asyncio.run(pregenerate())
