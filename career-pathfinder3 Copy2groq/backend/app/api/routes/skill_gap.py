from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.skill_gap_service import analyze_skill_gap


router = APIRouter(
    prefix="/api/skill-gap",
    tags=["skill-gap"],
)


@router.post("")
def skill_gap(
    career: str,
    skills: list[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return analyze_skill_gap(
            career_name=career,
            user_skills=skills,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Skill gap analysis failed: {exc}",
        ) from exc