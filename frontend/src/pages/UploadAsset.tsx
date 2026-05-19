import { useState } from "react";

const API_URL = "http://localhost:8000";

const ASSET_TAGS = [
  "realistic", "cartoon", "stylized", "lowpoly", "scifi", "fantasy",
  "cyberpunk", "medieval", "character", "humanoid", "monster", "animal",
  "boy", "girl", "robot", "mech", "machine", "drone", "vehicle", "car",
  "aircraft", "racing", "environment", "city", "nature", "forest",
  "interior", "architecture", "building", "urban", "prop", "weapon",
  "food", "furniture", "campfire", "animated", "rigged", "game-ready",
];

const UploadAsset = () => {
  const [assetName, setAssetName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  const handleUploadAsset = async () => {
    if (!assetName.trim()) {
      setMessage("Asset name is required");
      return;
    }

    if (!file) {
      setMessage("Asset file is required");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("name", assetName);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("price", price ? String(Number(price)) : "0");
      formData.append("tags", JSON.stringify(selectedTags));
      formData.append("file", file);

      const response = await fetch(`${API_URL}/admin/assets/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to upload asset");
      }

      setAssetName("");
      setCategory("");
      setDescription("");
      setPrice("");
      setFile(null);
      setSelectedTags([]);

      setMessage("Asset uploaded successfully to Storage and Database.");
    } catch (error) {
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
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="Enter asset name"
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-cyan-300">
                Category
              </label>

              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Environment / Character / Props..."
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the asset..."
              rows={5}
              className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>

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

            {selectedTags.length >= 3 && (
              <p className="text-xs text-gray-400 mt-2">
                Maximum 3 tags selected
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
              placeholder="Enter asset price"
              className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>

          <div className="mt-6">
            <label className="block mb-2 text-sm text-cyan-300">
              Asset File
            </label>

            <div className="border-2 border-dashed border-cyan-500/20 rounded-2xl p-10 text-center bg-black/30">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm text-gray-400"
              />

              {file && (
                <p className="mt-3 text-sm text-gray-400">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>

          {message && <p className="mt-6 text-sm text-cyan-300">{message}</p>}

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