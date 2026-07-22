"""
Authentication Router — Login, MFA Verification, Session Token & Identity Probes.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import time

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "Logistics Operator"

class VerifyMFARequest(BaseModel):
    email: str
    code: str
    session_ticket: str
    role: Optional[str] = "Logistics Operator"

# Mock identity database
ROLES_PERMISSIONS = {
    "Logistics Operator": ["read:routes", "write:procurement", "execute:simulation"],
    "SPR Administrator": ["read:spr", "write:spr_drawdown", "execute:override"],
    "Executive Director": ["read:all", "write:approvals", "execute:crisis_activation"],
}

@router.post("/login")
def login(req: LoginRequest):
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Invalid email format.")
    
    if len(req.password) < 4:
        raise HTTPException(status_code=401, detail="Invalid credentials. Password too short.")

    # Generate temporary session ticket requiring MFA
    ticket = f"mfa_ticket_{int(time.time())}_{hash(req.email) % 100000}"
    
    return {
        "success": True,
        "mfa_required": True,
        "session_ticket": ticket,
        "email": req.email,
        "role": req.role,
        "message": "Step 1 Authentication successful. Enter 6-digit TOTP code."
    }

@router.post("/verify-mfa")
def verify_mfa(req: VerifyMFARequest):
    if len(req.code) != 6 or not req.code.isdigit():
        raise HTTPException(status_code=400, detail="Invalid TOTP code. Must be a 6-digit number.")

    # Generate mock JWT bearer token
    token = f"urja_jwt_{int(time.time())}_{hash(req.email) % 999999}"
    
    # Deriving user name from email
    name_parts = req.email.split("@")[0].replace(".", " ").title()
    name = name_parts if name_parts else "Operator Arjun Mehta"

    return {
        "success": True,
        "token": token,
        "user": {
            "name": name,
            "email": req.email,
            "role": req.role,
            "permissions": ROLES_PERMISSIONS.get(req.role, ROLES_PERMISSIONS["Logistics Operator"]),
            "last_login": time.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "clearance_level": "LEVEL-5 EYES ONLY",
        }
    }

@router.get("/me")
def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session. Missing or invalid authorization token.")

    token = authorization.split(" ")[1]
    return {
        "success": True,
        "token": token,
        "user": {
            "name": "Arjun Mehta",
            "email": "arjun.mehta@nemc.gov.in",
            "role": "Commander, NEMC",
            "clearance_level": "LEVEL-5 EYES ONLY",
        }
    }
