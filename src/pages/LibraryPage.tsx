import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, BookOpen, ScrollText, X, Eye, Lock, Users, Library, ArrowRight, Sparkles } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { VisibilitySelector } from "@/components/ui/VisibilitySelector";
import { Visibility } from "@/types/sloka";
import { useMyBooksQuery, useCreateBookMutation } from "@/lib/api/endpoints/books";
import type { BookResponse } from "@/types";

const CATEGORIES = ["All", "scripture", "philosophy", "epic", "veda"] as const;

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

const createBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author_name: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

type CreateBookFormValues = z.infer<typeof createBookSchema>;

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [newVisibility, setNewVisibility] = useState<Visibility>("private");
  const navigate = useNavigate();

  const { data, isLoading, isError } = useMyBooksQuery();
  const createBookMutation = useCreateBookMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBookFormValues>({
    resolver: zodResolver(createBookSchema),
  });

  const books: BookResponse[] = data?.data?.items ?? [];

  const filtered = books.filter((book) => {
    const authorName = book.author_name ?? "";
    const matchSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      authorName.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      activeCategory === "All" || book.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const onSubmit = (values: CreateBookFormValues) => {
    createBookMutation.mutate(
      {
        title: values.title,
        author_name: values.author_name || undefined,
        description: values.description || undefined,
        category: values.category || undefined,
        visibility:
          newVisibility === "shared"
            ? "specific_users"
            : (newVisibility as "public" | "private" | "specific_users"),
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          reset();
          setNewVisibility("private");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <div className="relative overflow-hidden rounded border border-accent/20 surface px-5 py-5 sm:px-6 animate-pulse">
          <div className="h-5 bg-muted rounded w-32 mb-3" />
          <div className="h-8 bg-muted rounded w-48 mb-2" />
          <div className="h-4 bg-muted rounded w-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface rounded border border-accent/15 p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <div className="surface rounded border border-accent/15 py-16 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded bg-muted/50 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-body font-medium text-muted-foreground">Failed to load your library</p>
          <p className="text-small text-muted-foreground/60">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded border border-accent/20 surface px-5 py-5 sm:px-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-background" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-accent/15 bg-background/70 px-2.5 py-1 text-small text-muted-foreground">
              <Library className="h-3.5 w-3.5 text-accent" /> Personal collection
            </div>
            <h1 className="text-display text-foreground">My Library</h1>
            <p className="mt-1 max-w-2xl text-body text-muted-foreground">
              Your personal book collection — save verses, add meanings and share with others.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="grid grid-cols-2 gap-2 lg:min-w-[200px]">
              <div className="rounded border border-accent/15 bg-background/80 p-3">
                <p className="text-small text-muted-foreground">Total books</p>
                <p className="mt-1 text-heading text-foreground">{books.length}</p>
              </div>
              <div className="rounded border border-accent/15 bg-background/80 p-3">
                <p className="text-small text-muted-foreground">Showing</p>
                <p className="mt-1 text-heading text-foreground">{filtered.length}</p>
              </div>
            </div>
            <GradientButton onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="w-4 h-4" /> Add Book
            </GradientButton>
          </div>
        </div>
      </motion.div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books…"
            className="w-full h-9 pl-9 pr-3 rounded border border-input bg-background text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded bg-muted/50 border border-accent/15">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded text-[12px] font-medium transition-all ${
                activeCategory === cat
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "All" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Book Grid ── */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="surface rounded border border-accent/15 py-16 flex flex-col items-center gap-3"
        >
          <div className="w-12 h-12 rounded bg-accent/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-accent/50" />
          </div>
          <p className="text-body font-medium text-muted-foreground">No books found</p>
          {(search || activeCategory !== "All") ? (
            <button
              onClick={() => { setSearch(""); setActiveCategory("All"); }}
              className="text-small text-accent hover:text-accent-glow font-medium transition-colors"
            >
              Clear filters
            </button>
          ) : (
            <button
              onClick={() => setCreateOpen(true)}
              className="text-small text-accent hover:text-accent-glow font-medium transition-colors"
            >
              Add your first book →
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filtered.map((book, i) => {
            const VIcon = visIcon[book.visibility] ?? Eye;
            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/dashboard/library/${book.id}`)}
                className="group surface rounded border border-accent/15 p-5 cursor-pointer transition-all hover:border-accent/30 hover:shadow-elevated"
              >
                <div className="flex items-start gap-4">
                  {/* Icon badge */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-heading text-foreground group-hover:text-accent transition-colors">{book.title}</h2>
                          {book.category && (
                            <span className="inline-flex items-center gap-1 rounded border border-accent/15 bg-accent/5 px-2 py-0.5 text-[11px] font-medium text-accent capitalize">
                              {book.category}
                            </span>
                          )}
                        </div>
                        {book.author_name && (
                          <p className="mt-0.5 text-small text-muted-foreground">by {book.author_name}</p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium shrink-0 mt-0.5 ${visColor[book.visibility] ?? "text-muted-foreground"}`}>
                        <VIcon className="w-3 h-3" />
                        {book.visibility === "specific_users"
                          ? "Shared"
                          : book.visibility.charAt(0).toUpperCase() + book.visibility.slice(1)}
                      </span>
                    </div>
                    {book.description && (
                      <p className="mt-2 line-clamp-2 text-body text-muted-foreground">{book.description}</p>
                    )}
                    <div className="mt-3 pt-3 border-t border-accent/10 flex items-center justify-between">
                      <span className="text-small text-muted-foreground inline-flex items-center gap-1.5">
                        <ScrollText className="w-3 h-3" />
                        View collection
                      </span>
                      <ArrowRight className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Book Modal */}
      <AnimatePresence>
        {createOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setCreateOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="surface w-full max-w-md rounded shadow-modal border border-accent/15 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-heading text-foreground">Add New Book</h2>
                  <button
                    onClick={() => setCreateOpen(false)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Book Title</label>
                    <input
                      {...register("title")}
                      placeholder="e.g., Bhagavad Gita"
                      className="flex h-9 w-full rounded border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                    {errors.title && (
                      <p className="text-[11px] text-destructive">{errors.title.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Author</label>
                    <input
                      {...register("author_name")}
                      placeholder="e.g., Vyasa"
                      className="flex h-9 w-full rounded border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Description</label>
                    <textarea
                      {...register("description")}
                      rows={3}
                      placeholder="Brief description..."
                      className="flex w-full rounded border border-input bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Category</label>
                    <select
                      {...register("category")}
                      className="flex h-9 w-full rounded border border-input bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    >
                      <option value="">Select category</option>
                      <option value="scripture">Scripture</option>
                      <option value="philosophy">Philosophy</option>
                      <option value="epic">Epic</option>
                      <option value="veda">Veda</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Visibility</label>
                    <VisibilitySelector value={newVisibility} onChange={setNewVisibility} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCreateOpen(false)}
                      className="h-9 px-4 rounded text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <GradientButton
                      type="submit"
                      size="sm"
                      disabled={createBookMutation.isPending}
                    >
                      {createBookMutation.isPending ? "Creating..." : "Create Book"}
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



