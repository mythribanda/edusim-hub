"""
weekly_digest.py
────────────────
APScheduler cron job that fires every Sunday at 20:00 IST (14:30 UTC).

Idempotency: before sending, we INSERT into weekly_digest_logs with a
UNIQUE constraint on (parent_id, week_key).  If the row already exists the
INSERT raises IntegrityError, we catch it and skip — safe to run twice.

Email provider: Resend  (https://resend.com)
  Set RESEND_API_KEY in the environment.
  Falls back silently (logs an error) when the key is absent so the rest of
  the app keeps working in dev without an email key.

LLM encouragement line: smallest free OpenRouter model
  meta-llama/llama-3.1-8b-instruct:free  (≤ 60 tokens, 2-3 s cold-start)
"""

import json
import logging
import os
from datetime import datetime, timezone, timedelta

import httpx
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.src.config.database import SessionLocal
from app.src.models.persistence import ParentStudent, WeeklyDigestLog
from app.src.models.user import User

logger = logging.getLogger("EduSim.digest")

# ── configuration ────────────────────────────────────────────────────────────
RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
FROM_ADDRESS: str = os.getenv("DIGEST_FROM_EMAIL", "EduSim Hub <digest@edusim.app>")
OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
ENCOURAGEMENT_MODEL: str = "meta-llama/llama-3.1-8b-instruct:free"

# ── helpers ───────────────────────────────────────────────────────────────────

def _current_week_key() -> str:
    """Return ISO week key like '2026-W34' (Monday-anchored, UTC)."""
    now = datetime.now(timezone.utc)
    year, week, _ = now.isocalendar()
    return f"{year}-W{week:02d}"


def _format_duration(seconds: int) -> str:
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


async def _generate_encouragement(child_name: str, modules: int, topics: list[str]) -> str:
    """Call the smallest LLM to produce a one-sentence encouragement line."""
    if not OPENROUTER_API_KEY:
        return f"Keep up the great work, {child_name}! Every question you ask makes you smarter."

    topic_preview = ", ".join(topics[:3]) if topics else "physics"
    prompt = (
        f"Write exactly one warm, encouraging sentence (max 20 words) for a student named "
        f"{child_name} who completed {modules} module(s) this week and explored topics like "
        f"{topic_preview}. Do not use markdown. Reply with only the sentence."
    )
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": ENCOURAGEMENT_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 60,
                    "temperature": 0.8,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as exc:
        logger.warning("[digest] Encouragement LLM failed: %s", exc)
        return f"Keep exploring, {child_name} — every step forward counts!"


def _build_child_metrics(db, child_id, now: datetime, start_of_week: datetime) -> dict:
    """Compute all metrics for a single child using raw SQL (mirrors /parents/metrics)."""

    # Modules completed this week
    modules_completed = db.execute(
        text(
            "SELECT COUNT(DISTINCT module_id) FROM session_events "
            "WHERE student_id = :sid AND event_type = 'completed' AND created_at >= :sow"
        ),
        {"sid": child_id, "sow": start_of_week},
    ).scalar() or 0

    # Time spent
    rows = db.execute(
        text(
            "SELECT module_id, event_type, created_at FROM session_events "
            "WHERE student_id = :sid AND created_at >= :sow ORDER BY created_at ASC"
        ),
        {"sid": child_id, "sow": start_of_week},
    ).fetchall()

    daily_buckets: dict = {}
    for module_id, ev_type, created_at in rows:
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        key = (created_at.date(), module_id)
        daily_buckets.setdefault(key, []).append({"type": ev_type, "ts": created_at})

    time_spent_s = 0
    for events in daily_buckets.values():
        started = [e["ts"] for e in events if e["type"] == "started"]
        t_start = min(started) if started else min(e["ts"] for e in events)
        t_end = max(e["ts"] for e in events)
        if t_end > t_start:
            time_spent_s += int((t_end - t_start).total_seconds())

    # AI Tutor topics asked this week (unique, from payload.topic)
    topic_rows = db.execute(
        text(
            "SELECT payload FROM session_events "
            "WHERE student_id = :sid AND event_type = 'asked_tutor' AND created_at >= :sow"
        ),
        {"sid": child_id, "sow": start_of_week},
    ).fetchall()

    topics: set[str] = set()
    for (payload,) in topic_rows:
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except Exception:
                payload = {}
        if isinstance(payload, dict) and payload.get("topic"):
            topics.add(payload["topic"])

    # Homework: submitted / total
    child_user = db.query(User).filter(User.id == child_id).first()
    total_hw = submitted_hw = 0
    if child_user and child_user.class_id:
        total_hw = db.execute(
            text("SELECT COUNT(*) FROM assignments WHERE class_id = :cid"),
            {"cid": child_user.class_id},
        ).scalar() or 0
        submitted_hw = db.execute(
            text(
                "SELECT COUNT(*) FROM submissions "
                "WHERE student_id = :sid AND assignment_id IN "
                "(SELECT id FROM assignments WHERE class_id = :cid)"
            ),
            {"sid": child_id, "cid": child_user.class_id},
        ).scalar() or 0

    return {
        "modules_completed": int(modules_completed),
        "time_spent_s": time_spent_s,
        "topics": sorted(topics),
        "submitted_hw": int(submitted_hw),
        "total_hw": int(total_hw),
    }


def _build_email_body(child_name: str, metrics: dict, encouragement: str) -> str:
    topics_line = (
        ", ".join(metrics["topics"]) if metrics["topics"] else "none recorded this week"
    )
    duration = _format_duration(metrics["time_spent_s"])
    hw = f"{metrics['submitted_hw']}/{metrics['total_hw']}"

    return (
        f"Hi there,\n\n"
        f"Here is {child_name}'s learning summary for this week on EduSim Hub:\n\n"
        f"  - Modules completed:  {metrics['modules_completed']}\n"
        f"  - Time spent:         {duration}\n"
        f"  - Topics explored:    {topics_line}\n"
        f"  - Homework status:    {hw} submitted\n\n"
        f"{encouragement}\n\n"
        f"— The EduSim Hub Team\n"
        f"https://edusim.app\n"
    )


async def _send_via_resend(to_email: str, subject: str, body: str) -> None:
    if not RESEND_API_KEY:
        logger.warning(
            "[digest] RESEND_API_KEY not set — would have sent to %s:\n%s", to_email, body
        )
        return

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": FROM_ADDRESS,
                "to": [to_email],
                "subject": subject,
                "text": body,
            },
        )
        if resp.status_code not in (200, 201):
            logger.error(
                "[digest] Resend API error %s: %s", resp.status_code, resp.text
            )
        else:
            logger.info("[digest] Email sent to %s — Resend id: %s", to_email, resp.json().get("id"))


# ── main job ──────────────────────────────────────────────────────────────────

async def run_weekly_digest() -> None:
    """
    Entry point called by APScheduler every Sunday at 20:00 IST.

    For every parent with linked children:
      1. Check idempotency guard (weekly_digest_logs).
      2. Compute each child's weekly metrics.
      3. Generate one LLM encouragement sentence.
      4. Send a plain-text email via Resend.
      5. Record the send in weekly_digest_logs.
    """
    logger.info("[digest] Weekly digest job started.")
    week_key = _current_week_key()
    now = datetime.now(timezone.utc)
    start_of_week = now - timedelta(days=7)

    db = SessionLocal()
    try:
        # All unique parents that have at least one linked student
        parent_links = db.query(ParentStudent).all()

        parents_seen: set = set()
        for link in parent_links:
            parent_id = link.parent_id
            if parent_id in parents_seen:
                continue
            parents_seen.add(parent_id)

            parent = db.query(User).filter(User.id == parent_id).first()
            if not parent or not parent.email:
                continue

            # ── idempotency check ────────────────────────────────────────────
            try:
                log_entry = WeeklyDigestLog(parent_id=parent_id, week_key=week_key)
                db.add(log_entry)
                db.flush()          # raises IntegrityError if row already exists
            except IntegrityError:
                db.rollback()
                logger.info(
                    "[digest] Skipping parent %s — already sent for week %s",
                    parent.email, week_key,
                )
                continue

            # ── build one block per child ────────────────────────────────────
            children = [lnk for lnk in parent_links if lnk.parent_id == parent_id]
            email_blocks: list[str] = []

            for child_link in children:
                child = child_link.student
                metrics = _build_child_metrics(db, child.id, now, start_of_week)
                encouragement = await _generate_encouragement(
                    child.name, metrics["modules_completed"], metrics["topics"]
                )

                # Subject is per-child; if multiple children we send one email per child
                subject = f"{child.name}'s learning this week on EduSim-Hub"
                body = _build_email_body(child.name, metrics, encouragement)

                try:
                    await _send_via_resend(parent.email, subject, body)
                except Exception as exc:
                    logger.error("[digest] Failed to send email for child %s: %s", child.name, exc)

                email_blocks.append(child.name)

            db.commit()
            logger.info(
                "[digest] Digest sent to %s for children: %s",
                parent.email, ", ".join(email_blocks),
            )

    except Exception as exc:
        db.rollback()
        logger.error("[digest] Unhandled error in digest job: %s", exc, exc_info=True)
    finally:
        db.close()

    logger.info("[digest] Weekly digest job complete.")
