from app.services.json_data_service import load_courses


def get_courses_for_skills(missing_skills: list[str]) -> list[dict]:
    courses = load_courses()

    if not missing_skills:
        return []

    normalized_missing = {
        skill.strip().lower()
        for skill in missing_skills
        if skill
    }

    results = []

    for course in courses:
        skill = str(course.get("skill", "")).strip().lower()

        if skill in normalized_missing:
            results.append(course)

    return results