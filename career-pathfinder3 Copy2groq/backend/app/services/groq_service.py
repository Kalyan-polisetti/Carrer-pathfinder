import json
import re

from groq import AsyncGroq

from app.core.config import get_settings


settings = get_settings()


def _get_client() -> AsyncGroq:
    if not settings.groq_api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it to backend/.env."
        )

    return AsyncGroq(api_key=settings.groq_api_key)


def _extract_json(text: str) -> dict:
    """
    Extract JSON even if the LLM wraps it in markdown code fences.
    """

    cleaned = text.strip()

    cleaned = re.sub(
        r"^```(?:json)?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    cleaned = re.sub(
        r"\s*```$",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    return json.loads(cleaned.strip())


async def get_career_recommendation(
    branch: str,
    skills: list[str],
    interests: list[str],
) -> dict:

    client = _get_client()

    prompt = f"""
You are an expert career guidance assistant for engineering
and college students in India.

Analyze the student's academic branch, skills and interests.

STUDENT PROFILE

Branch:
{branch}

Skills:
{', '.join(skills) if skills else 'None listed'}

Interests:
{', '.join(interests) if interests else 'None listed'}

TASK:

1. Recommend exactly 5 realistic career roles.
2. Calculate a suitability percentage from 0 to 100 for EACH role.
3. The percentage should reflect how well the student's:
   - academic branch
   - existing skills
   - interests
   align with the typical requirements of that career.
4. Rank all five roles from highest suitability to lowest suitability.
5. The first role MUST have the highest percentage.
6. "recommendedCareer" MUST be exactly the highest-ranked role.
7. Give a short explanation for each role.
8. Identify important skills the student should learn.
9. Recommend useful courses or certifications.
10. Personalize the result to the student's actual profile.

IMPORTANT:

- Do not give all roles similar percentages.
- Do not randomly assign percentages.
- Use realistic differences between roles.
- Percentages must be integers between 0 and 100.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not include ```json.

Return EXACTLY this structure:

{{
  "recommendedCareer": "Data Analyst",

  "matchReason": "Data Analyst is the strongest career match because the student's skills and interests align strongly with data analysis and problem solving.",

  "jobRoles": [
    {{
      "job_role": "Data Analyst",
      "matchPercentage": 91,
      "reason": "Strong alignment with the student's skills and interests."
    }},
    {{
      "job_role": "Data Scientist",
      "matchPercentage": 84,
      "reason": "Good alignment, but additional statistics and machine learning skills are required."
    }},
    {{
      "job_role": "Machine Learning Engineer",
      "matchPercentage": 78,
      "reason": "Good technical foundation, but stronger machine learning engineering skills are needed."
    }},
    {{
      "job_role": "Business Analyst",
      "matchPercentage": 71,
      "reason": "Good analytical potential, but business analysis skills need development."
    }},
    {{
      "job_role": "BI Developer",
      "matchPercentage": 65,
      "reason": "Reasonable alignment, with additional BI and visualization skills required."
    }}
  ],

  "skillsToLearn": [
    "Power BI",
    "Advanced SQL",
    "Statistics"
  ],

  "courses": [
    "SQL for Data Analytics",
    "Power BI Certification",
    "Statistics for Data Science"
  ]
}}
"""

    response = await client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional career guidance assistant. "
                    "Follow the requested JSON format exactly."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.2,
        max_completion_tokens=2048,
    )

    content = response.choices[0].message.content

    if not content:
        raise RuntimeError("Groq returned an empty response.")

    return _extract_json(content)


async def get_followup_reply(
    recommendation,
    history,
    message: str,
) -> str:

    client = _get_client()

    # Don't duplicate the newest user message
    # in the conversation history.
    prior_messages = history[:-1] if history else []

    transcript = "\n".join(
        f"{m.role}: {m.content}"
        for m in prior_messages
    )

    roles = recommendation.job_roles or []

    role_text = []

    for role in roles:

        if isinstance(role, dict):

            role_name = (
                role.get("job_role")
                or role.get("role")
                or ""
            )

            percentage = (
                role.get("match_percentage")
                or role.get("matchPercentage")
            )

            if role_name:

                if percentage is not None:
                    role_text.append(
                        f"{role_name} ({percentage}% suitability)"
                    )
                else:
                    role_text.append(role_name)

        else:
            role_text.append(str(role))

    prompt = f"""
You are a friendly and knowledgeable career guidance chatbot.

Student profile:

Branch:
{recommendation.branch}

Skills:
{', '.join(recommendation.skills or [])}

Interests:
{', '.join(recommendation.interests or [])}

Career recommendation:
{recommendation.recommended_career}

Career role matches:
{', '.join(role_text)}

Earlier recommendation explanation:
{recommendation.match_reason}

Skills to learn:
{', '.join(recommendation.skills_to_learn or [])}

Conversation so far:
{transcript}

The student now says:
"{message}"

Answer the student's question naturally.

Rules:

- Be helpful and personalized.
- Use the student's profile when answering.
- If they ask about career roles, refer to the suitability percentages when relevant.
- If they ask about the highest suitable role, explain why it is the strongest match.
- If they ask about another role, explain what skills they need to improve.
- Do not claim that a percentage guarantees employment.
- Keep the response concise, around 2-5 sentences.
- Plain text only.
"""

    response = await client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional and friendly career "
                    "guidance assistant."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.5,
        max_completion_tokens=512,
    )

    content = response.choices[0].message.content

    if not content:
        raise RuntimeError("Groq returned an empty response.")

    return content.strip()