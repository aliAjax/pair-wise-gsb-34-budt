from fastapi import APIRouter
from src.controllers.building_controller import building_overview, list_building
router = APIRouter(prefix="/api/building", tags=["Building"])
router.get("")(list_building)
router.get("/overview")(building_overview)
