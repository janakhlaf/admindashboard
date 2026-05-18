from typing import Optional
import os
import uuid

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


class AdminFilmCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = 0
    thumbnail_url: Optional[str] = None
    bucket_path: Optional[str] = None
    duration: Optional[str] = None
    file_size: Optional[str] = None
    mime_type: Optional[str] = None


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
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    file_extension = file.filename.split(".")[-1] if "." in file.filename else "glb"
    unique_name = f"{uuid.uuid4()}.{file_extension}"

    private_path = f"admin/{unique_name}"
    preview_path = f"admin/{unique_name}"

    content_type = file.content_type or "application/octet-stream"

    try:
        supabase.storage.from_("assets_private").upload(
            private_path,
            file_bytes,
            {
                "content-type": content_type,
                "upsert": "true",
            }
        )

        supabase.storage.from_("assets_previwe").upload(
            preview_path,
            file_bytes,
            {
                "content-type": content_type,
                "upsert": "true",
            }
        )

        preview_public_url = (
            supabase.storage
            .from_("assets_previwe")
            .get_public_url(preview_path)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Supabase upload failed: {str(error)}"
        )

    new_asset = Asset(
        user_id=None,
        name=name,
        description=description,
        category=category,
        preview_url=preview_public_url,
        bucket_path=private_path,
        file_type=content_type,
        file_size=len(file_bytes),
        price=price,
        source_type="admin_upload",
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
def admin_upload_film(data: AdminFilmCreate, db: Session = Depends(get_db)):
    new_film = Film(
        user_id=None,
        title=data.title,
        description=data.description,
        category=data.category,
        thumbnail_url=data.thumbnail_url,
        bucket_path=data.bucket_path,
        mime_type=data.mime_type,
        price=data.price,
        source_type="admin_upload",
        status="approved",
        rejection_reason=None,
        duration=data.duration,
        file_size=data.file_size,
        thumbnail_basic=data.thumbnail_url,
    )

    db.add(new_film)
    db.commit()
    db.refresh(new_film)

    return {
        "message": "Admin film uploaded and approved successfully",
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