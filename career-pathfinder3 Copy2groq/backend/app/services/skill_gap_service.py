from __future__ import annotations

from app.services.json_data_service import (
    load_careers,
    load_courses,
    load_certifications,
)


def _normalize(value: str) -> str:
    return " ".join(value.lower().strip().split())


def _find_career(career_name: str):
    careers = load_careers()

    target = _normalize(career_name)

    # 1. Exact match
    for career in careers:
        title = career.get(
            "title",
            career.get("career", "")
        )

        if _normalize(title) == target:
            return career

    # 2. Partial match
    for career in careers:
        title = career.get(
            "title",
            career.get("career", "")
        )

        normalized_title = _normalize(title)

        if (
            target in normalized_title
            or normalized_title in target
        ):
            return career

    # 3. Common career aliases
    aliases = {
        "full stack developer": "full stack web developer",
        "fullstack developer": "full stack web developer",
    }

    alias_target = aliases.get(target)

    if alias_target:
        for career in careers:
            title = career.get(
                "title",
                career.get("career", "")
            )

            if _normalize(title) == alias_target:
                return career

    return None


def _get_required_skills(career: dict) -> list[str]:
    """
    Extract required skills from the career JSON.

    Supports:
    - required_skills
    - core_skills
    - nice_skills
    """

    required = []

    if career.get("required_skills"):
        required.extend(career["required_skills"])

    if career.get("core_skills"):
        required.extend(career["core_skills"])

    if career.get("nice_skills"):
        required.extend(career["nice_skills"])

    if career.get("nice_to_have_skills"):
        required.extend(career["nice_to_have_skills"])

    # Remove duplicates while preserving order
    result = []
    seen = set()

    for skill in required:
        normalized = _normalize(skill)

        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(skill)

    return result


def _skill_matches(
    target_skill: str,
    resource_skill: str,
) -> bool:
    """
    Flexible skill matching.

    Example:
        'SQL' == 'SQL'
        'Machine Learning' == 'machine learning'
        'Data Visualization' can match 'data visualization'
    """

    target = _normalize(target_skill)
    resource = _normalize(resource_skill)

    if target == resource:
        return True

    # Small alias handling
    aliases = {
        "ml": "machine learning",
        "ai": "artificial intelligence",
        "statistics": "statistics",
        "data viz": "data visualization",
        "powerbi": "power bi",
    }

    target = aliases.get(target, target)
    resource = aliases.get(resource, resource)

    return target == resource


def _find_course_for_skill(
    skill: str,
    courses: list,
) -> list[dict]:
    """
    Find courses for a missing skill.

    Actual courses.json structure:

    {
        "skill": "SQL",
        "title": "...",
        "provider": "...",
        "level": "...",
        "url": "..."
    }
    """

    matches = []

    for course in courses:

        # Actual JSON uses "skill", not "skills"
        course_skill = course.get("skill", "")

        if course_skill and _skill_matches(
            skill,
            course_skill,
        ):
            matches.append(course)

    return matches


def _find_certification_for_skill(
    skill: str,
    certifications: list,
) -> list[dict]:
    """
    Find certifications for a missing skill.

    Actual certifications.json structure:

    {
        "skill": "Power BI",
        "title": "...",
        "provider": "...",
        "level": "...",
        "url": "..."
    }
    """

    matches = []

    for certification in certifications:

        # Actual JSON uses "skill", not "skills"
        certification_skill = certification.get(
            "skill",
            "",
        )

        if certification_skill and _skill_matches(
            skill,
            certification_skill,
        ):
            matches.append(certification)

    return matches


def analyze_skill_gap(
    career_name: str,
    user_skills: list[str],
) -> dict:
    """
    Analyze the student's skills against a target career.

    Returns:

    - career
    - skill match percentage
    - required skills
    - skills already possessed
    - missing skills
    - recommended courses
    - recommended certifications
    """

    career = _find_career(career_name)

    if not career:
        raise ValueError(
            f"Career '{career_name}' was not found."
        )

    # ---------------------------------------------------------
    # 1. Required skills
    # ---------------------------------------------------------

    required_skills = _get_required_skills(career)

    # ---------------------------------------------------------
    # 2. Normalize user's skills
    # ---------------------------------------------------------

    normalized_user_skills = {
        _normalize(skill)
        for skill in user_skills
        if skill and skill.strip()
    }

    # ---------------------------------------------------------
    # 3. Find possessed and missing skills
    # ---------------------------------------------------------

    possessed = []
    missing = []

    for skill in required_skills:

        if _normalize(skill) in normalized_user_skills:
            possessed.append(skill)
        else:
            missing.append(skill)

    # ---------------------------------------------------------
    # 4. Calculate percentage
    # ---------------------------------------------------------

    total = len(required_skills)
    matched = len(possessed)

    percentage = (
        round((matched / total) * 100)
        if total
        else 0
    )

    # ---------------------------------------------------------
    # 5. Load learning resources
    # ---------------------------------------------------------

    courses = load_courses()
    certifications = load_certifications()

    recommended_courses = []
    recommended_certifications = []

    # ---------------------------------------------------------
    # 6. Find resources for EVERY missing skill
    # ---------------------------------------------------------

    for skill in missing:

        # Courses
        skill_courses = _find_course_for_skill(
            skill,
            courses,
        )

        for course in skill_courses:

            if course not in recommended_courses:
                recommended_courses.append(course)

        # Certifications
        skill_certifications = (
            _find_certification_for_skill(
                skill,
                certifications,
            )
        )

        for certification in skill_certifications:

            if certification not in recommended_certifications:
                recommended_certifications.append(
                    certification
                )

    # ---------------------------------------------------------
    # 7. Return result
    # ---------------------------------------------------------

    return {
        "career": career.get(
            "title",
            career.get(
                "career",
                career_name,
            ),
        ),

        "skill_match_percentage": percentage,

        "required_skills": required_skills,

        "skills_you_have": possessed,

        "missing_skills": missing,

        "recommended_courses": recommended_courses,

        "recommended_certifications": (
            recommended_certifications
        ),
    }