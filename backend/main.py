from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

@app.patch("/films/{film_id}/approve")
def approve_film(film_id: int, db: Session = Depends(get_db)):
    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(status_code=404, detail="Film not found")

    film.status = "approved"
    film.rejection_reason = None

    db.commit()
    db.refresh(film)

    return {
        "message": "Film approved successfully",
        "film": film
    }


@app.patch("/films/{film_id}/reject")
def reject_film(film_id: int, db: Session = Depends(get_db)):
    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(status_code=404, detail="Film not found")

    film.status = "rejected"

    db.commit()
    db.refresh(film)

    return {
        "message": "Film rejected successfully",
        "film": film
    }


@app.delete("/films/{film_id}")
def delete_film(film_id: int, db: Session = Depends(get_db)):
    film = db.query(Film).filter(Film.id == film_id).first()

    if not film:
        raise HTTPException(status_code=404, detail="Film not found")

    db.delete(film)
    db.commit()

    return {
        "message": "Film deleted successfully"
    }


# =========================
# ASSET APIs
# =========================

@app.patch("/assets/{asset_id}/approve")
def approve_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset.status = "approved"
    asset.rejection_reason = None

    db.commit()
    db.refresh(asset)

    return {
        "message": "Asset approved successfully",
        "asset": asset
    }


@app.patch("/assets/{asset_id}/reject")
def reject_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset.status = "rejected"

    db.commit()
    db.refresh(asset)

    return {
        "message": "Asset rejected successfully",
        "asset": asset
    }


@app.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db.delete(asset)
    db.commit()

    return {
        "message": "Asset deleted successfully"
    }