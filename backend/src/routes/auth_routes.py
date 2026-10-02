from fastapi import APIRouter

from src.controllers.auth_controller import login

router = APIRouter(prefix="/api/auth", tags=["Auth"])
router.post("/login", response_model=None)(login)
