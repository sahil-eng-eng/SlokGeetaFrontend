import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  useGranthDetailQuery,
  useGranthPageQuery,
  useGranthProgressQuery,
  useUpdateGranthProgressMutation,
} from "@/lib/api/endpoints/granths";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen, Clock3 } from "lucide-react";

export default function GranthReaderPage() {
  const { granthId } = useParams<{ granthId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = location.pathname.startsWith("/admin") ? "/admin/granths" : "/dashboard/granths";

  const { data: granthData, isLoading: granthLoading } =
    useGranthDetailQuery(granthId ?? "");
  const { data: progressData } = useGranthProgressQuery(granthId ?? "");
  const updateProgress = useUpdateGranthProgressMutation(granthId ?? "");

  const granth = granthData?.data;
  const savedPage = progressData?.data?.current_page ?? 1;

  const [page, setPage] = useState(1);

  // Restore saved reading position once progress loads
  useEffect(() => {
    if (savedPage > 1) setPage(savedPage);
  }, [savedPage]);

  const { data: pageData, isLoading: pageLoading } = useGranthPageQuery(
    granthId ?? "",
    page
  );

  const pageContent = pageData?.data;
  const totalPages = granth?.total_pages ?? 0;

  // Save progress whenever the user changes pages
  useEffect(() => {
    if (!granthId || page < 1) return;
    updateProgress.mutate({ granthId, data: { current_page: page } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, granthId]);

  function goPrev() {
    setPage((p) => Math.max(1, p - 1));
  }
  function goNext() {
    setPage((p) => Math.min(totalPages, p + 1));
  }

  if (granthLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!granth) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Granth not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-5">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 surface px-5 py-5 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-background" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(backPath)} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/70 px-2.5 py-1 text-small text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-accent" /> Reader view
              </div>
              <h1 className="text-display text-foreground truncate">{granth.title}</h1>
              {granth.author && <p className="mt-1 text-body text-muted-foreground">{granth.author}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-xl border border-border/60 bg-background/80 p-3">
              <p className="text-small text-muted-foreground">Current page</p>
              <p className="mt-1 text-heading text-foreground">{page}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/80 p-3">
              <p className="text-small text-muted-foreground">Total pages</p>
              <p className="mt-1 text-heading text-foreground">{totalPages || "?"}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/80 p-3 col-span-2 sm:col-span-1">
              <p className="text-small text-muted-foreground">Saved progress</p>
              <p className="mt-1 text-body font-medium text-foreground inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-accent" /> Synced
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="rounded-2xl border-border/70 bg-card/90">
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-heading text-foreground">Reading summary</p>
              <p className="mt-1 text-small text-muted-foreground">Navigate page by page with a more spacious and focused reading layout.</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="text-small text-muted-foreground">Page progress</p>
                <p className="mt-1 text-body font-medium text-foreground">{totalPages > 0 ? `${Math.round((page / totalPages) * 100)}% through this granth` : "Waiting for pages"}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="text-small text-muted-foreground">Navigation</p>
                <p className="mt-1 text-body font-medium text-foreground">Use previous and next to keep your place without losing context.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 overflow-hidden rounded-2xl border-border/70 bg-card/95">
          <CardContent className="py-6 px-5 sm:px-7 min-h-[420px]">
          {pageLoading ? (
            <p className="text-center text-muted-foreground py-12">
              Loading page…
            </p>
          ) : pageContent ? (
            <>
              {pageContent.image_url && (
                <img
                  src={pageContent.image_url}
                  alt={`Page ${page}`}
                  className="w-full max-h-[460px] object-cover rounded-2xl mb-6"
                />
              )}
              <div className="whitespace-pre-wrap leading-relaxed text-[15px] text-foreground">
                {pageContent.content}
              </div>
            </>
          ) : totalPages === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              This granth has no pages yet.
            </p>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              Page not found.
            </p>
          )}
        </CardContent>
        </Card>
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-border/70 surface px-4 py-3">
          <Button variant="outline" onClick={goPrev} disabled={page <= 1} className="rounded-xl">
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            onClick={goNext}
            disabled={page >= totalPages}
            className="rounded-xl"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
