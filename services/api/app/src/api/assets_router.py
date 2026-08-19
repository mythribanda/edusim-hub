"""
GET /api/assets — Asset search endpoint.

Query parameters:
  - tags   : comma-separated tag strings to filter by (OR match — any asset
              containing at least one of the supplied tags is returned).
  - tier   : one of primary | middle | high_school | university — assets must
              include this value in their tier_allowed array.
  - search : fuzzy substring match on name and slug (case-insensitive).

All parameters are optional; omitting all returns the first 200 assets.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.src.config.database import get_db

logger = logging.getLogger("EduSim.assets")

assets_router = APIRouter(tags=["Assets"])

# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------

class AssetOut(BaseModel):
    id: str
    slug: str
    name: str
    svg_content: Optional[str]
    tags: list[str]
    tier_allowed: list[str]
    created_at: Optional[str]

    class Config:
        from_attributes = True


class AssetsResponse(BaseModel):
    success: bool = True
    total: int
    assets: list[AssetOut]


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@assets_router.get("/assets", response_model=AssetsResponse)
async def search_assets(
    tags: Optional[str] = Query(None, description="Comma-separated tags — any match"),
    tier: Optional[str] = Query(None, description="Age tier the asset must support"),
    search: Optional[str] = Query(None, description="Fuzzy substring match on name/slug"),
    limit: int = Query(200, ge=1, le=500, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
) -> AssetsResponse:
    """Return assets matching the supplied filters."""

    is_postgres = "postgresql" in str(db.bind.url) or "postgres" in str(db.bind.url)

    # Build WHERE clauses incrementally
    conditions: list[str] = []
    params: dict = {"limit": limit, "offset": offset}

    # -- search: fuzzy match on name OR slug --------------------------------
    if search and search.strip():
        params["search"] = f"%{search.strip().lower()}%"
        conditions.append("(LOWER(a.name) LIKE :search OR LOWER(a.slug) LIKE :search)")

    # -- tier: must appear in tier_allowed array ----------------------------
    if tier and tier.strip():
        params["tier"] = tier.strip()
        if is_postgres:
            conditions.append(":tier = ANY(a.tier_allowed)")
        else:
            # SQLite stores arrays as comma-separated text in seed; do LIKE check
            conditions.append("a.tier_allowed LIKE '%' || :tier || '%'")

    # -- tags: any supplied tag must appear in the asset's tags array -------
    tag_list: list[str] = []
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]

    if tag_list:
        if is_postgres:
            # PostgreSQL: tags && ARRAY[...] (overlap operator)
            tag_params = ", ".join(f":tag_{i}" for i in range(len(tag_list)))
            conditions.append(f"a.tags && ARRAY[{tag_params}]")
            for i, tag in enumerate(tag_list):
                params[f"tag_{i}"] = tag
        else:
            # SQLite fallback: check each tag with LIKE
            tag_clauses = " OR ".join(
                f"a.tags LIKE '%' || :tag_{i} || '%'" for i in range(len(tag_list))
            )
            conditions.append(f"({tag_clauses})")
            for i, tag in enumerate(tag_list):
                params[f"tag_{i}"] = tag

    where_sql = "WHERE " + " AND ".join(conditions) if conditions else ""

    # --- Count query -------------------------------------------------------
    count_sql = f"SELECT COUNT(*) FROM assets a {where_sql}"
    try:
        total_result = db.execute(text(count_sql), params).scalar()
        total: int = int(total_result or 0)
    except Exception as e:
        logger.warning(f"[assets] assets table not found or error in count: {e}")
        return AssetsResponse(success=True, total=0, assets=[])

    # --- Data query --------------------------------------------------------
    data_sql = f"""
        SELECT
            a.id::text,
            a.slug,
            a.name,
            a.svg_content,
            a.tags,
            a.tier_allowed,
            a.created_at::text
        FROM assets a
        {where_sql}
        ORDER BY a.name ASC
        LIMIT :limit OFFSET :offset
    """
    # SQLite doesn't have ::text casting
    if not is_postgres:
        data_sql = f"""
            SELECT
                a.id,
                a.slug,
                a.name,
                a.svg_content,
                a.tags,
                a.tier_allowed,
                a.created_at
            FROM assets a
            {where_sql}
            ORDER BY a.name ASC
            LIMIT :limit OFFSET :offset
        """

    try:
        rows = db.execute(text(data_sql), params).mappings().all()
    except Exception as e:
        logger.error(f"[assets] Query error: {e}")
        return AssetsResponse(success=True, total=0, assets=[])

    def _to_list(val) -> list[str]:
        """Coerce Postgres array or SQLite text to a Python list."""
        if val is None:
            return []
        if isinstance(val, list):
            return [str(v) for v in val]
        # SQLite / text representation: {tag1,tag2} or tag1,tag2
        return [v.strip().strip("{}") for v in str(val).split(",") if v.strip()]

    assets_out = [
        AssetOut(
            id=str(row["id"]),
            slug=row["slug"],
            name=row["name"],
            svg_content=row["svg_content"],
            tags=_to_list(row["tags"]),
            tier_allowed=_to_list(row["tier_allowed"]),
            created_at=str(row["created_at"]) if row["created_at"] else None,
        )
        for row in rows
    ]

    logger.info(f"[assets] search={search!r} tags={tag_list} tier={tier!r} → {len(assets_out)}/{total}")
    return AssetsResponse(success=True, total=total, assets=assets_out)
