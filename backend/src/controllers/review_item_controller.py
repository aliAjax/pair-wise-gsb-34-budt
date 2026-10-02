from src.services.review_item_service import review_item_service


def list_review_items(pending_only: bool = False, building_id: int | None = None):
    return review_item_service.list(pending_only=pending_only, building_id=building_id)


def resolve_review_item(review_id: int, payload, actor: dict):
    resolution = payload.validated_resolution()
    return review_item_service.resolve(review_id, resolution, actor, payload.note)
