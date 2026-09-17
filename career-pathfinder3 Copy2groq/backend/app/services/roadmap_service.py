from __future__ import annotations

from app.services.json_data_service import load_roadmaps


def _normalize(value: str) -> str:
    return " ".join(
        (value or "").lower().strip().split()
    )


def get_career_roadmap(career_name: str) -> dict:
    roadmaps = load_roadmaps()

    if isinstance(roadmaps, dict):
        roadmaps = roadmaps.get("roadmaps", [])

    target = _normalize(career_name)

    # Exact match
    for roadmap in roadmaps:
        title = roadmap.get(
            "career",
            roadmap.get(
                "title",
                roadmap.get("role", "")
            )
        )

        if _normalize(title) == target:
            return roadmap

    # Partial match
    for roadmap in roadmaps:
        title = roadmap.get(
            "career",
            roadmap.get(
                "title",
                roadmap.get("role", "")
            )
        )

        normalized_title = _normalize(title)

        if (
            target in normalized_title
            or normalized_title in target
        ):
            return roadmap

    raise ValueError(
        f"Roadmap for '{career_name}' was not found."
    )