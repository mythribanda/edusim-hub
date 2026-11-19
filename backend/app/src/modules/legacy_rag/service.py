import logging
from typing import List, Dict, Any, Optional
from .vector_loader import vector_store, normalize_subject_name
from .generator import generate_response

logger = logging.getLogger("EduSim.RAGService")

MAX_CONTEXT_CHUNKS = 3
MAX_CHUNK_CHARS = 650
DEFAULT_SIMILARITY_THRESHOLD = 0.30


async def query_rag_service(query: str, subject: Optional[str] = "physics") -> Dict[str, Any]:
    """
    Core RAG service logic:
    1. Checks subject support transparently.
    2. Queries the dedicated subject index using cosine similarity.
    3. Filters weak matches and avoids sending excessive context to the LLM.
    4. Handles empty retrieval with a safe, grounded educational fallback.
    """
    try:
        norm_subject = normalize_subject_name(subject)

        # 1. Check if subject is supported in vectorstore
        if not vector_store.is_subject_supported(norm_subject):
            supported_subjects = [s.capitalize() for s in vector_store.supported_subjects]
            logger.info(f"Subject '{subject}' not indexed. Supported: {supported_subjects}")

            # Do not inject unrelated physics textbooks into non-physics questions
            answer = generate_response(
                context="",
                question=query,
                fallback_mode=True
            )
            return {
                "answer": answer,
                "context": [],
                "fallback_mode": True,
                "subject_supported": False,
                "message": f"Subject '{subject}' is not indexed in the textbook vectorstore. Indexed subjects: {', '.join(supported_subjects)}."
            }

        # 2. Retrieve from subject-specific index
        retriever = vector_store.get_retriever(norm_subject)
        if not retriever:
            return {
                "answer": "The requested textbook index is currently being initialized. Please try again in a few moments.",
                "context": [],
                "fallback_mode": True,
                "subject_supported": True
            }

        results = retriever(query, top_k=5, threshold=DEFAULT_SIMILARITY_THRESHOLD)

        # 3. Sort by similarity score and cap context size to avoid LLM token bloat
        filtered_results = sorted(results, key=lambda r: r.get("score", 0), reverse=True)[:MAX_CONTEXT_CHUNKS]

        if not filtered_results:
            logger.info(f"No strong matches found above threshold {DEFAULT_SIMILARITY_THRESHOLD} for query: {query[:60]}")
            context = ""
            fallback_mode = True
        else:
            context_blocks = []
            for r in filtered_results:
                raw_text = r.get("text", "").strip()
                if len(raw_text) > MAX_CHUNK_CHARS:
                    raw_text = raw_text[:MAX_CHUNK_CHARS].rsplit(" ", 1)[0] + "..."

                src = r.get("source", "Textbook")
                pg = r.get("page", 0)
                sub_label = r.get("subject", norm_subject).capitalize()
                context_blocks.append(f"[{sub_label} | {src} (Page {pg})]:\n{raw_text}")

            context = "\n\n".join(context_blocks)
            fallback_mode = False

        # 4. Generate LLM response
        answer = generate_response(
            context=context,
            question=query,
            fallback_mode=fallback_mode
        )

        return {
            "answer": answer,
            "context": filtered_results,
            "fallback_mode": fallback_mode,
            "subject_supported": True
        }

    except Exception as e:
        logger.error(f"Error in query_rag_service: {e}", exc_info=True)
        raise e
