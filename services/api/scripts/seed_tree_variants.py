"""Seed extra tree variants into the assets table."""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from dotenv import load_dotenv
load_dotenv()
from app.src.config.database import engine
from sqlalchemy import text

EXTRA = [
    (
        "tree-pine",
        "Pine Tree",
        (
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 130'>"
            "<rect x='44' y='95' width='12' height='35' fill='#8B4513'/>"
            "<polygon points='50,5 10,65 90,65' fill='#1B5E20'/>"
            "<polygon points='50,30 12,80 88,80' fill='#2E7D32'/>"
            "<polygon points='50,55 14,95 86,95' fill='#388E3C'/>"
            "</svg>"
        ),
        ["nature", "plant", "green", "forest", "tree"],
        ["primary", "middle", "high_school", "university"],
    ),
    (
        "tree-palm",
        "Palm Tree",
        (
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 130'>"
            "<rect x='45' y='55' width='10' height='75' rx='4' fill='#A0784A'/>"
            "<ellipse cx='50' cy='35' rx='40' ry='15' fill='#388E3C' transform='rotate(-20 50 35)'/>"
            "<ellipse cx='50' cy='40' rx='40' ry='15' fill='#43A047' transform='rotate(20 50 40)'/>"
            "<ellipse cx='50' cy='30' rx='35' ry='12' fill='#2E7D32'/>"
            "<circle cx='50' cy='55' r='8' fill='#A0784A'/>"
            "</svg>"
        ),
        ["nature", "plant", "tropical", "beach", "tree"],
        ["primary", "middle", "high_school", "university"],
    ),
    (
        "tree-autumn",
        "Autumn Tree",
        (
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 120'>"
            "<rect x='44' y='80' width='12' height='40' fill='#5D4037'/>"
            "<circle cx='50' cy='55' r='35' fill='#E64A19'/>"
            "<circle cx='35' cy='60' r='25' fill='#FF6D00'/>"
            "<circle cx='65' cy='60' r='25' fill='#FFB300'/>"
            "<circle cx='50' cy='42' r='20' fill='#EF6C00'/>"
            "</svg>"
        ),
        ["nature", "plant", "autumn", "seasonal", "tree"],
        ["primary", "middle", "high_school", "university"],
    ),
]

with engine.connect() as conn:
    for slug, name, svg, tags, tiers in EXTRA:
        existing = conn.execute(
            text("SELECT id FROM assets WHERE slug = :slug"),
            {"slug": slug}
        ).fetchone()
        if existing:
            print(f"  skip (exists): {slug}")
            continue
        conn.execute(
            text(
                "INSERT INTO assets (slug, name, svg_content, tags, tier_allowed) "
                "VALUES (:slug, :name, :svg, :tags, :tiers)"
            ),
            {"slug": slug, "name": name, "svg": svg, "tags": tags, "tiers": tiers},
        )
        print(f"  inserted: {slug}")
    conn.commit()

print("done — total extra trees seeded.")
