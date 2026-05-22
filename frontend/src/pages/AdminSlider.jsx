import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminSlider() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slides, setSlides] = useState([]);
  const [fetching, setFetching] = useState(true);

  // =====================
  // FETCH SLIDES
  // =====================
  const fetchSlides = async () => {
    setFetching(true);

    const { data, error } = await supabase
      .from("sliders")
      .select("*")
      .order("id", { ascending: false });

    if (!error) {
      setSlides(data);
    }

    setFetching(false);
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  // =====================
  // UPLOAD SLIDE
  // =====================
  async function uploadSlide() {
    if (!file) return alert("Please select a file");

    setLoading(true);

    const fileName = `${Date.now()}-${file.name}`;

    // upload to storage
    const { error: uploadError } = await supabase.storage
      .from("slider-media")
      .upload(fileName, file);

    if (uploadError) {
      alert(uploadError.message);
      setLoading(false);
      return;
    }

    const { data } = supabase.storage
      .from("slider-media")
      .getPublicUrl(fileName);

    // save to DB
    const { error: dbError } = await supabase.from("sliders").insert([
      {
        media_url: data.publicUrl,
        media_type: file.type.startsWith("video") ? "video" : "image",
        active: true,
      },
    ]);

    if (dbError) {
      alert(dbError.message);
      setLoading(false);
      return;
    }

    alert("Uploaded successfully 🚀");

    setFile(null);
    setLoading(false);

    // refresh list immediately
    fetchSlides();
  }

  // =====================
  // DELETE SLIDE
  // =====================
  const deleteSlide = async (slide) => {
    try {
      // extract file path from URL
      const filePath = slide.media_url.split(
        "/storage/v1/object/public/slider-media/"
      )[1];

      // delete from storage
      await supabase.storage
        .from("slider-media")
        .remove([filePath]);

      // delete from DB
      await supabase
        .from("sliders")
        .delete()
        .eq("id", slide.id);

      // update UI instantly
      setSlides((prev) => prev.filter((s) => s.id !== slide.id));
    } catch (err) {
      console.log(err);
      alert("Delete failed");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-6 gap-10">

      {/* ================= UPLOAD BOX ================= */}
      <div className="w-full max-w-xl bg-[#0b0f19] border border-[#1f2937] rounded-xl p-6 shadow-lg">

        <h2 className="text-xl font-bold text-white mb-4">
          Upload Slider Media
        </h2>

        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-10 cursor-pointer hover:border-blue-500 transition">
          <span className="text-gray-300 mb-2">
            Click or drag file here
          </span>
          <span className="text-sm text-gray-500">
            PNG, JPG, GIF, MP4
          </span>

          <input
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        {file && (
          <p className="text-gray-400 mt-3 text-sm">
            Selected: {file.name}
          </p>
        )}

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
  );
}