import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.chat import ChatMessage
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.chat import ChatIn, ChatMessageOut
from app.services.groq_service import get_followup_reply
from app.services.local_qa_service import try_answer_locally


router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
)


@router.post("", response_model=ChatMessageOut)
async def send_message(
    payload: ChatIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = (
        db.query(Recommendation)
        .filter(
            Recommendation.id == payload.recommendation_id,
            Recommendation.user_id == current_user.id,
        )
        .first()
    )

    if not rec:
        raise HTTPException(
            status_code=404,
            detail="Recommendation not found",
        )

    user_msg = ChatMessage(
        user_id=current_user.id,
        recommendation_id=rec.id,
        role="user",
        content=payload.message,
    )

    db.add(user_msg)
    db.commit()

    history = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.recommendation_id == rec.id
        )
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    # First try the local FAQ / intent engine.
    # If it cannot answer confidently, use Groq.
    local_reply = try_answer_locally(
        rec,
        payload.message,
    )

    if local_reply is not None:
        reply_text = local_reply

    else:
        try:
            reply_text = await get_followup_reply(
                rec,
                history,
                payload.message,
            )

        except Exception as exc:
            import traceback
            traceback.print_exc()

            raise HTTPException(
                status_code=502,
                detail=f"Groq error: {type(exc).__name__}: {exc}"
                ) from exc

    bot_msg = ChatMessage(
        user_id=current_user.id,
        recommendation_id=rec.id,
        role="bot",
        content=reply_text,
    )

    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)

    return bot_msg


@router.get(
    "/{recommendation_id}",
    response_model=list[ChatMessageOut],
)
def get_history(
    recommendation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ChatMessage)
        .filter(
            ChatMessage.recommendation_id == recommendation_id,
            ChatMessage.user_id == current_user.id,
        )
        .order_by(ChatMessage.created_at.asc())
        .all()
    )