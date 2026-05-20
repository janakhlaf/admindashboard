from fastapi import APIRouter, Header, HTTPException, UploadFile, File, Form
from supabase import create_client
import os
import uuid
import json

router = APIRouter(prefix="/admin/assets", tags=["Admin Assets"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "assets_previwe")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


@router.post("/upload")
def upload_asset(
    authorization: str = Header(None),
    name: str = Form(...),
    category: str = Form(""),
    description: str = Form(""),
    price: float = Form(0),
    tags: str = Form("[]"),
    file: UploadFile = File(...)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")

    token = authorization.replace("Bearer ", "")

    auth_user_response = supabase.auth.get_user(token)
    auth_user = auth_user_response.user

    if not auth_user:
        raise HTTPException(status_code=401, detail="Invalid token")

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
        raise HTTPException(status_code=404, detail="User not found")

    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can upload")

    file_ext = file.filename.split(".")[-1]
    file_name = f"admin/{uuid.uuid4()}.{file_ext}"

    file_bytes = file.file.read()

    supabase.storage.from_(SUPABASE_BUCKET).upload(
        file_name,
        file_bytes,
        {
            "content-type": file.content_type
        }
    )

    preview_url = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(file_name)

    print("AUTH USER ID:", auth_user.id)
    print("CURRENT USER:", current_user)

    asset_data = {
        "user_id": current_user["id"],
        "name": name,
        "description": description,
        "category": category,
        "price": price,
        "tags": json.loads(tags),
        "preview_url": preview_url,
        "bucket_path": file_name,
        "file_type": file_ext,
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