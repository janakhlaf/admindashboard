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


# =========================
# GET APIs
# =========================

@app.get("/films")
def get_films(db: Session = Depends(get_db)):
    return db.query(Film).all()


@app.get("/assets")
def get_assets(db: Session = Depends(get_db)):
    return db.query(Asset).all()


@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()


# =========================
# FILM APIs
# =========================

@app.put("/films/{film_id}")
def update_film(film_id: int, data: FilmUpdate, db: Session = Depends(get_db)):
    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(status_code=404, detail="Film not found")

    if film.source_type != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only official admin films can be edited"
        )

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(film, key, value)

    db.commit()
    db.refresh(film)

    return {
        "message": "Film updated successfully",
        "film": film
    }


@app.patch("/films/{film_id}/approve")
def approve_film(film_id: int, db: Session = Depends(get_db)):
    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(status_code=404, detail="Film not found")

    film.status = "approved"
    film.rejection_reason = None

    db.commit()
    db.refresh(film)

    return {"message": "Film approved successfully", "film": film}


@app.patch("/films/{film_id}/reject")
def reject_film(film_id: int, db: Session = Depends(get_db)):
    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(status_code=404, detail="Film not found")

    film.status = "rejected"

    db.commit()
    db.refresh(film)

    return {"message": "Film rejected successfully", "film": film}


@app.delete("/films/{film_id}")
def delete_film(film_id: int, db: Session = Depends(get_db)):
    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(status_code=404, detail="Film not found")

    db.delete(film)
    db.commit()

    return {"message": "Film deleted successfully"}


# =========================
# ASSET APIs
# =========================

@app.put("/assets/{asset_id}")
def update_asset(asset_id: int, data: AssetUpdate, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if asset.source_type != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only official admin assets can be edited"
        )

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(asset, key, value)

    db.commit()
    db.refresh(asset)

    return {
        "message": "Asset updated successfully",
        "asset": asset
    }


@app.patch("/assets/{asset_id}/approve")
def approve_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset.status = "approved"
    asset.rejection_reason = None

    db.commit()
    db.refresh(asset)

    return {"message": "Asset approved successfully", "asset": asset}


@app.patch("/assets/{asset_id}/reject")
def reject_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset.status = "rejected"

    db.commit()
    db.refresh(asset)

    return {"message": "Asset rejected successfully", "asset": asset}


@app.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db.delete(asset)
    db.commit()

    return {"message": "Asset deleted successfully"}