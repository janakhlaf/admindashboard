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
import requests


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
    if price < 0:
     raise HTTPException(
        status_code=400,
        detail="Price cannot be negative"
    )

    if price > 99999999.99:
     raise HTTPException(
        status_code=400,
        detail="Price is too large. Maximum allowed price is 99,999,999.99"
    )

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
        "file_size": f"{round(len(file_bytes) / 1024 / 1024, 2)} MB",
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

@router.patch("/{asset_id}/approve")
def approve_asset(asset_id: int, db: Session = Depends(get_db)):

    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset.status = "approved"

    user = db.query(User).filter(User.id == asset.user_id).first()

    if user and user.email:
        requests.post(
            "https://aqfjcdjqjxuqgyyzrvpf.supabase.co/functions/v1/send-review-email",
            json={
                "to": user.email,
                "subject": "Human Mind & AI Logic | Asset Approved",
                "message": f"""
<div style="font-family: Arial, sans-serif; line-height:1.8; color:#222; background:#f7f7f7; padding:30px; border-radius:12px;">
<h2 style="color:#00bcd4;">Asset Approved Successfully</h2>
<p>Hello {user.full_name},</p>
<p>Great news! Your asset <b>"{asset.name}"</b> has been approved and is now live on <b>Human Mind & AI Logic</b>.</p>
<p>Thank you for sharing your creativity with our platform.</p>
<br>
<p style="color:#777;">— Human Mind & AI Logic Team</p>
</div>
"""
            },
            headers={
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZmpjZGpxanh1cWd5eXpydnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODkwNDgsImV4cCI6MjA5Mjg2NTA0OH0.hRtKUByUAxldUSLpc3hmakiDKiPRCkg7TykEE_reXGI",
                "Content-Type": "application/json"
            }
        )

    db.commit()

    return {"message": "Asset approved successfully"}


@router.patch("/{asset_id}/reject")
def reject_asset(asset_id: int, db: Session = Depends(get_db)):

    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    user = db.query(User).filter(User.id == asset.user_id).first()

    if user and user.email:
        requests.post(
            "https://aqfjcdjqjxuqgyyzrvpf.supabase.co/functions/v1/send-review-email",
            json={
                "to": user.email,
                "subject": "Human Mind & AI Logic | Asset Not Approved",
                "message": f"""
<div style="font-family: Arial, sans-serif; line-height:1.8; color:#222; background:#f7f7f7; padding:30px; border-radius:12px;">
<h2 style="color:#ff4d6d;">Asset Submission Not Approved</h2>
<p>Hello {user.full_name},</p>
<p>We appreciate your submission to <b>Human Mind & AI Logic</b>.</p>
<p>Unfortunately, your asset <b>"{asset.name}"</b> was not approved during the review process.</p>
<p>You can improve the submission and upload it again anytime.</p>
<br>
<p style="color:#777;">— Human Mind & AI Logic Team</p>
</div>
"""
            },
            headers={
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZmpjZGpxanh1cWd5eXpydnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODkwNDgsImV4cCI6MjA5Mjg2NTA0OH0.hRtKUByUAxldUSLpc3hmakiDKiPRCkg7TykEE_reXGI",
                "Content-Type": "application/json"
            }
        )

    if asset.bucket_path:
        supabase.storage.from_(PRIVATE_BUCKET).remove([asset.bucket_path])

    if asset.preview_url:
        marker = f"/{PREVIEW_BUCKET}/"
        if marker in asset.preview_url:
            preview_path = asset.preview_url.split(marker)[-1]
            supabase.storage.from_(PREVIEW_BUCKET).remove([preview_path])

    db.delete(asset)
    db.commit()

    return {"message": "Asset rejected and deleted successfully"}