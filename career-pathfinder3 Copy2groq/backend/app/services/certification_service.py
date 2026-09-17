from app.services.json_data_service import load_certifications


def get_certifications_for_skills(
    missing_skills: list[str],
) -> list[dict]:
    certifications = load_certifications()

    if not missing_skills:
        return []

    normalized_missing = {
        skill.strip().lower()
        for skill in missing_skills
        if skill
    }

    results = []

    for certification in certifications:
        skill = str(
            certification.get("skill", "")
        ).strip().lower()

        if skill in normalized_missing:
            results.append(certification)

    return results