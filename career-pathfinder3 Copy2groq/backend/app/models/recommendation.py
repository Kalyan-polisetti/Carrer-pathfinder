import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # snapshot of the profile used to generate this recommendation
    branch = Column(String, nullable=False)
    skills = Column(JSONB, default=list)
    interests = Column(JSONB, default=list)

    recommended_career = Column(String, nullable=False)
    match_reason = Column(Text, nullable=False)
    job_roles = Column(JSONB, default=list)
    skills_to_learn = Column(JSONB, default=list)
    courses = Column(JSONB, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recommendations")
    chat_messages = relationship("ChatMessage", back_populates="recommendation", cascade="all, delete-orphan")
