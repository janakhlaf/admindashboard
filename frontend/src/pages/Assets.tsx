import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box } from "lucide-react";
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
import { mockAssets } from "@/data/index";
import {
  StatusBadge,
  NeonButton,
  PageHeader,
  SearchInput,
} from "@/components/NexusUI";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const ASSET_CATEGORIES = [
  "Character",
  "Environment",
  "Vehicle",
  "Prop",
  "Architecture",
  "Creature",
];

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

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

  const handleApprove = (assetId: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, status: "approved" } : a))
    );
    toast.success("Asset approved successfully");
  };

  const handleReject = (assetId: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, status: "rejected" } : a))
    );
    toast.error("Asset rejected");
  };

  const handleDelete = () => {
    if (selectedAsset) {
      setAssets((prev) => prev.filter((a) => a.id !== selectedAsset.id));
      toast.success(`${selectedAsset.name} deleted`);
      setDeleteDialogOpen(false);
      setSelectedAsset(null);
    }
  };

  const openDeleteDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setDeleteDialogOpen(true);
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
                  <div className="aspect-square bg-space-navy flex items-center justify-center relative">
                    <Box className="w-24 h-24 neon-text-purple" />
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/30 text-xs"
                      >
                        GLB
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
                      <div>{asset.uploader}</div>
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

    </div>
  );
}