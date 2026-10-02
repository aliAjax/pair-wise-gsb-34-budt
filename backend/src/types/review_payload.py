from pydantic import BaseModel

from src.constants.review_kind import ReviewResolution


class ReviewResolvePayload(BaseModel):
    resolution: str  # CONFIRMED 维持现场 / OVERRIDDEN 采用人工裁决值
    note: str = ""

    def validated_resolution(self) -> str:
        if self.resolution not in ReviewResolution.ALL:
            from src.constants.exceptions import ValidationError

            raise ValidationError("resolution 必须为 CONFIRMED 或 OVERRIDDEN")
        return self.resolution
