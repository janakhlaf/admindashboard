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
BUCKET_NAME = "slider-media"

@router.delete("/{slide_id}")
async def delete_slider_item(slide_id: str):

    try:
        result = (
            supabase
            .table("sliders")
            .select("*")
            .eq("id", slide_id)
            .single()
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Slide not found")

        file_name = result.data.get("file_name")

        if not file_name:
            raise HTTPException(status_code=400, detail="file_name is missing")

        supabase.storage.from_(BUCKET_NAME).remove([file_name])
        print("FILE NAME:", file_name)

        print("TRY DELETE:", slide_id)

        delete_result = (
            supabase
            .table("sliders")
            .delete()
            .eq("id", slide_id)
            .execute()
        )

        print("DELETE RESULT:", delete_result)

        return {
            "success": True,
            "message": "Slide deleted successfully"
        }

    except Exception as e:
        print("DELETE ERROR TYPE:", type(e))
        print("DELETE ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=repr(e)
        )

        