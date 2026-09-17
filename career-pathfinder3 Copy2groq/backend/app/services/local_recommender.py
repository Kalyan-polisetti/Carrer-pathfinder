"""
Local (non-AI) career recommendation engine.

Career information is stored in the PostgreSQL `careers` table.
This module contains only the recommendation/scoring algorithm.

The recommendation engine is fully local and rule-based.

Career data flow:

    careers.json
        ↓
    seed_careers.py
        ↓
    PostgreSQL careers table
        ↓
    local_recommender.py
        ↓
    Top career recommendations
"""

from __future__ import annotations

import hashlib

from sqlalchemy.orm import Session

from app.models.career import Career


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def _stable_jitter(seed: str, low: int, high: int) -> int:
    """
    Generate a deterministic pseudo-random number.

    Used only to create small gaps between similar recommendation
    percentages while keeping results stable for the same career.
    """

    digest = hashlib.sha256(
        seed.encode("utf-8")
    ).hexdigest()

    value = int(digest[:8], 16)

    return low + (
        value % (high - low + 1)
    )


# ---------------------------------------------------------------------------
# Career scoring
# ---------------------------------------------------------------------------

def _score_career(
    career: dict,
    branch: str,
    skills: set[str],
    interests: set[str],
) -> float:

    score = 0.0

    # ---------------------------------------------------------
    # Branch fit — 30 points
    # ---------------------------------------------------------

    career_branches = {
        str(branch).strip().lower()
        for branch in career.get("branches", [])
    }

    if branch.lower() in career_branches:
        score += 30

    elif not career_branches:
        # Branch-agnostic career
        score += 10

    # ---------------------------------------------------------
    # Core skills — 40 points
    # ---------------------------------------------------------

    core_skills = {
        str(skill).strip().lower()
        for skill in career.get("core_skills", [])
    }

    if core_skills:
        matched_core = core_skills & skills

        score += (
            40
            * len(matched_core)
            / len(core_skills)
        )

    # ---------------------------------------------------------
    # Nice-to-have skills — 10 points
    # ---------------------------------------------------------

    nice_skills = {
        str(skill).strip().lower()
        for skill in career.get("nice_skills", [])
    }

    if nice_skills:
        matched_nice = nice_skills & skills

        score += (
            10
            * len(matched_nice)
            / len(nice_skills)
        )

    # ---------------------------------------------------------
    # Interests — 20 points
    # ---------------------------------------------------------

    career_interests = {
        str(interest).strip().lower()
        for interest in career.get("interests", [])
    }

    if career_interests:

        matched_interests = (
            career_interests & interests
        )

        score += (
            20
            * len(matched_interests)
            / len(career_interests)
        )

    else:
        # Small baseline for generalist careers
        score += 5

    return score


# ---------------------------------------------------------------------------
# Explanation generation
# ---------------------------------------------------------------------------

def _build_reason(
    career: dict,
    branch: str,
    skills: set[str],
    interests: set[str],
) -> str:

    career_core_skills = {
        str(skill).strip().lower(): str(skill).strip()
        for skill in career.get("core_skills", [])
    }

    career_interests = {
        str(interest).strip().lower(): str(interest).strip()
        for interest in career.get("interests", [])
    }

    matched_skills = [
        original
        for normalized, original
        in career_core_skills.items()
        if normalized in skills
    ]

    matched_interests = [
        original
        for normalized, original
        in career_interests.items()
        if normalized in interests
    ]

    career_branches = {
        str(item).strip().lower()
        for item in career.get("branches", [])
    }

    bits = []

    if branch.lower() in career_branches:
        bits.append(
            f"your {branch} background"
        )

    if matched_skills:
        bits.append(
            f"skills like {', '.join(matched_skills)}"
        )

    if matched_interests:
        bits.append(
            f"your interest in {', '.join(matched_interests)}"
        )

    if bits:
        return (
            "A strong fit given "
            + ", ".join(bits)
            + "."
        )

    return (
        f"A reasonable general fit for a "
        f"{branch} student open to building new skills."
    )


# ---------------------------------------------------------------------------
# Main recommendation function
# ---------------------------------------------------------------------------

def get_local_recommendation(
    db: Session,
    branch: str,
    skills: list[str],
    interests: list[str],
) -> dict:
    """
    Generate career recommendations using only PostgreSQL career data.

    No external LLM is used here.
    Scoring:

        Branch          → 30 points
        Core skills     → 40 points
        Nice skills     → 10 points
        Interests       → 20 points

        Total            = 100 points
    """

    # ---------------------------------------------------------
    # Normalize student input
    # ---------------------------------------------------------

    skill_set = {
        str(skill).strip().lower()
        for skill in skills
        if skill and str(skill).strip()
    }

    interest_set = {
        str(interest).strip().lower()
        for interest in interests
        if interest and str(interest).strip()
    }

    branch = (
        str(branch).strip()
        if branch
        else ""
    )

    # ---------------------------------------------------------
    # Read careers from PostgreSQL
    # ---------------------------------------------------------

    rows = (
        db.query(Career)
        .order_by(Career.title)
        .all()
    )

    if not rows:
        raise RuntimeError(
            "No careers found in the PostgreSQL careers table. "
            "Run `python -m app.seed_careers` first."
        )

    careers = [
        career.as_dict()
        for career in rows
    ]

    # ---------------------------------------------------------
    # Score every career
    # ---------------------------------------------------------

    scored = []

    for career in careers:

        raw_score = _score_career(
            career,
            branch,
            skill_set,
            interest_set,
        )

        scored.append(
            (raw_score, career)
        )

    # ---------------------------------------------------------
    # Sort by highest score
    # ---------------------------------------------------------

    scored.sort(
        key=lambda pair: (
            -pair[0],
            pair[1]["title"],
        )
    )

    # Top 5 recommendations
    top5 = scored[:5]

    if not top5:
        raise RuntimeError(
            "Unable to generate career recommendations."
        )

    # ---------------------------------------------------------
    # Convert scores to display percentages
    # ---------------------------------------------------------

    job_roles = []

    previous_pct = 101

    for raw_score, career in top5:

        base_pct = max(
            20,
            min(
                96,
                round(raw_score),
            ),
        )

        gap = _stable_jitter(
            career["title"],
            4,
            9,
        )

        pct = min(
            base_pct,
            previous_pct - gap,
        )

        pct = max(
            15,
            pct,
        )

        previous_pct = pct

        job_roles.append(
            {
                "job_role": career["title"],
                "matchPercentage": pct,
                "reason": _build_reason(
                    career,
                    branch,
                    skill_set,
                    interest_set,
                ),
            }
        )

    # ---------------------------------------------------------
    # Best career
    # ---------------------------------------------------------

    top_career = top5[0][1]

    recommended_career = (
        top_career["title"]
    )

    match_reason = (
        f"{recommended_career} is your strongest match — "
        f"{_build_reason(top_career, branch, skill_set, interest_set)}"
    )

    # ---------------------------------------------------------
    # Skills to learn
    # ---------------------------------------------------------

    skills_to_learn = []

    for skill in top_career.get(
        "skills_to_learn",
        [],
    ):

        if skill.lower() not in skill_set:
            skills_to_learn.append(skill)

    if not skills_to_learn:
        skills_to_learn = top_career.get(
            "skills_to_learn",
            [],
        )

    # ---------------------------------------------------------
    # Final recommendation response
    # ---------------------------------------------------------

    return {
        "recommendedCareer": recommended_career,

        "matchReason": match_reason,

        "jobRoles": job_roles,

        "skillsToLearn": skills_to_learn,

        "courses": top_career.get(
            "courses",
            [],
        ),
    }