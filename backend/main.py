from typing import Optional
import os
import uuid
import json

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from supabase import create_client

from database import get_db
from models import Film, Asset, User


load_dotenv()

app = FastAPI(title="Admin Dashboard Backend")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL or SUPABASE_KEY is missing in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AdminLogin(BaseModel):
    email: str
    password: str


class FilmUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    thumbnail_url: Optional[str] = None
    bucket_path: Optional[str] = None
    duration: Optional[str] = None
    file_size: Optional[str] = None


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    preview_url: Optional[str] = None
    bucket_path: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None


@app.get("/")
def root():
    return {"message": "Admin backend is running"}


@app.post("/admin/login")
def admin_login(data: AdminLogin, db: Session = Depends(get_db)):
    admin_user = (
        db.query(User)
        .filter(User.email == data.email, User.role == "admin")
        .first()
    )

    if not admin_user:
        raise HTTPException(status_code=401, detail="Invalid admin email")

    if admin_user.password_hash != data.password:
        raise HTTPException(status_code=401, detail="Invalid password")

    return {
        "message": "Admin login successful",
        "admin_id": admin_user.id,
        "email": admin_user.email,
    }


@app.get("/films")
def get_films(db: Session = Depends(get_db)):
    return db.query(Film).all()


@app.get("/assets")
def get_assets(db: Session = Depends(get_db)):
    return db.query(Asset).all()


@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "name": getattr(user, "full_name", None)
            or getattr(user, "name", None)
            or getattr(user, "username", None)
            or f"User {user.id}",
            "email": getattr(user, "email", "") or "",
            "avatar_url": getattr(user, "avatar_url", "") or "",
        }
        for user in users
    ]


@app.post("/admin/assets/upload")
async def admin_upload_asset(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    price: float = Form(0),
    tags: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    file_extension = (
        file.filename.split(".")[-1].lower()
        if file.filename and "." in file.filename
        else "glb"
    )

    unique_name = f"{uuid.uuid4()}.{file_extension}"

    private_path = f"admin/{unique_name}"
    preview_path = f"admin/{unique_name}"

    if file_extension == "glb":
        content_type = "model/gltf-binary"
    elif file_extension == "gltf":
        content_type = "model/gltf+json"
    else:
        content_type = file.content_type or "application/octet-stream"

    try:
        supabase.storage.from_("assets_private").upload(
            private_path,
            file_bytes,
            {
                "content-type": content_type,
                "upsert": "true",
            },
        )

        supabase.storage.from_("assets_previwe").upload(
            preview_path,
            file_bytes,
            {
                "content-type": content_type,
                "upsert": "true",
            },
        )

        preview_public_url = (
            supabase.storage
            .from_("assets_previwe")
            .get_public_url(preview_path)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Supabase upload failed: {str(error)}",
        )

    parsed_tags = json.loads(tags) if tags else []

    new_asset = Asset(
        user_id=None,

        name=name,
        description=description,
        category=category,

        tags=parsed_tags,

        preview_url=preview_public_url,
        bucket_path=private_path,

        file_type=file_extension,
        file_size=len(file_bytes),

        price=price,

        source_type="admin",
        status="approved",

        rejection_reason=None,
    )

    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)

    return {
        "message": "Admin asset uploaded successfully",
        "asset": new_asset,
    }


@app.post("/admin/films/upload")
async def admin_upload_film(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    duration: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),

    thumbnail: UploadFile = File(...),
    film_file: UploadFile = File(...),

    db: Session = Depends(get_db)
):
    thumbnail_bytes = await thumbnail.read()
    film_bytes = await film_file.read()

    if not thumbnail_bytes:
        raise HTTPException(
            status_code=400,
            detail="Thumbnail is empty",
        )

    if not film_bytes:
        raise HTTPException(
            status_code=400,
            detail="Film file is empty",
        )

    thumbnail_extension = (
        thumbnail.filename.split(".")[-1].lower()
        if thumbnail.filename and "." in thumbnail.filename
        else "png"
    )

    film_extension = (
        film_file.filename.split(".")[-1].lower()
        if film_file.filename and "." in film_file.filename
        else "mp4"
    )

    unique_thumbnail_name = f"{uuid.uuid4()}.{thumbnail_extension}"
    unique_film_name = f"{uuid.uuid4()}.{film_extension}"

    thumbnail_path = f"films/{unique_thumbnail_name}"
    film_path = f"films/{unique_film_name}"

    thumbnail_content_type = thumbnail.content_type or "image/png"
    film_content_type = film_file.content_type or "video/mp4"

    try:
        supabase.storage.from_("thumbnail_previw").upload(
            thumbnail_path,
            thumbnail_bytes,
            {
                "content-type": thumbnail_content_type,
                "upsert": "true",
            },
        )

        thumbnail_public_url = (
            supabase.storage
            .from_("thumbnail_previw")
            .get_public_url(thumbnail_path)
        )

        supabase.storage.from_("films_private").upload(
            film_path,
            film_bytes,
            {
                "content-type": film_content_type,
                "upsert": "true",
            },
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Film upload failed: {str(error)}",
        )

    parsed_tags = json.loads(tags) if tags else []

    new_film = Film(
        user_id=None,

        title=title,
        description=description,
        category=category,

        tags=parsed_tags,

        thumbnail_url=thumbnail_public_url,
        thumbnail_basic=thumbnail_public_url,

        bucket_path=film_path,

        mime_type=film_content_type,

        duration=duration,

        file_size=f"{round(len(film_bytes) / 1024 / 1024, 2)} MB",

        price=0,

        source_type="admin",

        status="approved",

        rejection_reason=None,
    )

    db.add(new_film)
    db.commit()
    db.refresh(new_film)

    return {
        "message": "Film uploaded successfully",
        "film": new_film,
    }


@app.put("/films/{film_id}")
def update_film(
    film_id: int,
    data: FilmUpdate,
    db: Session = Depends(get_db)
):
    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(status_code=404, detail="Film not found")

    update_data = data.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(film, key, value)

    db.commit()
    db.refresh(film)

    return {
        "message": "Film updated successfully",
        "film": film,
    }


@app.delete("/films/{film_id}")
def delete_film(film_id: int, db: Session = Depends(get_db)):
    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(status_code=404, detail="Film not found")

    db.delete(film)
    db.commit()

    return {"message": "Film deleted successfully"}


@app.put("/assets/{asset_id}")
def update_asset(
    asset_id: int,
    data: AssetUpdate,
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    update_data = data.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(asset, key, value)

    db.commit()
    db.refresh(asset)

    return {
        "message": "Asset updated successfully",
        "asset": asset,
    }


@app.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db.delete(asset)
    db.commit()

    return {"message": "Asset deleted successfully"}