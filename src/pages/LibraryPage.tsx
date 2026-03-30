import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, BookOpen, ScrollText, ChevronRight, X, Eye, Lock, Users } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { VisibilitySelector } from "@/components/ui/VisibilitySelector";
import { Visibility } from "@/types/sloka";
import { useMyBooksQuery, useCreateBookMutation } from "@/lib/api/endpoints/books";
import type { BookResponse } from "@/types";
import booksHero from "@/assets/books-hero.jpg";

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
      <div className="space-y-5 max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground">Library</h1>
            <p className="text-body text-muted-foreground mt-1">Loading your collection...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface rounded-lg border border-border p-4 animate-pulse">
              <div className="w-9 h-9 rounded-lg bg-muted mb-3" />
              <div className="h-4 bg-muted rounded mb-2 w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-5 max-w-5xl">
        <h1 className="text-display text-foreground">Library</h1>
        <div className="surface rounded-lg border border-border p-12 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-body text-muted-foreground">Failed to load your library. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-xl overflow-hidden h-36"
      >
        <img src={booksHero} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/30 to-transparent" />
        <div className="relative z-10 flex items-end justify-between h-full px-6 pb-5">
          <div>
            <h1 className="text-[1.35rem] font-display font-bold text-white">Library</h1>
            <p className="text-[13px] text-white/70 mt-1">{books.length} books in your collection</p>
          </div>
          <GradientButton onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="w-4 h-4" /> Add Book
          </GradientButton>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books..."
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted/50 border border-border/50">
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

      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((book, i) => {
          const VIcon = visIcon[book.visibility] ?? Eye;
          return (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              onClick={() => navigate(`/dashboard/library/${book.id}`)}
              className="group surface rounded-lg border border-border p-4 cursor-pointer transition-all duration-200 hover:shadow-elevated hover:border-accent/20 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${visColor[book.visibility] ?? "text-muted-foreground"}`}>
                    <VIcon className="w-3 h-3" />
                    {book.visibility === "specific_users"
                      ? "Shared"
                      : book.visibility.charAt(0).toUpperCase() + book.visibility.slice(1)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
                </div>
              </div>
              <h3 className="text-heading text-foreground group-hover:text-accent transition-colors">{book.title}</h3>
              <p className="text-small text-muted-foreground mt-1 line-clamp-2">{book.description}</p>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/60">
                {book.author_name && (
                  <span className="text-small text-muted-foreground">{book.author_name}</span>
                )}
                {book.category && (
                  <>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="text-small text-muted-foreground inline-flex items-center gap-1">
                      <ScrollText className="w-3 h-3" />
                      {book.category}
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="surface rounded-lg border border-border p-12 text-center"
        >
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-body text-muted-foreground">No books found matching your search.</p>
          <button
            onClick={() => { setSearch(""); setActiveCategory("All"); }}
            className="text-small text-accent hover:text-accent-glow font-medium mt-2 inline-flex items-center gap-1 transition-colors"
          >
            Clear filters
          </button>
        </motion.div>
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
                className="surface w-full max-w-md rounded-xl shadow-modal border border-border/50 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-heading text-foreground">Add New Book</h2>
                  <button
                    onClick={() => setCreateOpen(false)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
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
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Description</label>
                    <textarea
                      {...register("description")}
                      rows={3}
                      placeholder="Brief description..."
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Category</label>
                    <select
                      {...register("category")}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
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
                      className="h-9 px-4 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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



