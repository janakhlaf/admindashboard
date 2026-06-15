from fastapi import APIRouter, Header, HTTPException, UploadFile, File, Form
from supabase import create_client
from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Film, User
from embedding_service import generate_film_embedding
import tempfile
from moviepy import VideoFileClip
import os
import uuid
import json

router = APIRouter(prefix="/admin/films", tags=["Admin Films"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

THUMBNAIL_BUCKET = os.getenv("THUMBNAIL_BUCKET", "thumbnail_previw")
FILMS_BUCKET = os.getenv("FILMS_BUCKET", "films_private")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def format_duration(seconds: float):
    total_seconds = int(seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60

    if hours > 0:
        return f"{hours}h {minutes}m"

    return f"{minutes} min"


@router.post("/upload")
def upload_film(
    authorization: str = Header(None),
    title: str = Form(...),
    category: str = Form(""),
    description: str = Form(""),
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

    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{film_ext}") as temp_video:
        temp_video.write(film_bytes)
        temp_video_path = temp_video.name

    video_clip = VideoFileClip(temp_video_path)
    duration = format_duration(video_clip.duration)
    video_clip.close()

    os.remove(temp_video_path)

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
       
    }

    new_film = Film(**film_data)
    
    db.add(new_film)
    db.commit()
    db.refresh(new_film)
    generate_film_embedding(db, new_film)

    return {
        "message": "film uploaded successfully",
        "film_id": new_film.id
    }

@router.post("/approve/{film_id}")
def approve_film(film_id: int, db: Session = Depends(get_db)):

    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(status_code=404, detail="Film not found")

    film.status = "approved"
    
    user = db.query(User).filter(User.id == film.user_id).first()

    import requests

    if user and user.email:

        email_response = requests.post(
        "https://aqfjcdjqjxuqgyyzrvpf.supabase.co/functions/v1/send-review-email",
        json={
            "to": user.email,
            "subject": "Human Mind & AI Logic | Film Approved",
            "message": f"""
            <div style="font-family: Arial, sans-serif; line-height:1.8; color:#ffffff; background:#0b0b0b; padding:30px; border-radius:12px;">

            <h2 style="color:#00d4ff; margin-bottom:20px;">
            🎬 Film Approved Successfully
            </h2>

            <p>Hello {user.full_name},</p>

            <p>
            Great news! Your film
            <b>"{film.title}"</b>
            has been approved and is now live on
            <b>Human Mind & AI Logic</b>.
            </p>

            <p>
            Thank you for sharing your creativity with our platform.
            </p>

            <br>

            <p style="color:#999;">
            — Human Mind & AI Logic Team
            </p>

            </div>
            """
        },
        headers={
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZmpjZGpxanh1cWd5eXpydnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODkwNDgsImV4cCI6MjA5Mjg2NTA0OH0.hRtKUByUAxldUSLpc3hmakiDKiPRCkg7TykEE_reXGI",
            "Content-Type": "application/json"
        }
    )

    db.commit()

    return {
        "message": "Film approved successfully"
    }


@router.delete("/reject/{film_id}")
def reject_film(film_id: int, db: Session = Depends(get_db)):

    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(status_code=404, detail="Film not found")

    if film.bucket_path:
        supabase.storage.from_(FILMS_BUCKET).remove([film.bucket_path])

    if film.thumbnail_url:
        marker = f"/{THUMBNAIL_BUCKET}/"

        if marker in film.thumbnail_url:
            thumbnail_path = film.thumbnail_url.split(marker)[-1]

            supabase.storage.from_(THUMBNAIL_BUCKET).remove([thumbnail_path])
            
    user = db.query(User).filter(User.id == film.user_id).first()

    import requests

    if user and user.email:

        requests.post(
            "https://aqfjcdjqjxuqgyyzrvpf.supabase.co/functions/v1/send-review-email",
            json={
                "to": user.email,
                "subject": "Human Mind & AI Logic | Film Rejected",
                "message": f"""
                <div style="font-family: Arial, sans-serif; line-height:1.8; color:#ffffff; background:#0b0b0b; padding:30px; border-radius:12px;">

                <h2 style="color:#ff4d6d; margin-bottom:20px;">
                Submission Not Approved
                </h2>

                <p>Hello {user.full_name},</p>

                <p>
                We appreciate your submission to
                <b>Human Mind & AI Logic</b>.
                </p>

                <p>
                Unfortunately, your film
                <b>"{film.title}"</b>
                was not approved during the review process.
                </p>

                <p>
                You can improve the submission and upload it again anytime.
                </p>

                <br>

                <p style="color:#999;">
                — Human Mind & AI Logic Team
                </p>

                </div>
                """
            },
            headers={
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZmpjZGpxanh1cWd5eXpydnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODkwNDgsImV4cCI6MjA5Mjg2NTA0OH0.hRtKUByUAxldUSLpc3hmakiDKiPRCkg7TykEE_reXGI",
                "Content-Type": "application/json"
            }
        )
    db.delete(film)
    
    db.commit()

    return {
        "message": "Film rejected and deleted successfully"
    }

@router.delete("/{film_id}")
def delete_film(film_id: int, db: Session = Depends(get_db)):

    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(status_code=404, detail="Film not found")

    if film.bucket_path:
        supabase.storage.from_(FILMS_BUCKET).remove([film.bucket_path])

    if film.thumbnail_url:
        marker = f"/{THUMBNAIL_BUCKET}/"

        if marker in film.thumbnail_url:
            thumbnail_path = film.thumbnail_url.split(marker)[-1]

            supabase.storage.from_(THUMBNAIL_BUCKET).remove([thumbnail_path])

    db.delete(film)
    db.commit()

    return {
        "message": "Film deleted successfully"
    }


