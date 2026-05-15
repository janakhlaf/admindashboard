import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

const UploadFilm = () => {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [filmFile, setFilmFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUploadFilm = async () => {
    if (!title.trim()) {
      setMessage("Film title is required");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/admin/films/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title,
          category: genre,
          description,
          duration,

          thumbnail_url: thumbnail?.name || "",
          bucket_path: filmFile?.name || "",

          mime_type: filmFile?.type || "",

          file_size: filmFile
            ? `${(filmFile.size / 1024 / 1024).toFixed(2)} MB`
            : "",

          price: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload film");
      }

      setTitle("");
      setGenre("");
      setDescription("");
      setDuration("");

      setThumbnail(null);
      setFilmFile(null);

      setMessage("Film uploaded successfully and approved directly.");
    } catch (error) {
      setMessage("Something went wrong while uploading film.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">
          Upload Film
        </h1>

        <p className="text-gray-400 mb-10">
          Upload and publish cinematic films directly from the admin dashboard.
        </p>

        <div className="bg-[#07111f]/80 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-xl">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Film Title */}
            <div>
              <label className="block mb-2 text-sm text-cyan-300">
                Film Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter film title"
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            {/* Genre */}
            <div>
              <label className="block mb-2 text-sm text-cyan-300">
                Genre
              </label>

              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Sci-Fi / Action / Drama..."
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the film..."
              rows={5}
              className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>

          {/* Duration */}
          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Duration
            </label>

            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="10 min / 1h 20m..."
              className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>

          {/* Thumbnail */}
          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Thumbnail
            </label>

            <div className="border-2 border-dashed border-cyan-500/20 rounded-2xl p-6 text-center bg-black/30">
              <input
                type="file"
                onChange={(e) =>
                  setThumbnail(e.target.files?.[0] || null)
                }
                className="text-sm text-gray-400"
              />

              {thumbnail && (
                <p className="mt-3 text-sm text-gray-400">
                  Selected: {thumbnail.name}
                </p>
              )}
            </div>
          </div>

          {/* Film File */}
          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Film File
            </label>

            <div className="border-2 border-dashed border-cyan-500/20 rounded-2xl p-10 text-center bg-black/30">
              <input
                type="file"
                onChange={(e) =>
                  setFilmFile(e.target.files?.[0] || null)
                }
                className="text-sm text-gray-400"
              />

              {filmFile && (
                <p className="mt-3 text-sm text-gray-400">
                  Selected: {filmFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <p className="mt-6 text-sm text-cyan-300">
              {message}
            </p>
          )}

          {/* Button */}
          <div className="mt-8">
            <button
              onClick={handleUploadFilm}
              disabled={loading}
              className="bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-8 py-3 rounded-xl transition-all duration-200"
            >
              {loading ? "Uploading..." : "Upload Film"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadFilm;