from typing import Optional
import os
import uuid
import json

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from supabase import create_client

from database import get_db
from models import Film, Asset, User
from routers.assets import router as assets_router
from routers.films import router as films_router
from routers.admin_slider import router as slider_router


load_dotenv()

app = FastAPI(title="Admin Dashboard Backend")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL or SUPABASE_SERVICE_KEY is missing in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(assets_router)
app.include_router(films_router)
app.include_router(slider_router)



class FilmUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None


@app.get("/")
def root():
    return {"message": "Admin backend is running"}


@app.get("/films")
def get_films(db: Session = Depends(get_db)):
    return db.query(Film).all()


@app.get("/assets")
def get_assets(db: Session = Depends(get_db)):
    return db.query(Asset).all()


@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()

    result = []

    for user in users:
        assets_count = (
            db.query(Asset)
            .filter(Asset.user_id == user.id)
            .count()
        )

        films_count = (
            db.query(Film)
            .filter(Film.user_id == user.id)
            .count()
        )

        result.append({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "profile_image": user.profile_image,
            "assets_count": assets_count,
            "films_count": films_count,
            "total_uploads": assets_count + films_count,
        })

    return result


@app.put("/assets/{asset_id}")
def update_asset(
    asset_id: int,
    data: AssetUpdate,
    db: Session = Depends(get_db),
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


@app.put("/films/{film_id}")
def update_film(
    film_id: int,
    data: FilmUpdate,
    db: Session = Depends(get_db),
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


@app.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db.delete(asset)
    db.commit()

    return {"message": "Asset deleted successfully"}