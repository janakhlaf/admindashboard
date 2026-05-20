from fastapi import APIRouter, Header, HTTPException
from supabase import create_client
import os

router = APIRouter(
    prefix="/admin/assets",
    tags=["Admin Assets"]
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
)


@router.post("/upload")
def upload_asset(
    authorization: str = Header(None)
):

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing token"
        )

    token = authorization.replace(
        "Bearer ",
        ""
    )

    auth_user_response = supabase.auth.get_user(token)

    auth_user = auth_user_response.user

    if not auth_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user_response = (
        supabase
        .table("users")
        .select("id, role")
        .eq("auth_user_id", auth_user.id)
        .single()
        .execute()
    )

    current_user = user_response.data

    if not current_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can upload"
        )

    asset_data = {
        "user_id": current_user["id"],
        "name": "test_asset",
        "description": "test",
        "category": "Props",
    }

    insert_response = (
        supabase
        .table("assets")
        .insert(asset_data)
        .execute()
    )

    return {
        "message": "asset uploaded successfully",
        "data": insert_response.data
    }