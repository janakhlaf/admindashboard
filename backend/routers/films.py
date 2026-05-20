from fastapi import APIRouter, Header, HTTPException, UploadFile, File, Form
from supabase import create_client
from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Film, User
import os
import uuid
import json

router = APIRouter(prefix="/admin/films", tags=["Admin Films"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

THUMBNAIL_BUCKET = os.getenv("THUMBNAIL_BUCKET", "thumbnail_previw")
FILMS_BUCKET = os.getenv("FILMS_BUCKET", "films_private")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


@router.post("/upload")
def upload_film(
    authorization: str = Header(None),
    title: str = Form(...),
    category: str = Form(""),
    description: str = Form(""),
    duration: str = Form(""),
    price: float = Form(0),
    tags: str = Form("[]"),
    thumbnail: UploadFile = File(...),
    film_file: UploadFile = File(...),
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

    thumbnail_ext = thumbnail.filename.split(".")[-1]
    film_ext = film_file.filename.split(".")[-1]

    thumbnail_name = f"films/{uuid.uuid4()}.{thumbnail_ext}"
    film_name = f"films/{uuid.uuid4()}.{film_ext}"

    thumbnail_bytes = thumbnail.file.read()
    film_bytes = film_file.file.read()

    supabase.storage.from_(THUMBNAIL_BUCKET).upload(
        thumbnail_name,
        thumbnail_bytes,
        {
            "content-type": thumbnail.content_type
        }
    )

    supabase.storage.from_(FILMS_BUCKET).upload(
        film_name,
        film_bytes,
        {
            "content-type": film_file.content_type
        }
    )

    thumbnail_url = supabase.storage.from_(THUMBNAIL_BUCKET).get_public_url(
        thumbnail_name
    )

    film_data = {
       "user_id": current_user.id,
        "title": title,
        "description": description,
        "category": category,
        "duration": duration,
        "price": price,
        "tags": json.loads(tags),
        "thumbnail_url": thumbnail_url,
        "thumbnail_basic": thumbnail_url,
        "bucket_path": film_name,
        "mime_type": film_file.content_type,
        "file_size": f"{round(len(film_bytes) / 1024 / 1024, 2)} MB",
        "source_type": "admin",
        "status": "approved",
        "rejection_reason": None,
    }

    new_film = Film(**film_data)
    
    db.add(new_film)
    db.commit()
    db.refresh(new_film)

    return {
        "message": "film uploaded successfully",
        "film_id": new_film.id
    }


