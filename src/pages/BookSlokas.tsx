import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ArrowLeft, Search, ScrollText, ChevronRight, BookOpen, Eye, Lock, Users, Pencil, X,
} from "lucide-react";
import { CreateSlokaModal } from "@/components/sloka/CreateSlokaModal";
import { GradientButton } from "@/components/ui/gradient-button";
import { VisibilitySelector } from "@/components/ui/VisibilitySelector";
import { Visibility } from "@/types/sloka";
import { useBookDetailQuery, useUpdateBookMutation } from "@/lib/api/endpoints/books";
import { useShloksByBookQuery, useCreateShlokMutation } from "@/lib/api/endpoints/shloks";
import {
  useEntityPermissionsQuery,
  useSetEntityPermissionMutation,
  useRevokeEntityPermissionMutation,
} from "@/lib/api/endpoints/entityPermissions";
import { useCurrentUserQuery } from "@/lib/api/endpoints/auth";
import type { ShlokResponse, SharedUserPermission, PermissionLevel } from "@/types";

const visIcon: Record<string, typeof Eye> = {
  public: Eye,
  private: Lock,
  specific_users: Users,
};

const visColor: Record<string, string> = {
  public: "text-success",
  private: "text-muted-foreground",
  specific_users: "text-accent",
};

function getShlokLabel(shlok: ShlokResponse): string {
  if (shlok.chapter_number != null && shlok.verse_number != null) {
    return `Chapter ${shlok.chapter_number}, Verse ${shlok.verse_number}`;
  }
  if (shlok.chapter_number != null) {
    return `Chapter ${shlok.chapter_number}`;
  }
  const preview = shlok.content.slice(0, 60);
  return shlok.content.length > 60 ? `${preview}…` : preview;
}

export default function BookSlokas() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [bookVisibility, setBookVisibility] = useState<Visibility>("public");
  // Edit book form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAuthorName, setEditAuthorName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSource, setEditSource] = useState("");

  const { data: bookData, isLoading: bookLoading, isError: bookError } = useBookDetailQuery(bookId ?? "");
  const { data: shloksData, isLoading: shloksLoading } = useShloksByBookQuery(bookId ?? "");
  const createShlokMutation = useCreateShlokMutation();
  const updateBookMutation = useUpdateBookMutation();

  const { data: currentUserData } = useCurrentUserQuery();
  const currentUserId = currentUserData?.data?.id;

  const book = bookData?.data ?? null;
  const isOwner = !!currentUserId && book?.owner_id === currentUserId;

  // Entity permissions for sharing — only loaded for the owner
  const { data: permsData } = useEntityPermissionsQuery("book", bookId ?? "", { enabled: isOwner });
  const setPermMutation = useSetEntityPermissionMutation("book", bookId ?? "");
  const revokePermMutation = useRevokeEntityPermissionMutation("book", bookId ?? "");

  // Derive current shared users from permissions (exclude structural/hidden rows)
  const sharedUsers: SharedUserPermission[] = (permsData?.data ?? [])
    .filter((p) => !p.is_structural && !p.is_hidden)
    .map((p) => ({ user_id: p.user_id, permission_level: (p.permission_level || "view") as PermissionLevel }));

  const shloks: ShlokResponse[] = shloksData?.data?.items ?? [];

  // Initialise visibility from server data once loaded
  useEffect(() => {
    if (book?.visibility) {
      const v = book.visibility === "specific_users" ? "shared" : (book.visibility as Visibility);
      setBookVisibility(v);
    }
  }, [book?.visibility]);

  const filtered = shloks.filter(
    (s) =>
      s.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenEdit = () => {
    if (!book) return;
    setEditTitle(book.title ?? "");
    setEditDescription(book.description ?? "");
    setEditAuthorName(book.author_name ?? "");
    setEditCategory(book.category ?? "");
    setEditSource(book.source ?? "");
    setEditOpen(true);
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId || !editTitle.trim()) return;
    updateBookMutation.mutate(
      {
        bookId,
        data: {
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          author_name: editAuthorName.trim() || undefined,
          category: editCategory.trim() || undefined,
          source: editSource.trim() || undefined,
        },
      },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  const handleVisibilityChange = (v: Visibility) => {    setBookVisibility(v);
    if (!bookId) return;
    const apiVisibility =
      v === "shared" ? "specific_users" : (v as "public" | "private" | "specific_users");
    updateBookMutation.mutate({ bookId, data: { visibility: apiVisibility } });
  };

  const handleSharedUsersChange = useCallback((newUsers: SharedUserPermission[]) => {
    if (!bookId) return;
    const prevIds = sharedUsers.map((u) => u.user_id);
    const newIds = newUsers.map((u) => u.user_id);
    const added = newUsers.filter((u) => !prevIds.includes(u.user_id));
    const removed = prevIds.filter((id) => !newIds.includes(id));
    // Also detect users whose permission_level changed
    const levelChanged = newUsers.filter((u) => {
      const prev = sharedUsers.find((p) => p.user_id === u.user_id);
      return prev && prev.permission_level !== u.permission_level;
    });
    [...added, ...levelChanged].forEach((u) =>
      setPermMutation.mutate({ user_id: u.user_id, permission_level: u.permission_level })
    );
    removed.forEach((uid) => revokePermMutation.mutate(uid));
  }, [bookId, sharedUsers, setPermMutation, revokePermMutation]);

  const handleCreateShlok = (data: { title: string; text: string }) => {
    if (!bookId) return;
    createShlokMutation.mutate(
      {
        book_id: bookId,
        content: data.title ? `${data.title}\n\n${data.text}` : data.text,
        visibility: "private",
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
        },
      }
    );
  };

  if (bookLoading) {
    return (
      <div className="max-w-5xl space-y-4">
        <Link to="/dashboard/library" className="inline-flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </Link>
        <div className="surface rounded-lg border border-border p-5 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-2" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (bookError || !book) {
    return (
      <div className="max-w-5xl space-y-4">
        <Link to="/dashboard/library" className="inline-flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </Link>
        <div className="surface rounded-lg border border-border p-12 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-body text-muted-foreground">Book not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-small text-muted-foreground">
        <Link to="/dashboard/library" className="hover:text-foreground transition-colors">Library</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">{book.title}</span>
      </div>

      <Link to="/dashboard/library" className="inline-flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Book header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface rounded-lg border border-border p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-display text-foreground">{book.title}</h1>
            <p className="text-body text-muted-foreground mt-1">{book.description}</p>
            <div className="flex items-center gap-3 mt-2 text-small text-muted-foreground">
              {book.author_name && <span>by {book.author_name}</span>}
              {book.author_name && <span className="text-border">•</span>}
              <span>{shloks.length} slokas</span>
              {book.category && (
                <>
                  <span className="text-border">•</span>
                  <span className="capitalize">{book.category}</span>
                </>
              )}
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <VisibilitySelector
                value={bookVisibility}
                onChange={handleVisibilityChange}
                compact
                sharedUsers={sharedUsers}
                onSharedUsersChange={handleSharedUsersChange}
              />
              <button
                onClick={handleOpenEdit}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Edit book details"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <GradientButton onClick={() => setCreateOpen(true)} size="sm">
                <Plus className="w-4 h-4" /> Add Sloka
              </GradientButton>
            </div>
          )}
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search slokas..."
          className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
        />
      </div>

      {/* Sloka Cards */}
      {shloksLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface rounded-lg border border-border p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((shlok, i) => {
            const VIcon = visIcon[shlok.visibility] ?? Eye;
            const label = getShlokLabel(shlok);
            return (
              <motion.div
                key={shlok.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                onClick={() => navigate(`/dashboard/slokas/${shlok.id}`)}
                className="group surface rounded-lg border border-border p-4 cursor-pointer transition-all duration-200 hover:shadow-elevated hover:border-accent/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-heading text-foreground group-hover:text-accent transition-colors">{label}</h3>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${visColor[shlok.visibility] ?? "text-muted-foreground"}`}>
                        <VIcon className="w-3 h-3" />
                      </span>
                    </div>
                    <p className="text-body text-muted-foreground mt-1.5 line-clamp-2 whitespace-pre-line leading-relaxed">{shlok.content}</p>
                    <div className="flex items-center gap-3 mt-3 text-small text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Pencil className="w-3 h-3" />
                        {new Date(shlok.created_at).toLocaleDateString()}
                      </span>
                      {shlok.tags.length > 0 && (
                        <>
                          <span className="text-border">•</span>
                          <span>{shlok.tags.join(", ")}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-accent transition-colors mt-1 shrink-0" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !shloksLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface rounded-lg border border-border p-12 text-center">
          <ScrollText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-body text-muted-foreground">No slokas found.</p>
          <button onClick={() => setCreateOpen(true)} className="text-small text-accent hover:text-accent-glow font-medium mt-2 transition-colors">
            Add the first sloka
          </button>
        </motion.div>
      )}

      <CreateSlokaModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateShlok}
      />

      {/* Edit Book Modal */}
      <AnimatePresence>
        {editOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setEditOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="surface w-full max-w-lg rounded-xl shadow-modal border border-border/50 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-heading font-semibold text-foreground flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-accent" /> Edit Book
                  </h2>
                  <button onClick={() => setEditOpen(false)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSaveBook} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Title <span className="text-destructive">*</span></label>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      placeholder="Book title"
                      className="flex h-9 w-full rounded border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      placeholder="Short description of the book"
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-small font-medium text-foreground">Author name</label>
                      <input
                        value={editAuthorName}
                        onChange={(e) => setEditAuthorName(e.target.value)}
                        placeholder="e.g., Swami Vivekananda"
                        className="flex h-9 w-full rounded border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-small font-medium text-foreground">Category</label>
                      <input
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        placeholder="e.g., scripture"
                        className="flex h-9 w-full rounded border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Source</label>
                    <input
                      value={editSource}
                      onChange={(e) => setEditSource(e.target.value)}
                      placeholder="e.g., Bhagavad Gita As It Is"
                      className="flex h-9 w-full rounded border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={() => setEditOpen(false)} className="h-9 px-4 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      Cancel
                    </button>
                    <GradientButton type="submit" size="sm" disabled={updateBookMutation.isPending}>
                      {updateBookMutation.isPending ? "Saving…" : "Save Changes"}
                    </GradientButton>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

