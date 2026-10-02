from fastapi import Body, Depends

from src.middlewares.rbac_middleware import current_user
from src.services.review_service import review_service
from src.services.sync_service import sync_service


def submit_sync_batch(payload: dict = Body(...), actor: dict = Depends(current_user)):
    return sync_service.submit_batch(payload, actor)


def retry_sync_batch(batch_id: str, payload: dict = Body(default={}),
                     actor: dict = Depends(current_user)):
    return sync_service.retry_batch(batch_id, actor, payload)


def list_sync_batches():
    return sync_service.list_batches()


def get_sync_batch(batch_id: str):
    return sync_service.get_batch(batch_id)


def list_review_items(building_id: int | None = None, status: str | None = None):
    return review_service.list_items(building_id, status)


def resolve_review_item(review_id: int, payload: dict = Body(...),
                        actor: dict = Depends(current_user)):
    return review_service.resolve(review_id, payload.get("decision", ""), actor)
