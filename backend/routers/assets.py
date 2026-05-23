from fastapi import APIRouter, Header, HTTPException, UploadFile, File, Form
from supabase import create_client
from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Asset, User
from embedding_service import generate_asset_embedding
import os
import uuid
import json


router = APIRouter(prefix="/admin/assets", tags=["Admin Assets"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
PREVIEW_BUCKET = os.getenv("ASSETS_PREVIEW_BUCKET", "assets_previwe")
PRIVATE_BUCKET = os.getenv("ASSETS_PRIVATE_BUCKET", "assets_private")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


@router.post("/upload")
def upload_asset(
    authorization: str = Header(None),
    name: str = Form(...),
    category: str = Form(""),
    description: str = Form(""),
    price: float = Form(0),
    tags: str = Form("[]"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")

    token = authorization.replace("Bearer ", "")

    auth_user_response = supabase.auth.get_user(token)
    auth_user = auth_user_response.user

    if not auth_user:
        raise HTTPException(status_code=401, detail="Invalid token")

    current_user = (
        db.query(User)
     .filter(User.auth_user_id == uuid.UUID(str(auth_user.id)))
        .first()
    )

    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can upload")

    file_ext = file.filename.split(".")[-1]
    file_name = f"admin/{uuid.uuid4()}.{file_ext}"

    file_bytes = file.file.read()

    supabase.storage.from_(PREVIEW_BUCKET).upload(
        file_name,
        file_bytes,
        {
            "content-type": file.content_type
        }
    )
    supabase.storage.from_(PRIVATE_BUCKET).upload(
    file_name,
    file_bytes,
    {
        "content-type": file.content_type
    }
)

    preview_url = supabase.storage.from_(PREVIEW_BUCKET).get_public_url(file_name)


    asset_data = {
        "user_id": current_user.id,
        "name": name,
        "description": description,
        "category": category,
        "price": price,
        "tags": json.loads(tags),
        "preview_url": preview_url,
        "bucket_path": file_name,
        "file_type": file_ext,
        "file_size": len(file_bytes),
        "price": price,
        "source_type": "admin",
        "status": "approved",
        "rejection_reason": None,
    }

    new_asset = Asset(**asset_data)

    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    generate_asset_embedding(db, new_asset)

    return {
        "message": "asset uploaded successfully",
        "asset_id": new_asset.id
    }