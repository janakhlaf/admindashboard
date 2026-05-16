import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film as FilmIcon } from "lucide-react";
import { toast } from "sonner";
import { type Film, formatDate, formatBytes } from "@/lib/index";
import {
  getFilms,
  approveFilm,
  rejectFilm,
  deleteFilm,
  updateFilm,
} from "@/api/films";
import {
  StatusBadge,
  NeonButton,
  PageHeader,
  SearchInput,
} from "@/components/NexusUI";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type AdminFilm = Film & {
  description?: string;
  price?: number;
  sourceType?: string;
};

export default function Films() {
  const [films, setFilms] = useState<AdminFilm[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    filmId: null as string | null,
  });

  const [editFilm, setEditFilm] = useState<AdminFilm | null>(null);

  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    description: "",
    price: 0,
  });

  useEffect(() => {
    fetchFilms();
  }, []);

  const fetchFilms = async () => {
    try {
      const data = await getFilms();

      const mappedFilms: AdminFilm[] = data.map((film: any) => {
        const isAdminFilm = film.source_type === "admin";

        return {
          id: String(film.id),
          title: film.title || "Untitled Film",
          category: film.category || "Uncategorized",
          uploader: isAdminFilm ? "Admin" : `User ${film.user_id ?? ""}`,
          uploadDate:
            film.created_at ||
            film.upload_date ||
            new Date().toISOString(),
          size: Number(film.file_size) || 0,
          status: film.status || "pending",
          thumbnail:
            film.posterUrl ||
            film.poster_url ||
            film.thumbnail_url ||
            "",
          description: film.description || "",
          price: Number(film.price) || 0,
          sourceType: film.source_type || "user",
        };
      });

      setFilms(mappedFilms);
    } catch {
      toast.error("Failed to load films");
    }
  };

  const filteredFilms = films.filter((film) => {
    const matchesStatus =
      statusFilter === "all" || film.status === statusFilter;

    const matchesSearch = film.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleApprove = async (filmId: string) => {
    try {
      await approveFilm(Number(filmId));

      setFilms((prev) =>
        prev.map((film) =>
          film.id === filmId ? { ...film, status: "approved" as const } : film
        )
      );

      toast.success("Film approved successfully");
    } catch {
      toast.error("Failed to approve film");
    }
  };

  const handleReject = async (filmId: string) => {
    try {
      await rejectFilm(Number(filmId));

      setFilms((prev) =>
        prev.map((film) =>
          film.id === filmId ? { ...film, status: "rejected" as const } : film
        )
      );

      toast.success("Film rejected successfully");
    } catch {
      toast.error("Failed to reject film");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.filmId) return;

    try {
      await deleteFilm(Number(deleteDialog.filmId));

      setFilms((prev) =>
        prev.filter((film) => film.id !== deleteDialog.filmId)
      );

      toast.success("Film deleted permanently");

      setDeleteDialog({
        open: false,
        filmId: null,
      });
    } catch {
      toast.error("Failed to delete film");
    }
  };

  const openEditDialog = (film: AdminFilm) => {
    setEditFilm(film);

    setEditForm({
      title: film.title || "",
      category: film.category || "",
      description: film.description || "",
      price: film.price || 0,
    });
  };

  const handleUpdateFilm = async () => {
    if (!editFilm) return;

    try {
      await updateFilm(Number(editFilm.id), editForm);

      toast.success("Film updated successfully");

      setEditFilm(null);
      fetchFilms();
    } catch {
      toast.error("Failed to update film");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <div className="min-h-screen p-8 nexus-grid-bg">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader title="Film Management" />

        <div className="glass-card rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search films by title..."
              />
            </div>

            <Tabs
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <TabsList className="bg-background/50">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {filteredFilms.length > 0 ? (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {filteredFilms.map((film) => (
                <motion.div key={film.id} variants={itemVariants}>
                  <div className="glass-card rounded-xl overflow-hidden group hover:neon-border-purple transition-all duration-300">
                    <div className="aspect-[6/9] relative overflow-hidden bg-black">
                      {film.thumbnail ? (
                        <img
                          src={film.thumbnail}
                          alt={film.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FilmIcon className="w-16 h-16 text-primary/50" />
                        </div>
                      )}

                      <div className="absolute top-3 right-3">
                        <StatusBadge status={film.status} />
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2 line-clamp-1">
                          {film.title}
                        </h3>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {film.category}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground font-jetbrains">
                        <div className="flex items-center justify-between">
                          <span>Uploader:</span>
                          <span className="font-medium text-foreground">
                            {film.uploader}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>Source:</span>
                          <span className="font-medium text-foreground">
                            {film.sourceType}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>Uploaded:</span>
                          <span className="text-xs">
                            {formatDate(film.uploadDate)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>Size:</span>
                          <span className="text-xs">
                            {formatBytes(film.size)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        {film.status === "pending" && (
                          <>
                            <NeonButton
                              variant="approve"
                              size="sm"
                              onClick={() => handleApprove(film.id)}
                              className="flex-1"
                            >
                              Approve
                            </NeonButton>

                            <NeonButton
                              variant="reject"
                              size="sm"
                              onClick={() => handleReject(film.id)}
                              className="flex-1"
                            >
                              Reject
                            </NeonButton>
                          </>
                        )}

                        {film.sourceType === "admin" && (
                          <NeonButton
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditDialog(film)}
                          >
                            Edit
                          </NeonButton>
                        )}

                        <NeonButton
                          variant="delete"
                          size="sm"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              filmId: film.id,
                            })
                          }
                        >
                          Delete
                        </NeonButton>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="glass-card rounded-xl p-12 text-center"
            >
              <FilmIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />

              <h3 className="text-xl font-semibold mb-2">No films found</h3>

              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "No films match the selected filters"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() =>
          setDeleteDialog({
            open: false,
            filmId: null,
          })
        }
        onConfirm={handleDelete}
        title="Delete Film"
        description="Are you sure you want to permanently delete this film? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />

      {editFilm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-xl w-full max-w-md space-y-4">
            <h2 className="text-2xl font-bold">Edit Film</h2>

            <input
              type="text"
              placeholder="Title"
              value={editForm.title}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  title: e.target.value,
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
                onClick={handleUpdateFilm}
              >
                Save
              </NeonButton>

              <NeonButton
                variant="reject"
                className="flex-1"
                onClick={() => setEditFilm(null)}
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