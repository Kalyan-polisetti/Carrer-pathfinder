from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    auth,
    chat,
    profile,
    recommend,
    skill_gap,
    roadmap,
)

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine

# Import models so SQLAlchemy registers them
from app.models import chat as _chat_model  # noqa: F401
from app.models import profile as _profile_model  # noqa: F401
from app.models import recommendation as _recommendation_model  # noqa: F401
from app.models import user as _user_model  # noqa: F401

settings = get_settings()

app = FastAPI(
    title="Career Pathfinder API"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(recommend.router)
app.include_router(chat.router)

# NEW
app.include_router(skill_gap.router)
app.include_router(roadmap.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}