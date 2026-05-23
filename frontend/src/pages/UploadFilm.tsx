import { useState } from "react";
import { File } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  "racing",
  "food",
  "superhero",
  "survival",
  "robot",
  "thriller",
  "war",
];

const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "avi", "mkv"];

const UploadFilm = () => {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [filmFile, setFilmFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const inputClass = (key: string) =>
    `w-full bg-black/40 border rounded-xl px-4 py-3 outline-none text-white ${
      errors[key]
        ? "border-red-500 ring-1 ring-red-500"
        : "border-cyan-500/20 focus:border-cyan-400"
    }`;

  const handleAddTag = (tag: string) => {
    if (!tag) return;

    if (!selectedTags.includes(tag) && selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);

      setErrors((prev) => ({
        ...prev,
        tags: "",
      }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Film title is required";
    }

    if (!genre.trim()) {
      newErrors.genre = "Category is required";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (selectedTags.length !== 3) {
      newErrors.tags = "You must select exactly 3 tags";
    }

    if (!thumbnail) {
      newErrors.thumbnail = "Thumbnail image is required";
    }

    if (!filmFile) {
      newErrors.filmFile = "Film file is required";
    } else {
      const ext = filmFile.name.split(".").pop()?.toLowerCase();

      if (!ext || !VIDEO_EXTENSIONS.includes(ext)) {
        newErrors.filmFile =
          "Only video files are allowed: mp4, mov, webm, avi, mkv";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleUploadFilm = async () => {
    setMessage("");

    if (!validateForm()) return;

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("title", title);
      formData.append("category", genre);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("tags", JSON.stringify(selectedTags));

      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }

      if (filmFile) {
        formData.append("film_file", filmFile);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("You must be logged in");
      }

      const response = await fetch(`${API_URL}/admin/films/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch((): null => null);

        throw new Error(errorData?.detail || "Failed to upload film");
      }

      setTitle("");
      setGenre("");
      setDescription("");
      setPrice("");
      setSelectedTags([]);
      setThumbnail(null);
      setFilmFile(null);
      setErrors({});

      setMessageType("success");
      setMessage("Film uploaded successfully to Storage and Database.");
    } catch (error) {
      setMessageType("error");

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
            <div>
              <label className="block mb-2 text-sm text-cyan-300">
                Film Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);

                  setErrors((prev) => ({
                    ...prev,
                    title: "",
                  }));
                }}
                placeholder="Enter film title"
                className={inputClass("title")}
              />

              {errors.title && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm text-cyan-300">
                Category
              </label>

              <input
                type="text"
                value={genre}
                onChange={(e) => {
                  setGenre(e.target.value);

                  setErrors((prev) => ({
                    ...prev,
                    genre: "",
                  }));
                }}
                placeholder="Sci-Fi / Action / Drama..."
                className={inputClass("genre")}
              />

              {errors.genre && (
                <p className="mt-1 text-xs text-red-400">
                  Category is required
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);

                setErrors((prev) => ({
                  ...prev,
                  description: "",
                }));
              }}
              placeholder="Describe the film..."
              rows={5}
              className={inputClass("description")}
            />

            {errors.description && (
              <p className="mt-1 text-xs text-red-400">
                {errors.description}
              </p>
            )}
          </div>

          <div className="mt-6">
          <label className="block mb-2 text-sm text-cyan-300">
            Price
          </label>

          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter film price"
            className={inputClass("price")}
          />
         </div>

          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Tags (Select exactly 3)
            </label>

            <select
              value=""
              onChange={(e) => handleAddTag(e.target.value)}
              className={`w-full bg-black/40 border rounded-xl px-4 py-3 outline-none text-white ${
                errors.tags
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-cyan-500/20 focus:border-cyan-400"
              }`}
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

            {errors.tags && (
              <p className="mt-1 text-xs text-red-400">
                {errors.tags}
              </p>
            )}
          </div>

          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Thumbnail Image
            </label>

            <div
              className={`border rounded-xl px-4 py-3 bg-black/40 ${
                errors.thumbnail
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-cyan-500/20"
              }`}
            >
              <input
                type="file"
                id="thumbnail-upload"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  setThumbnail(e.target.files?.[0] || null);

                  setErrors((prev) => ({
                    ...prev,
                    thumbnail: "",
                  }));
                }}
              />

              <label
                htmlFor="thumbnail-upload"
                className="cursor-pointer text-sm text-gray-400 flex items-center gap-2"
              >
                <File className="w-4 h-4" />

                {thumbnail ? thumbnail.name : "Choose File"}
              </label>
            </div>

            {errors.thumbnail && (
              <p className="mt-1 text-xs text-red-400">
                {errors.thumbnail}
              </p>
            )}
          </div>

          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Film File
            </label>

            <div
              className={`border rounded-xl px-4 py-3 bg-black/40 ${
                errors.filmFile
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-cyan-500/20"
              }`}
            >
              <input
                type="file"
                id="film-upload"
                accept="video/*,.mp4,.mov,.webm,.avi,.mkv"
                className="hidden"
                onChange={(e) => {
                  setFilmFile(e.target.files?.[0] || null);

                  setErrors((prev) => ({
                    ...prev,
                    filmFile: "",
                  }));
                }}
              />

              <label
                htmlFor="film-upload"
                className="cursor-pointer text-sm text-gray-400 flex items-center gap-2"
              >
                <File className="w-4 h-4" />

                {filmFile ? filmFile.name : "Choose File"}
              </label>
            </div>

            {errors.filmFile && (
              <p className="mt-1 text-xs text-red-400">
                {errors.filmFile}
              </p>
            )}
          </div>

          {message && (
            <p
              className={`mt-6 text-sm font-semibold border rounded-xl px-4 py-3 ${
                messageType === "success"
                  ? "text-green-400 bg-green-500/10 border-green-500/30"
                  : "text-red-400 bg-red-500/10 border-red-500/30"
              }`}
            >
              {message}
            </p>
          )}

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