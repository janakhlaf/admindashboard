from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Film, Asset, User


app = FastAPI(title="Admin Dashboard Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# MODELS
# =========================

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


class AdminAssetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = 0
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


# =========================
# ROOT
# =========================

@app.get("/")
def root():
    return {"message": "Admin backend is running"}


# =========================
# ADMIN LOGIN
# =========================

@app.post("/admin/login")
def admin_login(data: AdminLogin, db: Session = Depends(get_db)):

    admin_user = (
        db.query(User)
        .filter(
            User.email == data.email,
            User.role == "admin"
        )
        .first()
    )

    if not admin_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid admin email"
        )

    # TEMP PASSWORD CHECK

    if admin_user.password_hash != data.password:
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    return {
        "message": "Admin login successful",
        "admin_id": admin_user.id,
        "email": admin_user.email,
    }


# =========================
# GET FILMS
# =========================

@app.get("/films")
def get_films(db: Session = Depends(get_db)):
    return db.query(Film).all()


# =========================
# GET ASSETS
# =========================

@app.get("/assets")
def get_assets(db: Session = Depends(get_db)):
    return db.query(Asset).all()


# =========================
# GET USERS
# =========================

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


# =========================
# ADMIN UPLOAD ASSET
# =========================

@app.post("/admin/assets/upload")
def admin_upload_asset(data: AdminAssetCreate, db: Session = Depends(get_db)):

    new_asset = Asset(
        user_id=None,
        name=data.name,
        description=data.description,
        category=data.category,
        preview_url=data.preview_url,
        bucket_path=data.bucket_path,
        file_type=data.file_type,
        file_size=data.file_size,
        price=data.price,
        source_type="admin",
        status="approved",
        rejection_reason=None,
    )

    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)

    return {
        "message": "Admin asset uploaded and approved successfully",
        "asset": new_asset
    }


# =========================
# ADMIN UPLOAD FILM
# =========================

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
        source_type="admin",
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
        "film": new_film
    }


# =========================
# UPDATE FILM
# =========================

@app.put("/films/{film_id}")
def update_film(
    film_id: int,
    data: FilmUpdate,
    db: Session = Depends(get_db)
):

    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(
            status_code=404,
            detail="Film not found"
        )

    update_data = data.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(film, key, value)

    db.commit()
    db.refresh(film)

    return {
        "message": "Film updated successfully",
        "film": film
    }


# =========================
# DELETE FILM
# =========================

@app.delete("/films/{film_id}")
def delete_film(film_id: int, db: Session = Depends(get_db)):

    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(
            status_code=404,
            detail="Film not found"
        )

    db.delete(film)
    db.commit()

    return {"message": "Film deleted successfully"}


# =========================
# UPDATE ASSET
# =========================

@app.put("/assets/{asset_id}")
def update_asset(
    asset_id: int,
    data: AssetUpdate,
    db: Session = Depends(get_db)
):

    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    update_data = data.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(asset, key, value)

    db.commit()
    db.refresh(asset)

    return {
        "message": "Asset updated successfully",
        "asset": asset
    }


# =========================
# DELETE ASSET
# =========================

@app.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):

    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    db.delete(asset)
    db.commit()

    return {"message": "Asset deleted successfully"}