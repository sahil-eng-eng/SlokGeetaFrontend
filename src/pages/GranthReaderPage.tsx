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
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

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
    <div className="flex flex-col h-full max-w-3xl mx-auto p-4 md:p-6 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{granth.title}</h1>
          {granth.author && (
            <p className="text-sm text-muted-foreground">{granth.author}</p>
          )}
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {page} / {totalPages || "?"}
        </span>
      </div>

      {/* Page content */}
      <Card className="flex-1 overflow-auto">
        <CardContent className="py-6 px-5 min-h-[300px]">
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
                  className="w-full rounded-lg mb-4"
                />
              )}
              <div className="whitespace-pre-wrap leading-relaxed text-base">
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

      {/* Navigation */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={goPrev} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            onClick={goNext}
            disabled={page >= totalPages}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
