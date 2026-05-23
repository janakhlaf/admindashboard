import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { File } from "lucide-react";

const API_URL = "http://localhost:8000";

const ASSET_TAGS = [
  "realistic", "cartoon", "stylized", "lowpoly", "scifi", "fantasy",
  "cyberpunk", "medieval", "character", "humanoid", "monster", "animal",
  "boy", "girl", "robot", "mech", "machine", "drone", "vehicle", "car",
  "aircraft", "racing", "environment", "city", "nature", "forest",
  "interior", "architecture", "building", "urban", "prop", "weapon",
  "food", "furniture", "campfire", "animated", "rigged" ,"infrastructure", "game-ready",
];

const ASSET_EXTENSIONS = ["glb", "gltf"];

const UploadAsset = () => {
  const [assetName, setAssetName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const inputClass = (key: string) =>
    `w-full bg-black/40 border rounded-xl px-4 py-3 outline-none ${
      errors[key]
        ? "border-red-500 ring-1 ring-red-500"
        : "border-cyan-500/20 focus:border-cyan-400"
    }`;

  const clearError = (key: string) => {
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleAddTag = (tag: string) => {
    if (!tag) return;

    if (!selectedTags.includes(tag) && selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
      clearError("tags");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!assetName.trim()) newErrors.assetName = "Asset name is required";
    if (!category.trim()) newErrors.category = "Category is required";
    if (!description.trim()) newErrors.description = "Description is required";

    if (!price || Number(price) <= 0) {
      newErrors.price = "Price is required";
    }

    if (selectedTags.length !== 3) {
      newErrors.tags = "You must select exactly 3 tags";
    }

    if (!file) {
      newErrors.file = "Asset file is required";
    } else {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (!ext || !ASSET_EXTENSIONS.includes(ext)) {
        newErrors.file = "Only GLB or GLTF files are allowed";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUploadAsset = async () => {
    setMessage("");

    if (!validateForm()) return;

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("name", assetName);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("price", String(Number(price)));
      formData.append("tags", JSON.stringify(selectedTags));

      if (file) formData.append("file", file);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("You must be logged in");
      }

      const response = await fetch(`${API_URL}/admin/assets/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch((): null => null);
        throw new Error(errorData?.detail || "Failed to upload asset");
      }

      setAssetName("");
      setCategory("");
      setDescription("");
      setPrice("");
      setFile(null);
      setSelectedTags([]);
      setErrors({});

      setMessageType("success");
      setMessage("Asset uploaded successfully to Storage and Database.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading asset."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Upload Asset</h1>

        <p className="text-gray-400 mb-10">
          Upload and publish new marketplace assets directly from the admin dashboard.
        </p>

        <div className="bg-[#07111f]/80 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-sm text-cyan-300">
                Asset Name
              </label>

              <input
                type="text"
                value={assetName}
                onChange={(e) => {
                  setAssetName(e.target.value);
                  clearError("assetName");
                }}
                placeholder="Enter asset name"
                className={inputClass("assetName")}
              />

              {errors.assetName && (
                <p className="mt-1 text-xs text-red-400">{errors.assetName}</p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm text-cyan-300">
                Category
              </label>

              <input
                type="text"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  clearError("category");
                }}
                placeholder="Environment / Character / Props..."
                className={inputClass("category")}
              />

              {errors.category && (
                <p className="mt-1 text-xs text-red-400">{errors.category}</p>
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
                clearError("description");
              }}
              placeholder="Describe the asset..."
              rows={5}
              className={inputClass("description")}
            />

            {errors.description && (
              <p className="mt-1 text-xs text-red-400">{errors.description}</p>
            )}
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

              {ASSET_TAGS.map((tag) => (
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
              <p className="mt-1 text-xs text-red-400">{errors.tags}</p>
            )}
          </div>

          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Price
            </label>

            <input
              type="number"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                clearError("price");
              }}
              placeholder="Enter asset price"
              className={inputClass("price")}
            />

            {errors.price && (
              <p className="mt-1 text-xs text-red-400">{errors.price}</p>
            )}
          </div>

          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Asset File
            </label>

            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center bg-black/30 ${
                errors.file
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-cyan-500/20"
              }`}
            >
              <input
                type="file"
                id="asset-upload"
                accept=".glb,.gltf"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  clearError("file");
                }}
                className="hidden"
              />

              <label
                htmlFor="asset-upload"
                className="cursor-pointer text-sm text-gray-400 flex items-center justify-center gap-2"
              >
                <File className="w-4 h-4" />
                {file ? file.name : "Choose File"}
              </label>
            </div>

            {errors.file && (
              <p className="mt-1 text-xs text-red-400">{errors.file}</p>
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
              onClick={handleUploadAsset}
              disabled={loading}
              className="bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-8 py-3 rounded-xl transition-all duration-200"
            >
              {loading ? "Uploading..." : "Upload Asset"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadAsset;