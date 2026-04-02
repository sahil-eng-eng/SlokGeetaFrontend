import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Globe, Languages, Sparkles, ArrowRight, BookMarked } from "lucide-react";
import { useGranthsQuery, useGranthProgressQuery } from "@/lib/api/endpoints/granths";
import { GradientButton } from "@/components/ui/gradient-button";
import type { GranthResponse } from "@/types";

function GranthCard({ g, index }: { g: GranthResponse; index: number }) {
  const navigate = useNavigate();
  const { data: progressData } = useGranthProgressQuery(g.id);
  const savedPage = progressData?.data?.current_page ?? null;
  const hasProgress = savedPage !== null && savedPage > 1;
  const progressPct = g.total_pages > 0 && savedPage ? Math.round((savedPage / g.total_pages) * 100) : 0;

  return (
    <motion.div
      key={g.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group surface rounded border border-accent/15 p-5 transition-all hover:border-accent/30 hover:shadow-elevated"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-accent/10 text-accent">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-heading text-foreground truncate">{g.title}</h2>
              <span className="inline-flex items-center gap-1 rounded border border-accent/15 bg-accent/5 px-2 py-0.5 text-[11px] font-medium text-accent">
                <Globe className="w-2.5 h-2.5" /> Published
              </span>
            </div>
            {g.author && (
              <p className="mt-1 text-small text-muted-foreground truncate">{g.author}</p>
            )}
            {g.description && (
              <p className="mt-2 line-clamp-2 text-body text-muted-foreground">
                {g.description}
              </p>
            )}
            {/* Progress bar */}
            {hasProgress && g.total_pages > 0 && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <BookMarked className="w-3 h-3 text-accent" />
                    Last read: page {savedPage} of {g.total_pages}
                  </span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full bg-accent/60 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:w-[200px]">
          <div className="rounded border border-accent/15 bg-background/70 px-3 py-2.5">
            <p className="text-small text-muted-foreground">Pages</p>
            <p className="mt-1 text-heading text-foreground">{g.total_pages}</p>
          </div>
          <div className="rounded border border-accent/15 bg-background/70 px-3 py-2.5">
            <p className="text-small text-muted-foreground">Language</p>
            <p className="mt-1 inline-flex items-center gap-1 text-body font-medium capitalize text-foreground">
              <Languages className="w-3 h-3 text-accent" /> {g.language}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-accent/10 flex items-center gap-2">
        {hasProgress ? (
          <>
            <GradientButton
              size="sm"
              onClick={() => navigate(`/dashboard/granths/${g.id}`)}
              className="flex-1 justify-between"
            >
              <span className="flex items-center gap-2">
                <BookMarked className="w-3.5 h-3.5" />
                Continue from page {savedPage}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </GradientButton>
            <button
              onClick={() => navigate(`/dashboard/granths/${g.id}`)}
              className="h-8 px-3 rounded border border-accent/15 text-[12px] text-muted-foreground hover:text-foreground hover:border-accent/30 transition-colors"
            >
              From start
            </button>
          </>
        ) : (
          <GradientButton
            size="sm"
            onClick={() => navigate(`/dashboard/granths/${g.id}`)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              {g.total_pages > 0 ? "Start reading" : "Open granth"}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </GradientButton>
        )}
      </div>
    </motion.div>
  );
}

export default function GranthsPage() {
  const { data, isLoading } = useGranthsQuery();
  const granths = (data?.data ?? []).filter((g) => g.is_published);

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
        className="relative overflow-hidden rounded border border-accent/20 surface px-5 py-5 sm:px-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-background" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-accent/15 bg-background/70 px-2.5 py-1 text-small text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Scripture library
            </div>
            <h1 className="text-display text-foreground">Granths</h1>
            <p className="mt-1 max-w-2xl text-body text-muted-foreground">
              Browse and read published scripture collections. Your reading progress is saved automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:min-w-[280px]">
            <div className="rounded border border-accent/15 bg-background/80 p-3">
              <p className="text-small text-muted-foreground">Collections</p>
              <p className="mt-1 text-heading text-foreground">{granths.length}</p>
            </div>
            <div className="rounded border border-accent/15 bg-background/80 p-3">
              <p className="text-small text-muted-foreground">Total pages</p>
              <p className="mt-1 text-heading text-foreground">
                {granths.reduce((s, g) => s + g.total_pages, 0)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {granths.length === 0 ? (
        <div className="surface border border-accent/15 rounded py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <BookOpen className="w-8 h-8 opacity-40" />
          <p className="text-[13px]">No granths available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {granths.map((g, i) => (
            <GranthCard key={g.id} g={g} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}


// export default function GranthsPage() {
//   const navigate = useNavigate();
//   const { data, isLoading } = useGranthsQuery();
//   const granths = (data?.data ?? []).filter((g) => g.is_published);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center py-20 text-[13px] text-muted-foreground">
//         Loading…
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto w-full max-w-7xl space-y-5">
//       <motion.div
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="relative overflow-hidden rounded border border-accent/20 surface px-5 py-5 sm:px-6"
//       >
//         <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-background" />
//         <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
//           <div>
//             <div className="mb-2 inline-flex items-center gap-2 rounded border border-accent/15 bg-background/70 px-2.5 py-1 text-small text-muted-foreground">
//               <Sparkles className="h-3.5 w-3.5 text-accent" /> Scripture library
//             </div>
//             <h1 className="text-display text-foreground">Granths</h1>
//             <p className="mt-1 max-w-2xl text-body text-muted-foreground">
//               Browse and read published scripture collections. Your reading progress is saved automatically.
//             </p>
//           </div>

//           <div className="grid grid-cols-2 gap-3 lg:min-w-[280px]">
//             <div className="rounded border border-accent/15 bg-background/80 p-3">
//               <p className="text-small text-muted-foreground">Collections</p>
//               <p className="mt-1 text-heading text-foreground">{granths.length}</p>
//             </div>
//             <div className="rounded border border-accent/15 bg-background/80 p-3">
//               <p className="text-small text-muted-foreground">Total pages</p>
//               <p className="mt-1 text-heading text-foreground">
//                 {granths.reduce((s, g) => s + g.total_pages, 0)}
//               </p>
//             </div>
//           </div>
//         </div>
//       </motion.div>

//       {granths.length === 0 ? (
//         <div className="surface border border-accent/15 rounded py-16 flex flex-col items-center gap-3 text-muted-foreground">
//           <BookOpen className="w-8 h-8 opacity-40" />
//           <p className="text-[13px]">No granths available yet.</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
//           {granths.map((g, i) => (
//             <motion.div
//               key={g.id}
//               initial={{ opacity: 0, y: 4 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: i * 0.04 }}
//               className="group surface rounded border border-accent/15 p-5 transition-all hover:border-accent/30 hover:shadow-elevated"
//             >
//               <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                 <div className="flex min-w-0 flex-1 items-start gap-4">
//                   <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-accent/10 text-accent">
//                     <BookOpen className="w-5 h-5" />
//                   </div>
//                   <div className="min-w-0 flex-1">
//                     <div className="flex flex-wrap items-center gap-2">
//                       <h2 className="text-heading text-foreground truncate">{g.title}</h2>
//                       <span className="inline-flex items-center gap-1 rounded border border-accent/15 bg-accent/5 px-2 py-0.5 text-[11px] font-medium text-accent">
//                         <Globe className="w-2.5 h-2.5" /> Published
//                       </span>
//                     </div>
//                     {g.author && (
//                       <p className="mt-1 text-small text-muted-foreground truncate">{g.author}</p>
//                     )}
//                     {g.description && (
//                       <p className="mt-2 line-clamp-2 text-body text-muted-foreground">
//                         {g.description}
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-2 lg:w-[200px]">
//                   <div className="rounded border border-accent/15 bg-background/70 px-3 py-2.5">
//                     <p className="text-small text-muted-foreground">Pages</p>
//                     <p className="mt-1 text-heading text-foreground">{g.total_pages}</p>
//                   </div>
//                   <div className="rounded border border-accent/15 bg-background/70 px-3 py-2.5">
//                     <p className="text-small text-muted-foreground">Language</p>
//                     <p className="mt-1 inline-flex items-center gap-1 text-body font-medium capitalize text-foreground">
//                       <Languages className="w-3 h-3 text-accent" /> {g.language}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-4 pt-3 border-t border-accent/10">
//                 <GradientButton
//                   size="sm"
//                   onClick={() => navigate(`/dashboard/granths/${g.id}`)}
//                   className="w-full justify-between"
//                 >
//                   <span className="flex items-center gap-2">
//                     <BookOpen className="w-3.5 h-3.5" />
//                     {g.total_pages > 0 ? "Read granth" : "Open granth"}
//                   </span>
//                   <ArrowRight className="w-3.5 h-3.5" />
//                 </GradientButton>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
