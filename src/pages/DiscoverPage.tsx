import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, BookOpen, ScrollText, ChevronRight, Users, Globe } from "lucide-react";
import { useDiscoverBooksQuery } from "@/lib/api/endpoints/discover";

const categories = ["All", "scripture", "philosophy", "epic", "veda"];

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  const { data, isLoading } = useDiscoverBooksQuery(1);
  const books = data?.data?.items ?? [];

  const filtered = books.filter((book) => {
    const matchSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      (book.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-display text-foreground flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent" />
          Discover
        </h1>
        <p className="text-body text-muted-foreground mt-1">Explore public books shared by the community</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search public books..."
            className="w-full h-9 pl-9 pr-3 rounded border border-input bg-surface text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded bg-muted/50 border border-accent/15">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded text-[12px] font-medium transition-all ${
                activeCategory === cat
                  ? "surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "All" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="surface rounded border border-border p-4 animate-pulse">
              <div className="w-9 h-9 rounded bg-muted mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              onClick={() => navigate(`/dashboard/library/${book.id}`)}
              className="group surface rounded border border-border p-4 cursor-pointer transition-all duration-200 hover:shadow-elevated hover:border-accent/20 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
                </div>
              </div>
              <h3 className="text-heading text-foreground group-hover:text-accent transition-colors">{book.title}</h3>
              <p className="text-small text-muted-foreground mt-1 line-clamp-2">{book.description ?? "No description"}</p>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-accent/15">
                <span className="text-small text-muted-foreground">
                  {new Date(book.created_at).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="surface rounded border border-border p-12 text-center">
          <Globe className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-body text-muted-foreground">No public books found matching your search.</p>
        </div>
      )}
    </div>
  );
}
