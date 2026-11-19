import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from collections import deque
import threading
import contextvars

# Context variables to correlate user action with LLM provider calls
current_request_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("current_request_id", default=None)
current_operation: contextvars.ContextVar[str] = contextvars.ContextVar("current_operation", default="general")


@dataclass
class LLMCallRecord:
    timestamp: str
    request_id: str
    operation: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    duration_ms: float
    status: str
    attempt_number: int = 1
    is_fallback: bool = False
    error_type: Optional[str] = None
    error: Optional[str] = None


class LLMTracker:
    """Centralized thread-safe logger and aggregator for LLM token usage, attempts, and request counts."""

    def __init__(self, max_history: int = 500):
        self._lock = threading.Lock()
        self._history: deque = deque(maxlen=max_history)
        self._total_requests: int = 0
        self._total_prompt_tokens: int = 0
        self._total_completion_tokens: int = 0
        self._total_tokens: int = 0
        self._operation_counts: Dict[str, int] = {}
        self._operation_tokens: Dict[str, int] = {}

    def record_call(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        total_tokens: int,
        duration_ms: float,
        status: str = "success",
        operation: Optional[str] = None,
        request_id: Optional[str] = None,
        error: Optional[str] = None,
        success: Optional[bool] = None,
        attempt_number: int = 1,
        is_fallback: bool = False,
        error_type: Optional[str] = None,
    ) -> LLMCallRecord:
        if success is not None:
            status = "success" if success else "failed"
        req_id = request_id or current_request_id.get() or "standalone"
        op = operation or current_operation.get() or "general"

        if total_tokens == 0 and (prompt_tokens > 0 or completion_tokens > 0):
            total_tokens = prompt_tokens + completion_tokens

        record = LLMCallRecord(
            timestamp=datetime.now(timezone.utc).isoformat(),
            request_id=req_id,
            operation=op,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            duration_ms=round(duration_ms, 2),
            status=status,
            attempt_number=attempt_number,
            is_fallback=is_fallback,
            error_type=error_type,
            error=error,
        )

        with self._lock:
            self._history.append(record)
            self._total_requests += 1
            self._total_prompt_tokens += prompt_tokens
            self._total_completion_tokens += completion_tokens
            self._total_tokens += total_tokens

            self._operation_counts[op] = self._operation_counts.get(op, 0) + 1
            self._operation_tokens[op] = self._operation_tokens.get(op, 0) + total_tokens

        fallback_str = " [FALLBACK]" if is_fallback else ""
        err_str = f" | err={error_type}" if error_type else ""
        print(
            f"[LLM Tracker] [{op}] req_id={req_id[:8]} | model={model}{fallback_str} (att={attempt_number}) | "
            f"in={prompt_tokens} out={completion_tokens} total={total_tokens} | "
            f"{duration_ms:.0f}ms | status={status}{err_str}"
        )
        return record

    def get_metrics(self, request_id: Optional[str] = None) -> Dict[str, Any]:
        with self._lock:
            if request_id:
                matching = [r for r in self._history if r.request_id == request_id]
                prompt_toks = sum(r.prompt_tokens for r in matching)
                comp_toks = sum(r.completion_tokens for r in matching)
                tot_toks = sum(r.total_tokens for r in matching)
                ops = {}
                for r in matching:
                    ops[r.operation] = ops.get(r.operation, 0) + 1
                return {
                    "request_id": request_id,
                    "provider_requests": len(matching),
                    "prompt_tokens": prompt_toks,
                    "completion_tokens": comp_toks,
                    "total_tokens": tot_toks,
                    "operations": ops,
                    "calls": [asdict(r) for r in matching],
                }

            return {
                "total_provider_requests": self._total_requests,
                "total_prompt_tokens": self._total_prompt_tokens,
                "total_completion_tokens": self._total_completion_tokens,
                "total_tokens": self._total_tokens,
                "operation_counts": dict(self._operation_counts),
                "operation_tokens": dict(self._operation_tokens),
                "recent_calls_count": len(self._history),
                "calls": [asdict(r) for r in self._history],
            }

    def get_recent_calls(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._lock:
            calls = list(self._history)[-limit:]
            return [asdict(r) for r in reversed(calls)]

    def reset(self):
        with self._lock:
            self._history.clear()
            self._total_requests = 0
            self._total_prompt_tokens = 0
            self._total_completion_tokens = 0
            self._total_tokens = 0
            self._operation_counts.clear()
            self._operation_tokens.clear()


# Global tracker instance
llm_tracker = LLMTracker()
