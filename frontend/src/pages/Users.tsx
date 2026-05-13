import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Box, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, type User, type Film as FilmType, type Asset } from "@/lib/index";
import { mockUsers, mockFilms, mockAssets } from "@/data/index";
import { PageHeader, SearchInput, StatusBadge, NeonButton } from "@/components/NexusUI";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// ── Types ─────────────────────────────────────────────────────────────────────
type ContentStatus = "pending" | "approved" | "rejected";

interface FilmState extends FilmType {
  _status: ContentStatus;
}
interface AssetState extends Asset {
  _status: ContentStatus;
}

// ── Animation variants ─────────────────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.06 },
  }),
};

const contentVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto", transition: { duration: 0.25 } },
};

// ── Helper: get content uploaded by a user ────────────────────────────────────
function getUserContent(
  userName: string,
  films: FilmState[],
  assets: AssetState[]
) {
  return {
    films: films.filter((f) => f.uploader === userName),
    assets: assets.filter((a) => a.uploader === userName),
    total:
      films.filter((f) => f.uploader === userName).length +
      assets.filter((a) => a.uploader === userName).length,
  };
}

// ── Content thumbnail placeholder ─────────────────────────────────────────────
function ContentThumb({
  type,
  thumbnail,
  title,
}: {
  type: "film" | "asset";
  thumbnail?: string;
  title: string;
}) {
  if (thumbnail) {
    return (
      <img
        src={thumbnail}
        alt={title}
        className="w-14 h-14 rounded-lg object-cover border border-border/30 flex-shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className={cn(
        "w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 border",
        type === "film"
          ? "bg-primary/10 border-primary/30"
          : "bg-accent/10 border-accent/30"
      )}
    >
      {type === "film" ? (
        <Film className="w-6 h-6 text-primary" />
      ) : (
        <Box className="w-6 h-6 text-accent" />
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Users() {
  const [users] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // Film & asset states with overridable status
  const [films, setFilms] = useState<FilmState[]>(() =>
    mockFilms.map((f) => ({ ...f, _status: f.status as ContentStatus }))
  );
  const [assets, setAssets] = useState<AssetState[]>(() =>
    mockAssets.map((a) => ({ ...a, _status: a.status as ContentStatus }))
  );

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "film" | "asset";
    id: string;
    title: string;
  } | null>(null);

  // ── Filter users by search ────────────────────────────────────────────────
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Toggle user row expansion ─────────────────────────────────────────────
  const toggleExpand = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  // ── Moderation actions on content ─────────────────────────────────────────
  const handleFilmApprove = (id: string) => {
    setFilms((prev) =>
      prev.map((f) => (f.id === id ? { ...f, _status: "approved" } : f))
    );
    toast.success("Film approved");
  };
  const handleFilmReject = (id: string) => {
    setFilms((prev) =>
      prev.map((f) => (f.id === id ? { ...f, _status: "rejected" } : f))
    );
    toast.error("Film rejected");
  };
  const handleAssetApprove = (id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, _status: "approved" } : a))
    );
    toast.success("Asset approved");
  };
  const handleAssetReject = (id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, _status: "rejected" } : a))
    );
    toast.error("Asset rejected");
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "film") {
      setFilms((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    } else {
      setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    }
    toast.success(`"${deleteTarget.title}" deleted`);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen w-full p-8 nexus-grid-bg">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title="User Management" />

        {/* Search bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="max-w-sm w-full">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name or email…"
            />
          </div>
          <span className="text-sm font-jetbrains text-muted-foreground whitespace-nowrap">
            {filteredUsers.length}{" "}
            {filteredUsers.length === 1 ? "user" : "users"}
          </span>
        </div>

        {/* User cards */}
        <div className="space-y-4">
          {filteredUsers.map((user, i) => {
            const { films: userFilms, assets: userAssets, total } = getUserContent(
              user.name,
              films,
              assets
            );
            const isExpanded = expandedUsers.has(user.id);
            const hasContent = total > 0;

            return (
              <motion.div
                key={user.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="glass-card rounded-2xl overflow-hidden"
              >
                {/* ── User identity row ── */}
                <div className="flex items-center gap-5 px-6 py-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full border-2 border-primary/25 object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = "none";
                        const fb = img.nextElementSibling as HTMLElement;
                        if (fb) fb.style.display = "flex";
                      }}
                    />
                    <div
                      className="w-12 h-12 rounded-full border-2 border-primary/25 bg-primary/10 items-center justify-center"
                      style={{ display: "none" }}
                    >
                      <span className="text-primary font-bold text-sm">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="min-w-0 w-48 flex-shrink-0">
                    <p className="font-semibold text-foreground truncate">
                      {user.name}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground font-mono truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* Content count + expand toggle */}
                  {hasContent && (
                    <button
                      onClick={() => toggleExpand(user.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium font-jetbrains",
                        "border transition-all duration-200 flex-shrink-0",
                        isExpanded
                          ? "border-primary/60 text-primary bg-primary/10"
                          : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary"
                      )}
                    >
                      {total} upload{total !== 1 ? "s" : ""}
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  {!hasContent && (
                    <span className="text-xs font-jetbrains text-muted-foreground/50 flex-shrink-0">
                      No uploads
                    </span>
                  )}
                </div>

                {/* ── Uploaded content (expandable) ── */}
                <AnimatePresence initial={false}>
                  {isExpanded && hasContent && (
                    <motion.div
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/30 px-6 pb-4 pt-4 space-y-3">
                        <p className="text-xs font-jetbrains text-muted-foreground uppercase tracking-widest mb-3">
                          Uploaded Content
                        </p>

                        {/* Films uploaded by this user */}
                        {userFilms.map((film) => (
                          <div
                            key={film.id}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                              film._status === "pending"
                                ? "border-primary/30 bg-primary/5"
                                : "border-border/20 bg-card/20"
                            )}
                          >
                            {/* Thumbnail */}
                            <ContentThumb
                              type="film"
                              thumbnail={film.thumbnail}
                              title={film.title}
                            />

                            {/* Content info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-foreground text-sm truncate">
                                  {film.title}
                                </span>
                                {/* Type tag */}
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary border border-primary/40 flex-shrink-0">
                                  Film
                                </span>
                                {/* Status tag */}
                                <StatusBadge status={film._status} />
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {film.description}
                              </p>
                              <p className="text-xs font-jetbrains text-muted-foreground/60 mt-0.5">
                                {formatDate(film.uploadDate)}
                              </p>
                            </div>

                            {/* Moderation actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <NeonButton
                                variant="approve"
                                size="sm"
                                onClick={() => handleFilmApprove(film.id)}
                                disabled={film._status !== "pending"}
                              >
                                Approve
                              </NeonButton>
                              <NeonButton
                                variant="reject"
                                size="sm"
                                onClick={() => handleFilmReject(film.id)}
                                disabled={film._status !== "pending"}
                              >
                                Reject
                              </NeonButton>
                              <NeonButton
                                variant="delete"
                                size="sm"
                                onClick={() =>
                                  setDeleteTarget({
                                    kind: "film",
                                    id: film.id,
                                    title: film.title,
                                  })
                                }
                              >
                                Delete
                              </NeonButton>
                            </div>
                          </div>
                        ))}

                        {/* Assets uploaded by this user */}
                        {userAssets.map((asset) => (
                          <div
                            key={asset.id}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                              asset._status === "pending"
                                ? "border-accent/30 bg-accent/5"
                                : "border-border/20 bg-card/20"
                            )}
                          >
                            {/* Thumbnail */}
                            <ContentThumb
                              type="asset"
                              title={asset.name}
                            />

                            {/* Content info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-foreground text-sm truncate">
                                  {asset.name}
                                </span>
                                {/* Type tag */}
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent/20 text-accent border border-accent/40 flex-shrink-0">
                                  Asset
                                </span>
                                {/* Status tag */}
                                <StatusBadge status={asset._status} />
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {asset.category} · {asset.format} ·{" "}
                                {asset.polygons.toLocaleString()} polygons
                              </p>
                              <p className="text-xs font-jetbrains text-muted-foreground/60 mt-0.5">
                                {formatDate(asset.uploadDate)}
                              </p>
                            </div>

                            {/* Moderation actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <NeonButton
                                variant="approve"
                                size="sm"
                                onClick={() => handleAssetApprove(asset.id)}
                                disabled={asset._status !== "pending"}
                              >
                                Approve
                              </NeonButton>
                              <NeonButton
                                variant="reject"
                                size="sm"
                                onClick={() => handleAssetReject(asset.id)}
                                disabled={asset._status !== "pending"}
                              >
                                Reject
                              </NeonButton>
                              <NeonButton
                                variant="delete"
                                size="sm"
                                onClick={() =>
                                  setDeleteTarget({
                                    kind: "asset",
                                    id: asset.id,
                                    title: asset.name,
                                  })
                                }
                              >
                                Delete
                              </NeonButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No users found</p>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.kind === "film" ? "Film" : "Asset"}`}
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
