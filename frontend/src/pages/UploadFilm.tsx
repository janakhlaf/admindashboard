import { useState } from "react";

const API_URL = "http://localhost:8000";

const FILM_TAGS = [
  "action",
  "adventure",
  "animation",
  "anime",
  "comedy",
  "crime",
  "cyberpunk",
  "documentary",
  "drama",
  "fantasy",
  "historical",
  "horror",
  "magic",
  "mystery",
  "post-apocalyptic",
  "psychological",
  "romance",
  "sci-fi",
  "space",
  "superhero",
  "survival",
  "thriller",
  "war",
];

const UploadFilm = () => {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [filmFile, setFilmFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag) && selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleUploadFilm = async () => {
    if (!title.trim()) {
      setMessage("Film title is required");
      return;
    }

    if (!thumbnail) {
      setMessage("Thumbnail image is required");
      return;
    }

    if (!filmFile) {
      setMessage("Film file is required");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const formData = new FormData();

      formData.append("title", title);
      formData.append("category", genre);
      formData.append("description", description);
      formData.append("duration", duration);
      formData.append("tags", JSON.stringify(selectedTags));

      formData.append("thumbnail", thumbnail);
      formData.append("film_file", filmFile);

      const response = await fetch(`${API_URL}/admin/films/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(errorData?.detail || "Failed to upload film");
      }

      setTitle("");
      setGenre("");
      setDescription("");
      setDuration("");
      setSelectedTags([]);

      setThumbnail(null);
      setFilmFile(null);

      setMessage("Film uploaded successfully to Storage and Database.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading film."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Upload Film</h1>

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

          {/* Tags */}
          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Tags (Select up to 3)
            </label>

            <select
              value=""
              onChange={(e) => handleAddTag(e.target.value)}
              className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white"
            >
              <option value="" disabled>
                Choose tags
              </option>

              {FILM_TAGS.map((tag) => (
                <option
                  key={tag}
                  value={tag}
                  disabled={selectedTags.includes(tag)}
                  className="bg-[#07111f] text-white"
                >
                  {tag}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-2 mt-3">
              {selectedTags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400 text-black text-sm font-medium"
                >
                  {tag}

                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {selectedTags.length >= 3 && (
              <p className="text-xs text-gray-400 mt-2">
                Maximum 3 tags selected
              </p>
            )}
          </div>

          {/* Thumbnail */}
          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Thumbnail
            </label>

            <button
              type="button"
              onClick={() =>
                document.getElementById("thumbnail-upload")?.click()
              }
              className="w-full rounded-2xl border-2 border-dashed border-cyan-500/20 bg-black/30 p-10 text-center hover:border-cyan-400 transition-all duration-300"
            >
              <p className="text-white font-medium">
                {thumbnail ? thumbnail.name : "Choose Thumbnail Image"}
              </p>

              <p className="text-sm text-gray-400 mt-2">PNG, JPG, WEBP</p>
            </button>

            <input
              id="thumbnail-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          {/* Film File */}
          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Film File
            </label>

            <button
              type="button"
              onClick={() =>
                document.getElementById("film-upload")?.click()
              }
              className="w-full rounded-2xl border-2 border-dashed border-cyan-500/20 bg-black/30 p-10 text-center hover:border-cyan-400 transition-all duration-300"
            >
              <p className="text-white font-medium">
                {filmFile ? filmFile.name : "Choose Film File"}
              </p>

              <p className="text-sm text-gray-400 mt-2">MP4, MOV, AVI</p>
            </button>

            <input
              id="film-upload"
              type="file"
              accept="video/*"
              onChange={(e) => setFilmFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          {/* Message */}
          {message && <p className="mt-6 text-sm text-cyan-300">{message}</p>}

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