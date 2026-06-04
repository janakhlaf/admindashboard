import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const API_URL = "http://127.0.0.1:8000";
export default function AdminSlider() {
 type Slide = {
 id: string;
  media_url: string;
  media_type: "image" | "video";
  file_name: string;
  active: boolean;
};

const [file, setFile] = useState<File | null>(null);
const [loading, setLoading] = useState(false);
const [slides, setSlides] = useState<Slide[]>([]);
const [fetching, setFetching] = useState(true);
const [message, setMessage] = useState("");
const [messageType, setMessageType] = useState<"success" | "error">("success");
const showMessage = (text: string, type: "success" | "error" = "success") => {
  setMessage(text);
  setMessageType(type);

  setTimeout(() => {
    setMessage("");
  }, 3000);
};

  // =====================
  // FETCH SLIDES
  // =====================
  const fetchSlides = async () => {
    setFetching(true);

    const { data, error } = await supabase
      .from("sliders")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log("FETCH ERROR:", error);
    } else {
     setSlides((data ?? []) as Slide[]);
    }

    setFetching(false);
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  // =====================
  // UPLOAD SLIDE
  // =====================
  const uploadSlide = async () => {
    if (!file) {
      showMessage("Please select a file", "error");
      return;
    }

    setLoading(true);

    const fileName = `${Date.now()}-${file.name}`;

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from("slider-media")
      .upload(fileName, file);

    if (uploadError) {
      console.log("UPLOAD ERROR:", uploadError);
      showMessage(uploadError.message, "error");
      setLoading(false);
      return;
    }

    // 2. Get public URL
    const { data } = supabase.storage
      .from("slider-media")
      .getPublicUrl(fileName);

    // 3. Insert into DB
    const { error: dbError } = await supabase.from("sliders").insert([
      {
        media_url: data.publicUrl,
        media_type: file.type.startsWith("video") ? "video" : "image",
        file_name: fileName,
        active: true,
      },
    ]);

    if (dbError) {
      console.log("DB ERROR:", dbError);
      showMessage(dbError.message, "error");
      setLoading(false);
      return;
    }

    showMessage("Uploaded successfully ", "success");

    setFile(null);
    setLoading(false);
    fetchSlides();
  };

  // =====================
  // DELETE SLIDE (FIXED 100%)
  // =====================
 const deleteSlide = async (slide: Slide) => {
  try {
    const response = await fetch(`${API_URL}/slider/${slide.id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
     showMessage(result.detail || "Delete failed", "error");
      return;
    }

    setSlides((prev) => prev.filter((s) => s.id !== slide.id));

    showMessage("Deleted successfully ", "success");
  } catch (err) {
    console.log("DELETE ERROR:", err);
    showMessage("Delete failed", "error");
  }
};

  return (<>
  {message && (
    <div
  className={`fixed bottom-6 right-6 z-50 min-w-[340px]
  px-5 py-4 rounded-2xl
  backdrop-blur-md
  bg-[#071226]
  border
  shadow-[0_0_20px_rgba(59,130,246,0.35)]
  animate-in slide-in-from-right duration-300
  ${
    messageType === "success"
      ? "border-cyan-400/70"
      : "border-red-500/70"
  }`}
>
      <div
  className={`font-semibold text-sm ${
    messageType === "success"
      ? "text-cyan-300"
      : "text-red-300"
  }`}
>
        {messageType === "success" ? "✓ Success" : "✕ Error"}
      </div>

      <div className="text-sm text-slate-300 mt-1">{message}</div>
    </div>
  )}
    <div className="flex flex-col items-center min-h-screen p-6 gap-10">

      {/* ================= UPLOAD BOX ================= */}
      <div className="w-full max-w-xl bg-[#0b0f19] border border-[#1f2937] rounded-xl p-6 shadow-lg">
       
        <h2 className="text-xl font-bold text-white mb-4">
          Upload Slider Media
        </h2>

        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-10 cursor-pointer hover:border-blue-500 transition">

          {file ? (
  <div className="flex flex-col items-center gap-2 text-center">
    <div className="w-12 h-12 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-2xl">
      {file.type.startsWith("video") ? "🎬" : "🖼️"}
    </div>

    <span className="text-blue-400 text-sm font-medium">
      File selected
    </span>

    <span className="text-gray-300 text-sm max-w-xs truncate">
      {file.name}
    </span>
  </div>
) : (
  <>
    <span className="text-gray-300 mb-2">
      Click or drag file here
    </span>

    <span className="text-sm text-gray-500">
      PNG, JPG, GIF, MP4
    </span>
  </>
)}

          <input
            type="file"
            className="hidden"
            accept="image/*,video/*"
           onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

       
        <button
          onClick={uploadSlide}
          disabled={loading}
          className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* ================= SLIDES LIST ================= */}
      <div className="w-full max-w-5xl">
        <h2 className="text-white text-xl font-bold mb-4">
          Current Slides
        </h2>

        {fetching ? (
          <p className="text-gray-400">Loading...</p>
        ) : slides.length === 0 ? (
          <p className="text-gray-400">No slides found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {slides.map((slide) => (
              <div
                key={slide.id}
                className="relative bg-[#111827] rounded-lg overflow-hidden"
              >

                {slide.media_type === "image" ? (
                  <img
                    src={slide.media_url}
                    className="w-full h-48 object-cover"
                    alt=""
                  />
                ) : (
                  <video
                    src={slide.media_url}
                    controls
                    className="w-full h-48 object-cover"
                  />
                )}

                {/* DELETE BUTTON */}
                <button
                  onClick={() => deleteSlide(slide)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>

              </div>
            ))}

          </div>
        )}
      </div>
   </div>
</>
);
}