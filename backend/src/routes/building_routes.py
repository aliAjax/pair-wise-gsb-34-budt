from fastapi import APIRouter, Depends

from src.controllers.building_controller import list_building, building_overview
from src.middlewares.rbac_middleware import current_user

router = APIRouter(prefix="/api/building", tags=["Building"])

router.get("")(list_building)
router.get("/overview", dependencies=[Depends(current_user)])(building_overview)
