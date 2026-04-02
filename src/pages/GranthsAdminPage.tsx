import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useGranthsQuery,
  useCreateGranthMutation,
  useUpdateGranthMutation,
  useDeleteGranthMutation,
} from "@/lib/api/endpoints/granths";
import { useCurrentUserQuery } from "@/lib/api/endpoints/auth";
import type { GranthResponse } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, BookOpen, Globe, Lock, Eye, EyeOff, X, FileText, Sparkles, Languages } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils";

export default function GranthsAdminPage() {
  const navigate = useNavigate();
  const { data: userData } = useCurrentUserQuery();
  const role = userData?.data?.role ?? "user";
  const isAdmin = role === "admin" || role === "superadmin";

  const { data, isLoading } = useGranthsQuery();
  const createMutation = useCreateGranthMutation();
  const updateMutation = useUpdateGranthMutation();
  const deleteMutation = useDeleteGranthMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GranthResponse | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [language, setLanguage] = useState("punjabi");

  const granths = data?.data ?? [];

  function openCreate() {
    setEditing(null);
    setTitle(""); setDescription(""); setAuthor(""); setLanguage("punjabi");
    setDialogOpen(true);
  }

  function openEdit(g: GranthResponse) {
    setEditing(g);
    setTitle(g.title);
    setDescription(g.description ?? "");
    setAuthor(g.author ?? "");
    setLanguage(g.language);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!title.trim()) return;
    const payload = { title: title.trim(), description: description.trim() || undefined, author: author.trim() || undefined, language };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload }, {
        onSuccess: () => { toast.success("Granth updated"); setDialogOpen(false); },
        onError: (e) => toast.error(e.message),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast.success("Granth created"); setDialogOpen(false); },
        onError: (e) => toast.error(e.message),
      });
    }
  }

  function handleTogglePublish(g: GranthResponse) {
    updateMutation.mutate({ id: g.id, data: { is_published: !g.is_published } }, {
      onSuccess: () => toast.success(g.is_published ? "Set to draft" : "Published"),
      onError: (e) => toast.error(e.message),
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this granth permanently?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Deleted"),
      onError: (e) => toast.error(e.message),
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-[13px] text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/70 surface px-5 py-5 sm:px-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-background" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/70 px-2.5 py-1 text-small text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Editorial admin
            </div>
            <h1 className="text-display text-foreground">Granths</h1>
            <p className="mt-1 max-w-2xl text-body text-muted-foreground">
              Create, organize, and publish scripture collections with a cleaner, more thoughtful management flow.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-xl border border-border/60 bg-background/80 p-3">
              <p className="text-small text-muted-foreground">Collections</p>
              <p className="mt-1 text-heading text-foreground">{granths.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/80 p-3">
              <p className="text-small text-muted-foreground">Published</p>
              <p className="mt-1 text-heading text-foreground">{granths.filter((g) => g.is_published).length}</p>
            </div>
            <div className="col-span-2 rounded-xl border border-border/60 bg-background/80 p-3 sm:col-span-1">
              <p className="text-small text-muted-foreground">Total pages</p>
              <p className="mt-1 text-heading text-foreground">{granths.reduce((sum, g) => sum + g.total_pages, 0)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-heading text-foreground">Collection overview</h2>
          <p className="mt-1 text-small text-muted-foreground">Read a granth or jump directly into page management.</p>
        </div>
        {isAdmin && (
          <GradientButton size="sm" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" /> New Granth
          </GradientButton>
        )}
      </div>

      {/* Grid */}
      {granths.length === 0 ? (
        <div className="surface border border-border rounded-2xl py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <BookOpen className="w-8 h-8 opacity-40" />
          <p className="text-[13px]">{isAdmin ? "No granths yet. Create one to get started." : "No granths available."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {granths.map((g) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="group surface rounded-2xl border border-border/70 p-5 transition-all hover:border-accent/20 hover:shadow-elevated"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-heading text-foreground truncate">{g.title}</h2>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium",
                          g.is_published
                            ? "border-success/20 bg-success/10 text-success"
                            : "border-border/70 bg-muted/40 text-muted-foreground"
                        )}
                      >
                        {g.is_published ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {g.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                    {g.author && <p className="mt-1 text-small text-muted-foreground truncate">{g.author}</p>}
                    {g.description && <p className="mt-2 line-clamp-2 text-body text-muted-foreground">{g.description}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:w-[240px]">
                  <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-3">
                    <p className="text-small text-muted-foreground">Pages</p>
                    <p className="mt-1 text-heading text-foreground">{g.total_pages}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-3">
                    <p className="text-small text-muted-foreground">Language</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-body font-medium capitalize text-foreground">
                      <Languages className="w-3.5 h-3.5 text-accent" /> {g.language}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-border/70">
                <button
                  onClick={() => navigate(isAdmin ? `/admin/granths/${g.id}` : `/dashboard/granths/${g.id}`)}
                  className="flex-1 rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-left text-[13px] font-medium text-foreground transition-colors hover:border-accent/20 hover:text-accent"
                >
                  Read granth →
                </button>
                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => navigate(`/admin/granths/${g.id}/pages`)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background/70 px-3 py-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                      title="Manage pages"
                    >
                      <FileText className="w-3.5 h-3.5" /> Pages
                    </button>
                    <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/70 px-1 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleTogglePublish(g)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title={g.is_published ? "Set to draft" : "Publish"}
                      >
                        {g.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => openEdit(g)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <AnimatePresence>
        {dialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setDialogOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="surface w-full max-w-md rounded-2xl border border-border/70 shadow-elevated p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-heading text-foreground">
                    {editing ? "Edit Granth" : "New Granth"}
                  </h3>
                  <button
                    onClick={() => setDialogOpen(false)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Title *</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Sri Guru Granth Sahib"
                      className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Author</label>
                    <input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="(optional)"
                      className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Language</label>
                    <input
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="(optional)"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setDialogOpen(false)}
                    className="h-8 px-3 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <GradientButton
                    size="sm"
                    onClick={handleSave}
                    disabled={!title.trim() || createMutation.isPending || updateMutation.isPending}
                  >
                    {editing ? "Save Changes" : "Create"}
                  </GradientButton>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
