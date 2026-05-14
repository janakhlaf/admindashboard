import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Box, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import {
  cn,
  formatDate,
  type User,
  type Film as FilmType,
  type Asset,
} from "@/lib/index";

import { mockFilms, mockAssets } from "@/data/index";
import { getUsers } from "@/api/users";

import {
  PageHeader,
  SearchInput,
  StatusBadge,
  NeonButton,
} from "@/components/NexusUI";

import { ConfirmDialog } from "@/components/ConfirmDialog";

// ── Types ─────────────────────────────────────────────────────────────────────
type ContentStatus = "pending" | "approved" | "rejected";

interface FilmState extends FilmType {
  _status: ContentStatus;
}

interface AssetState extends Asset {
  _status: ContentStatus;
}

// ── Animation variants ────────────────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 20 },

  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      delay: i * 0.06,
    },
  }),
};

const contentVariants = {
  hidden: {
    opacity: 0,
    height: 0,
  },

  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.25,
    },
  },
};

// ── Helper ────────────────────────────────────────────────────────────────────
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

// ── Thumbnail ────────────────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
export default function Users() {
  // REAL USERS FROM BACKEND
  const [users, setUsers] = useState<User[]>([]);

  const [searchQuery, setSearchQuery] = useState("");

  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(
    new Set()
  );

  // FILMS
  const [films, setFilms] = useState<FilmState[]>(() =>
    mockFilms.map((f) => ({
      ...f,
      _status: f.status as ContentStatus,
    }))
  );

  // ASSETS
  const [assets, setAssets] = useState<AssetState[]>(() =>
    mockAssets.map((a) => ({
      ...a,
      _status: a.status as ContentStatus,
    }))
  );

  // DELETE CONFIRM
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "film" | "asset";
    id: string;
    title: string;
  } | null>(null);

  // ── FETCH USERS ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();

      const mappedUsers: User[] = data.map((user: any) => ({
        id: String(user.id),

        name: user.name || `User ${user.id}`,

        email: user.email,

        avatar: user.avatar_url || "",

        role: "user",

        joinDate: new Date().toISOString(),

        status: "active",
      }));

      setUsers(mappedUsers);
    } catch {
      toast.error("Failed to load users");
    }
  };

  // ── FILTER USERS ───────────────────────────────────────────────────────────
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── TOGGLE EXPAND ──────────────────────────────────────────────────────────
  const toggleExpand = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);

      next.has(userId)
        ? next.delete(userId)
        : next.add(userId);

      return next;
    });
  };

  // ── FILM ACTIONS ───────────────────────────────────────────────────────────
  const handleFilmApprove = (id: string) => {
    setFilms((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, _status: "approved" }
          : f
      )
    );

    toast.success("Film approved");
  };

  const handleFilmReject = (id: string) => {
    setFilms((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, _status: "rejected" }
          : f
      )
    );

    toast.error("Film rejected");
  };

  // ── ASSET ACTIONS ──────────────────────────────────────────────────────────
  const handleAssetApprove = (id: string) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, _status: "approved" }
          : a
      )
    );

    toast.success("Asset approved");
  };

  const handleAssetReject = (id: string) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, _status: "rejected" }
          : a
      )
    );

    toast.error("Asset rejected");
  };

  // ── DELETE ─────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.kind === "film") {
      setFilms((prev) =>
        prev.filter((f) => f.id !== deleteTarget.id)
      );
    } else {
      setAssets((prev) =>
        prev.filter((a) => a.id !== deleteTarget.id)
      );
    }

    toast.success(`"${deleteTarget.title}" deleted`);

    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen w-full p-8 nexus-grid-bg">
      <div className="max-w-7xl mx-auto space-y-6">

        <PageHeader title="User Management" />

        {/* SEARCH */}
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
            {filteredUsers.length === 1
              ? "user"
              : "users"}
          </span>
        </div>

        {/* USERS */}
        <div className="space-y-4">

          {filteredUsers.map((user, i) => {

            const {
              films: userFilms,
              assets: userAssets,
              total,
            } = getUserContent(
              user.name,
              films,
              assets
            );

            const isExpanded =
              expandedUsers.has(user.id);

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

                {/* USER ROW */}
                <div className="flex items-center gap-5 px-6 py-4">

                  {/* AVATAR */}
                  <div className="flex-shrink-0">

                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full border-2 border-primary/25 object-cover"
                      onError={(e) => {
                        const img =
                          e.target as HTMLImageElement;

                        img.style.display = "none";

                        const fb =
                          img.nextElementSibling as HTMLElement;

                        if (fb)
                          fb.style.display = "flex";
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

                  {/* NAME */}
                  <div className="min-w-0 w-48 flex-shrink-0">
                    <p className="font-semibold text-foreground truncate">
                      {user.name}
                    </p>
                  </div>

                  {/* EMAIL */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground font-mono truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* TOGGLE */}
                  {hasContent ? (
                    <button
                      onClick={() =>
                        toggleExpand(user.id)
                      }
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium font-jetbrains border transition-all duration-200 flex-shrink-0",

                        isExpanded
                          ? "border-primary/60 text-primary bg-primary/10"
                          : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary"
                      )}
                    >
                      {total} upload
                      {total !== 1 ? "s" : ""}

                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="text-xs font-jetbrains text-muted-foreground/50 flex-shrink-0">
                      No uploads
                    </span>
                  )}
                </div>

                {/* EXPANDED CONTENT */}
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

                      </div>

                    </motion.div>
                  )}

                </AnimatePresence>

              </motion.div>
            );
          })}
        </div>

        {/* EMPTY */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No users found
            </p>
          </div>
        )}
      </div>

      {/* DELETE DIALOG */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${
          deleteTarget?.kind === "film"
            ? "Film"
            : "Asset"
        }`}
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}