from fastapi import APIRouter, Depends

from src.constants.user_role import UserRole
from src.controllers.review_item_controller import list_review_items, resolve_review_item
from src.middlewares.rbac_middleware import require_roles
from src.types.review_payload import ReviewResolvePayload

router = APIRouter(prefix="/api/review-item", tags=["ReviewItem"])

_supervisor = require_roles(UserRole.SUPERVISOR)

# 复核列表：审计员可查看（只读），设备台账与合规总览共用同一份结果
router.get("")(list_review_items)


@router.post("/{review_id}/resolve")
def _resolve(review_id: int, payload: ReviewResolvePayload, actor=Depends(_supervisor)):
    return resolve_review_item(review_id, payload, actor)
