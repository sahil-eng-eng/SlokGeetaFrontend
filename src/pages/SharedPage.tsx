import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Share2, Loader2 } from "lucide-react";
import { useSharedWithMeBooksQuery } from "@/lib/api/endpoints/books";

export default function SharedPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useSharedWithMeBooksQuery();
  const books = data?.data?.items ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-display text-foreground flex items-center gap-2">
          <Share2 className="w-5 h-5 text-accent" />
          Shared With Me
        </h1>
        <p className="text-body text-muted-foreground mt-1">Books that others have shared with you</p>
      </div>

      {isLoading ? (
        <div className="surface rounded-lg border border-border p-12 text-center">
          <Loader2 className="w-8 h-8 text-accent/50 mx-auto mb-3 animate-spin" />
          <p className="text-body text-muted-foreground">Loading shared books…</p>
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {books.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              onClick={() => navigate(`/dashboard/library/${book.id}`)}
              className="group surface rounded-lg border border-border p-4 cursor-pointer transition-all duration-200 hover:shadow-elevated hover:border-accent/20 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <BookOpen className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-heading text-foreground group-hover:text-accent transition-colors">{book.title}</h3>
              {book.description && (
                <p className="text-small text-muted-foreground mt-1 line-clamp-2">{book.description}</p>
              )}
              {book.author_name && (
                <div className="mt-3 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-1.5 text-small text-muted-foreground">
                    <Share2 className="w-3 h-3" />
                    By <span className="text-foreground font-medium">{book.author_name}</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="surface rounded-lg border border-border p-12 text-center">
          <Share2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-body text-muted-foreground">No books have been shared with you yet.</p>
        </div>
      )}
    </div>
  );
}
