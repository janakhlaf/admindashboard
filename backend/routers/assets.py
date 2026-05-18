from fastapi import APIRouter

router = APIRouter(prefix="/admin/assets", tags=["Admin Assets"])


@router.post("/upload")
def upload_asset():
    return {
        "message": "assets upload route is working"
    }