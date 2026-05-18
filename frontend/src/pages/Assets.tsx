import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box } from "lucide-react";
import "@google/model-viewer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import {
  Asset,
  formatDate,
  formatBytes,
  formatCurrency,
  cn,
} from "@/lib/index";

import {
  getAssets,
  approveAsset,
  rejectAsset,
  deleteAsset,
  updateAsset,
} from "@/api/assets";

import {
  StatusBadge,
  NeonButton,
  PageHeader,
  SearchInput,
} from "@/components/NexusUI";

import { ConfirmDialog } from "@/components/ConfirmDialog";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": any;
    }
  }
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

type AdminAsset = Asset & {
  preview?: string;
  fileType?: string;
  description?: string;
  sourceType?: string;
};

function AssetViewer({ url }: { url?: string; name: string }) {
  if (!url) {
    return <Box className="w-24 h-24 neon-text-purple" />;
  }

  return (
    <model-viewer
      src={url}
      camera-controls
      auto-rotate
      autoplay
      shadow-intensity="1"
      exposure="1.2"
      environment-image="neutral"
      camera-orbit="0deg 75deg 105%"
      min-camera-orbit="auto auto 20%"
      max-camera-orbit="auto auto 300%"
      field-of-view="30deg"
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#020617",
      }}
    />
  );
}

export default function Assets() {
  const [assets, setAssets] = useState<AdminAsset[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AdminAsset | null>(null);
  const [editAsset, setEditAsset] = useState<AdminAsset | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    description: "",
    price: 0,
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const data = await getAssets();

      const mappedAssets: AdminAsset[] = data.map((asset: any) => {
        const isAdminAsset = asset.source_type === "admin_upload";

        return {
          id: String(asset.id),
          name: asset.name || "Untitled Asset",
          category: asset.category || "Uncategorized",
          price: Number(asset.price) || 0,
          status: asset.status || "pending",
          uploader: isAdminAsset ? "Admin" : `User ${asset.user_id ?? ""}`,
          uploadDate: new Date().toISOString(),
          fileSize: Number(asset.file_size) || 0,
          polygons: 0,
          preview: asset.preview_url || "",
          fileType: asset.file_type || "file",
          description: asset.description || "",
          sourceType: isAdminAsset ? "Admin Upload" : "User Upload",
        };
      });

      setAssets(mappedAssets);
    } catch {
      toast.error("Failed to load assets");
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesStatus =
        statusFilter === "all" || asset.status === statusFilter;

      const matchesSearch = asset.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [assets, statusFilter, searchQuery]);

  const handleApprove = async (assetId: string) => {
    try {
      await approveAsset(Number(assetId));

      setAssets((prev) =>
        prev.map((asset) =>
          asset.id === assetId
            ? { ...asset, status: "approved" as const }
            : asset
        )
      );

      toast.success("Asset approved successfully");
    } catch {
      toast.error("Failed to approve asset");
    }
  };

  const handleReject = async (assetId: string) => {
    try {
      await rejectAsset(Number(assetId));

      setAssets((prev) =>
        prev.map((asset) =>
          asset.id === assetId
            ? { ...asset, status: "rejected" as const }
            : asset
        )
      );

      toast.error("Asset rejected");
    } catch {
      toast.error("Failed to reject asset");
    }
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;

    try {
      await deleteAsset(Number(selectedAsset.id));

      setAssets((prev) =>
        prev.filter((asset) => asset.id !== selectedAsset.id)
      );

      toast.success(`${selectedAsset.name} deleted`);
      setDeleteDialogOpen(false);
      setSelectedAsset(null);
    } catch {
      toast.error("Failed to delete asset");
    }
  };

  const openDeleteDialog = (asset: AdminAsset) => {
    setSelectedAsset(asset);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (asset: AdminAsset) => {
    setEditAsset(asset);

    setEditForm({
      name: asset.name || "",
      category: asset.category || "",
      description: asset.description || "",
      price: asset.price || 0,
    });
  };

  const handleUpdateAsset = async () => {
    if (!editAsset) return;

    try {
      await updateAsset(Number(editAsset.id), editForm);

      toast.success("Asset updated successfully");
      setEditAsset(null);
      fetchAssets();
    } catch {
      toast.error("Failed to update asset");
    }
  };

  return (
    <div className="min-h-screen bg-background nexus-grid-bg p-6 ml-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader title="Asset Management" />

        <div className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search assets by name..."
          />
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          className="mb-8"
        >
          <TabsList className="glass-card">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <div
                  className={cn(
                    "glass-card overflow-hidden transition-all duration-300 hover:scale-[1.02]",
                    "hover:border-neon-cyan"
                  )}
                >
                  <div className="aspect-square bg-space-navy flex items-center justify-center relative overflow-hidden">
                    <AssetViewer url={asset.preview} name={asset.name} />

                    <div className="absolute top-3 right-3">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/30 text-xs"
                      >
                        {asset.fileType}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 truncate">
                      {asset.name}
                    </h3>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {asset.category}
                      </Badge>

                      <span className="font-jetbrains text-sm font-semibold neon-text-cyan">
                        {formatCurrency(asset.price)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground mb-3 font-jetbrains">
                      <div>{formatBytes(asset.fileSize)}</div>
                      <div>{asset.polygons.toLocaleString()} polygons</div>
                    </div>

                    <div className="mb-3">
                      <StatusBadge status={asset.status} />
                    </div>

                    <div className="text-xs text-muted-foreground mb-4 font-jetbrains">
                      <div>Uploader: {asset.uploader}</div>
                      <div>Source: {asset.sourceType}</div>
                      <div>{formatDate(asset.uploadDate)}</div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {asset.status === "pending" && (
                        <div className="flex gap-2">
                          <NeonButton
                            variant="approve"
                            size="sm"
                            onClick={() => handleApprove(asset.id)}
                            className="flex-1"
                          >
                            Approve
                          </NeonButton>

                          <NeonButton
                            variant="reject"
                            size="sm"
                            onClick={() => handleReject(asset.id)}
                            className="flex-1"
                          >
                            Reject
                          </NeonButton>
                        </div>
                      )}

                      {asset.sourceType === "Admin Upload" && (
                        <NeonButton
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditDialog(asset)}
                          className="w-full"
                        >
                          Edit
                        </NeonButton>
                      )}

                      <NeonButton
                        variant="delete"
                        size="sm"
                        onClick={() => openDeleteDialog(asset)}
                        className="w-full"
                      >
                        Delete
                      </NeonButton>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredAssets.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Box className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No assets found</p>
          </motion.div>
        )}
      </motion.div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedAsset(null);
        }}
        onConfirm={handleDelete}
        title="Delete Asset"
        description={`Are you sure you want to delete "${selectedAsset?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
      />

      {editAsset && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-xl w-full max-w-md space-y-4">
            <h2 className="text-2xl font-bold">Edit Asset</h2>

            <input
              type="text"
              placeholder="Name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  name: e.target.value,
                })
              }
              className="w-full p-3 rounded-lg bg-background border border-border"
            />

            <input
              type="text"
              placeholder="Category"
              value={editForm.category}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  category: e.target.value,
                })
              }
              className="w-full p-3 rounded-lg bg-background border border-border"
            />

            <textarea
              placeholder="Description"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  description: e.target.value,
                })
              }
              className="w-full p-3 rounded-lg bg-background border border-border min-h-[100px]"
            />

            <input
              type="number"
              placeholder="Price"
              value={editForm.price}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  price: Number(e.target.value),
                })
              }
              className="w-full p-3 rounded-lg bg-background border border-border"
            />

            <div className="flex gap-3">
              <NeonButton
                variant="approve"
                className="flex-1"
                onClick={handleUpdateAsset}
              >
                Save
              </NeonButton>

              <NeonButton
                variant="reject"
                className="flex-1"
                onClick={() => setEditAsset(null)}
              >
                Cancel
              </NeonButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}