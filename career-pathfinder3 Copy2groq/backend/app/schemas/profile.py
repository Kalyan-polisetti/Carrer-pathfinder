from pydantic import BaseModel


class ProfileIn(BaseModel):
    branch: str
    skills: list[str] = []
    interests: list[str] = []


class ProfileOut(ProfileIn):
    class Config:
        from_attributes = True
