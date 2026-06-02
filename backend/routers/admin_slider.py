from fastapi import APIRouter, HTTPException
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter(
    prefix="/slider",
    tags=["slider"]
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
)

# =========================
# DELETE SLIDER FILE
# =========================
@router.delete("/{file_path:path}")
async def delete_slider_item(file_path: str):

    try:
        print("========== DELETE REQUEST ==========")
        print("FILE PATH:", file_path)

        if not file_path:
            raise HTTPException(
                status_code=400,
                detail="file_path is required"
            )

        # تنظيف المسار (مهم جداً)
        clean_path = file_path.strip()

        # =========================
        # DELETE FROM STORAGE
        # =========================
        storage_response = supabase.storage \
            .from_("slider-media") \
            .remove([clean_path])

        print("SUPABASE STORAGE RESPONSE:", storage_response)

        # =========================
        # CHECK STORAGE RESULT
        # =========================
        if not storage_response:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete file from storage"
            )

        return {
            "success": True,
            "deleted_file": clean_path,
            "storage_response": str(storage_response)
        }

    except Exception as e:
        print("DELETE ERROR:", str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )