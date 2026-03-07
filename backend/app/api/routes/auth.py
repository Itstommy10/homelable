import yaml
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import create_access_token, verify_password

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def _load_credentials() -> tuple[str, str]:
    with open(settings.config_path) as f:
        cfg = yaml.safe_load(f)
    auth = cfg.get("auth", {})
    return auth.get("username", "admin"), auth.get("password_hash", "")


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest) -> TokenResponse:
    username, password_hash = _load_credentials()
    if body.username != username or not verify_password(body.password, password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(body.username)
    return TokenResponse(access_token=token)
