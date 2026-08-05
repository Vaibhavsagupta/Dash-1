from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any
import requests
import json

from .. import models, database, auth

router = APIRouter(
    prefix="/admin/college-api",
    tags=["College API Sandbox"]
)

class SandboxApiRequest(BaseModel):
    api_url: str
    method: str = "GET"
    headers: Optional[Dict[str, str]] = None
    bearer_token: Optional[str] = None
    request_body: Optional[str] = None

@router.post("/test-fetch")
def test_college_api_fetch(
    req: SandboxApiRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user_obj)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required for Sandboxed College API testing")

    headers = req.headers or {}
    if req.bearer_token:
        headers["Authorization"] = f"Bearer {req.bearer_token}"
    headers["Content-Type"] = "application/json"

    try:
        if req.method.upper() == "POST":
            body = json.loads(req.request_body) if req.request_body else {}
            response = requests.post(req.api_url, headers=headers, json=body, timeout=10)
        else:
            response = requests.get(req.api_url, headers=headers, timeout=10)

        try:
            parsed_data = response.json()
        except Exception:
            parsed_data = response.text

        return {
            "status_code": response.status_code,
            "success": response.ok,
            "url": req.api_url,
            "method": req.method.upper(),
            "response_headers": dict(response.headers),
            "payload": parsed_data
        }
    except requests.exceptions.RequestException as e:
        return {
            "status_code": 500,
            "success": False,
            "error": str(e),
            "url": req.api_url,
            "payload": None
        }
