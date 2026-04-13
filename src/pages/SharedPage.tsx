import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Share2, ArrowRight, Calendar, Search } from "lucide-react";
import { useSharedWithMeBooksQuery } from "@/lib/api/endpoints/books";

export default function SharedPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data, isLoading } = useSharedWithMeBooksQuery();
  const books = data?.data?.items ?? [];

  const filtered = books.filter((book) =>
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    (book.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

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
              <Share2 className="h-3.5 w-3.5 text-accent" /> Shared with me
            </div>
            <h1 className="text-display text-foreground">Shared Books</h1>
            <p className="mt-1 max-w-2xl text-body text-muted-foreground">
              Books that others have shared with you — read, explore and discover new perspectives.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:min-w-[200px]">
            <div className="rounded border border-accent/15 bg-background/80 p-3">
              <p className="text-small text-muted-foreground">Shared</p>
              <p className="mt-1 text-heading text-foreground">{books.length}</p>
            </div>
            <div className="rounded border border-accent/15 bg-background/80 p-3">
              <p className="text-small text-muted-foreground">Showing</p>
              <p className="mt-1 text-heading text-foreground">{filtered.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Search ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shared books…"
            className="w-full h-9 pl-9 pr-3 rounded border border-input bg-background text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60 transition-all"
          />
        </div>
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
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
      ) : filtered.length === 0 ? (
        <div className="surface rounded border border-accent/15 py-16 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded bg-accent/10 flex items-center justify-center">
            <Share2 className="w-6 h-6 text-accent/50" />
          </div>
          <p className="text-body font-medium text-muted-foreground">
            {search ? "No books match your search" : "No books shared with you yet"}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-small text-accent hover:text-accent-glow font-medium transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filtered.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/dashboard/library/${book.id}`)}
              className="group surface rounded border border-accent/15 p-5 cursor-pointer transition-all hover:border-accent/30 hover:shadow-elevated"
            >
              <div className="flex items-start gap-4">
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
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-accent shrink-0 mt-0.5 border border-accent/20 bg-accent/8 px-1.5 py-0.5 rounded">
                      <Share2 className="w-2.5 h-2.5" /> Shared
                    </span>
                  </div>
                  {book.description && (
                    <p className="mt-2 line-clamp-2 text-body text-muted-foreground">{book.description}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-accent/10 flex items-center justify-between">
                    <span className="text-small text-muted-foreground inline-flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(book.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <ArrowRight className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
