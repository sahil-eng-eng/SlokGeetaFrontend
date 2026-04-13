import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, ScrollText, ChevronRight, BookOpen, Eye, Lock, Users, Pencil, X, ArrowRight, Calendar,
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
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <div className="relative overflow-hidden rounded border border-accent/20 surface px-5 py-5 sm:px-6 animate-pulse">
          <div className="h-5 bg-muted rounded w-24 mb-3" />
          <div className="h-8 bg-muted rounded w-64 mb-2" />
          <div className="h-4 bg-muted rounded w-80" />
        </div>
      </div>
    );
  }

  if (bookError || !book) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <div className="surface rounded border border-accent/15 py-16 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded bg-muted/50 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-body font-medium text-muted-foreground">Book not found</p>
          <Link to="/dashboard/library" className="text-small text-accent hover:text-accent-glow font-medium transition-colors">
            ← Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded border border-accent/20 surface px-5 py-5 sm:px-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-background" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          {/* Left — title + breadcrumb */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-accent/15 bg-background/70 px-2.5 py-1 text-small text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5 text-accent" />
              <Link to="/dashboard/library" className="hover:text-foreground transition-colors">Library</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground/80 truncate max-w-[160px]">{book.title}</span>
            </div>
            <h1 className="text-display text-foreground">{book.title}</h1>
            {book.author_name && (
              <p className="mt-1 text-body text-muted-foreground">by {book.author_name}</p>
            )}
            {book.description && (
              <p className="mt-2 max-w-2xl text-body text-muted-foreground line-clamp-2">{book.description}</p>
            )}
          </div>

          {/* Right — stats + owner controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="grid grid-cols-2 gap-2 lg:min-w-[220px]">
              <div className="rounded border border-accent/15 bg-background/80 p-3">
                <p className="text-small text-muted-foreground">Slokas</p>
                <p className="mt-1 text-heading text-foreground">{shloks.length}</p>
              </div>
              <div className="rounded border border-accent/15 bg-background/80 p-3">
                <p className="text-small text-muted-foreground">
                  {book.category ? "Category" : "Visibility"}
                </p>
                <p className="mt-1 text-body font-medium text-foreground capitalize">
                  {book.category
                    ? book.category
                    : (book.visibility === "specific_users" ? "Shared" : book.visibility)}
                </p>
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
                  className="p-2 rounded border border-accent/15 text-muted-foreground hover:text-foreground hover:border-accent/30 hover:bg-accent/5 transition-colors"
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
        </div>
      </motion.div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search slokas…"
          className="w-full h-9 pl-9 pr-3 rounded border border-input bg-background text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60 transition-all"
        />
      </div>

      {/* ── Sloka Cards ── */}
      {shloksLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface rounded border border-accent/15 p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="surface rounded border border-accent/15 py-16 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded bg-accent/10 flex items-center justify-center">
              <ScrollText className="w-6 h-6 text-accent/50" />
            </div>
            <p className="text-body font-medium text-muted-foreground">No slokas found</p>
            {isOwner && (
              <button
                onClick={() => setCreateOpen(true)}
                className="text-small text-accent hover:text-accent-glow font-medium transition-colors"
              >
                Add the first sloka →
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((shlok, i) => {
            const VIcon = visIcon[shlok.visibility] ?? Eye;
            const label = getShlokLabel(shlok);
            const hasLocation = shlok.chapter_number != null || shlok.verse_number != null;
            return (
              <motion.div
                key={shlok.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                onClick={() => navigate(`/dashboard/slokas/${shlok.id}`)}
                className="group surface rounded border border-accent/15 p-5 cursor-pointer transition-all hover:border-accent/30 hover:shadow-elevated"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <ScrollText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex flex-wrap items-center gap-2">
                        <h3 className="text-heading text-foreground group-hover:text-accent transition-colors">{label}</h3>
                        {hasLocation && (
                          <span className="inline-flex items-center gap-1 rounded border border-accent/15 bg-accent/5 px-2 py-0.5 text-[11px] font-medium text-accent">
                            {shlok.chapter_number != null && `Ch ${shlok.chapter_number}`}
                            {shlok.chapter_number != null && shlok.verse_number != null && " · "}
                            {shlok.verse_number != null && `V ${shlok.verse_number}`}
                          </span>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium shrink-0 ${visColor[shlok.visibility] ?? "text-muted-foreground"}`}>
                        <VIcon className="w-3 h-3" />
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-body text-muted-foreground whitespace-pre-line leading-relaxed">{shlok.content}</p>
                    <div className="mt-3 pt-3 border-t border-accent/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap min-w-0">
                        <span className="text-small text-muted-foreground inline-flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3" />
                          {new Date(shlok.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        {shlok.tags.length > 0 && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <div className="flex flex-wrap gap-1">
                              {shlok.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="inline-flex items-center rounded border border-accent/15 bg-accent/5 px-1.5 py-0.5 text-[10px] text-accent/80">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 shrink-0" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
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
                className="surface w-full max-w-lg rounded shadow-modal border border-accent/15 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-heading font-semibold text-foreground flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-accent" /> Edit Book
                  </h2>
                  <button onClick={() => setEditOpen(false)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
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
                      className="flex w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none transition-all"
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
                    <button type="button" onClick={() => setEditOpen(false)} className="h-9 px-4 rounded text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
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

