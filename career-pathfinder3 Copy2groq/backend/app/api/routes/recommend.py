import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.profile import ProfileIn
from app.schemas.recommendation import RecommendationOut
from app.services.local_recommender import get_local_recommendation

router = APIRouter(
    prefix="/api/recommend",
    tags=["recommend"],
)


@router.post("", response_model=RecommendationOut)
async def create_recommendation(
    payload: ProfileIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate and store a career recommendation.

    The profile now contains:
    - branch
    - selected skills
    - skill proficiency levels
    - interests

    The local recommendation engine uses the profile to calculate
    career suitability.
    """

    try:
        # ---------------------------------------------------------
        # Build skill input for the recommendation engine
        # ---------------------------------------------------------
        #
        # Newer frontend:
        #   skills = [
        #       {
        #           "name": "Python",
        #           "proficiency": "Advanced"
        #       },
        #       ...
        #   ]
        #
        # Older frontend:
        #   skills = ["Python", "SQL", "Machine Learning"]
        #
        # We support both formats so existing data does not break.
        # ---------------------------------------------------------

        normalized_skills = []

        for skill in payload.skills or []:

            if isinstance(skill, str):
                normalized_skills.append({
                    "name": skill,
                    "proficiency": "Intermediate",
                })

            elif isinstance(skill, dict):
                skill_name = (
                    skill.get("name")
                    or skill.get("skill")
                )

                if not skill_name:
                    continue

                normalized_skills.append({
                    "name": skill_name,
                    "proficiency": (
                        skill.get("proficiency")
                        or skill.get("level")
                        or "Intermediate"
                    ),
                })

        # ---------------------------------------------------------
        # Convert skills into a form the existing local recommender
        # can understand.
        #
        # We keep the proficiency information separately so the
        # recommendation engine can use it when updated.
        # ---------------------------------------------------------

        skill_names = [
            skill["name"]
            for skill in normalized_skills
        ]

        proficiency_map = {
            skill["name"]: skill["proficiency"]
            for skill in normalized_skills
        }

        # ---------------------------------------------------------
        # Existing recommendation engine
        # ---------------------------------------------------------

        result = get_local_recommendation(
            db,
            payload.branch,
            skill_names,
            payload.interests,
        )

        # ---------------------------------------------------------
        # Store recommendation
        #
        # Keep the original skills field compatible with the
        # existing database/model.
        # ---------------------------------------------------------

        rec = Recommendation(
            user_id=current_user.id,
            branch=payload.branch,
            skills=skill_names,
            interests=payload.interests,
            recommended_career=result["recommendedCareer"],
            match_reason=result["matchReason"],
            job_roles=result["jobRoles"],
            skills_to_learn=result["skillsToLearn"],
            courses=result["courses"],
        )

        db.add(rec)
        db.commit()
        db.refresh(rec)

        return rec

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=502,
            detail=f"Recommendation engine failed: {exc}",
        ) from exc


@router.get(
    "/history",
    response_model=list[RecommendationOut],
)
def history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return the user's previous career recommendations.
    """

    return (
        db.query(Recommendation)
        .filter(
            Recommendation.user_id == current_user.id
        )
        .order_by(
            Recommendation.created_at.desc()
        )
        .all()
    )


@router.get(
    "/{recommendation_id}",
    response_model=RecommendationOut,
)
def get_one(
    recommendation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return one recommendation belonging to the current user.
    """

    rec = (
        db.query(Recommendation)
        .filter(
            Recommendation.id == recommendation_id,
            Recommendation.user_id == current_user.id,
        )
        .first()
    )

    if not rec:
        raise HTTPException(
            status_code=404,
            detail="Recommendation not found",
        )

    return rec