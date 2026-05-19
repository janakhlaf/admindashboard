import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminSlider() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function uploadSlide() {
    if (!file) return alert("Please select a file");

    setLoading(true);

    const fileName = `${Date.now()}-${file.name}`;

    // upload to storage
    const { error } = await supabase.storage
      .from("slider-media")
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const { data } = supabase.storage
      .from("slider-media")
      .getPublicUrl(fileName);

    // save to DB
    await supabase.from("sliders").insert([
      {
        media_url: data.publicUrl,
        media_type: file.type.startsWith("video")
          ? "video"
          : "image",
        active: true,
      },
    ]);

    alert("Uploaded successfully 🚀");
    setFile(null);
    setLoading(false);
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-xl bg-[#0b0f19] border border-[#1f2937] rounded-xl p-6 shadow-lg">

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-4">
          Upload Slider Media
        </h2>

        {/* Upload Box */}
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

        {/* Selected File */}
        {file && (
          <p className="text-gray-400 mt-3 text-sm">
            Selected: {file.name}
          </p>
        )}

        {/* Button */}
        <button
          onClick={uploadSlide}
          disabled={loading}
          className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>

      </div>
    </div>
  );
}