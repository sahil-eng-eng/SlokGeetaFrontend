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
import { Plus, Pencil, Trash2, BookOpen, Globe, Lock, Eye, EyeOff, X, FileText } from "lucide-react";
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
    <div className="p-5 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-foreground">Granths</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {granths.length} {granths.length === 1 ? "granth" : "granths"}
          </p>
        </div>
        {isAdmin && (
          <GradientButton size="sm" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" /> New Granth
          </GradientButton>
        )}
      </div>

      {/* Grid */}
      {granths.length === 0 ? (
        <div className="surface border border-border rounded-xl py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <BookOpen className="w-8 h-8 opacity-40" />
          <p className="text-[13px]">{isAdmin ? "No granths yet. Create one to get started." : "No granths available."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {granths.map((g) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="surface border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-accent/30 transition-colors group"
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[13px] font-semibold text-foreground truncate">{g.title}</h2>
                  {g.author && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{g.author}</p>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded",
                    g.is_published
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {g.is_published ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                  {g.is_published ? "Published" : "Draft"}
                </span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{g.language}</span>
                <span>·</span>
                <span>{g.total_pages} pages</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <button
                  onClick={() => navigate(isAdmin ? `/admin/granths/${g.id}` : `/dashboard/granths/${g.id}`)}
                  className="flex-1 text-[12px] font-medium text-accent hover:text-accent/80 transition-colors text-left"
                >
                  Read →
                </button>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/admin/granths/${g.id}/pages`)}
                      className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
                      title="Manage pages"
                    >
                      <FileText className="w-3 h-3" />
                      Pages
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleTogglePublish(g)}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title={g.is_published ? "Set to draft" : "Publish"}
                      >
                        {g.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => openEdit(g)}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
                className="surface w-full max-w-sm rounded-xl border border-border shadow-elevated p-5 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-semibold text-foreground">
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
                      className="w-full h-8 px-3 rounded-md border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Author</label>
                    <input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="(optional)"
                      className="w-full h-8 px-3 rounded-md border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Language</label>
                    <input
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-8 px-3 rounded-md border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="(optional)"
                      className="w-full px-3 py-2 rounded-md border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
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
