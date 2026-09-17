import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.db.base import Base


class Career(Base):
    """
    Career information stored in PostgreSQL.

    The career data originates from app/data/careers.json.
    Recommendation logic is handled separately by local_recommender.py.
    """

    __tablename__ = "careers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title = Column(String, unique=True, nullable=False, index=True)

    description = Column(String, nullable=True)

    branches = Column(JSONB, default=list, nullable=False)
    core_skills = Column(JSONB, default=list, nullable=False)
    nice_skills = Column(JSONB, default=list, nullable=False)
    interests = Column(JSONB, default=list, nullable=False)

    skills_to_learn = Column(JSONB, default=list, nullable=False)
    courses = Column(JSONB, default=list, nullable=False)

    projects = Column(JSONB, default=list, nullable=False)
    certifications = Column(JSONB, default=list, nullable=False)

    salary_range = Column(JSONB, default=dict, nullable=False)
    growth = Column(String, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def as_dict(self) -> dict:
        """
        Convert the database row into the structure expected
        by the recommendation engine.
        """

        return {
            "title": self.title,
            "description": self.description or "",

            "branches": self.branches or [],
            "core_skills": self.core_skills or [],
            "nice_skills": self.nice_skills or [],
            "interests": self.interests or [],

            "skills_to_learn": self.skills_to_learn or [],
            "courses": self.courses or [],

            "projects": self.projects or [],
            "certifications": self.certifications or [],

            "salary_range": self.salary_range or {},
            "growth": self.growth or "",
        }