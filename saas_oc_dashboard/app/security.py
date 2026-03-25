from dataclasses import dataclass
from fastapi import Header, HTTPException


@dataclass
class UserContext:
    user: str
    role: str


TOKEN_STORE = {
    "admin-token": UserContext(user="admin@oc.local", role="admin"),
    "manager-token": UserContext(user="gerente@oc.local", role="manager"),
    "viewer-token": UserContext(user="analista@oc.local", role="viewer"),
}


def get_user(authorization: str = Header(default="")) -> UserContext:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    user = TOKEN_STORE.get(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


def require_write_role(role: str) -> None:
    if role not in {"admin", "manager"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
