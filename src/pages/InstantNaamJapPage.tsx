import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Check, Clock, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils";
import {
  useInstantJapSessionsQuery,
  useSaveInstantJapMutation,
} from "@/lib/api/endpoints/naamJap";
import { toast } from "sonner";

const TARGET_OPTIONS = [27, 54, 108, 216, 540, 1080];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function InstantNaamJapPage() {
  const navigate = useNavigate();
  const [target, setTarget] = useState(108);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const saveMutation = useSaveInstantJapMutation();
  const { data: sessionsData } = useInstantJapSessionsQuery();
  const sessions = sessionsData?.data ?? [];

  // Timer
  useEffect(() => {
    if (started && !completed) {
      startTimeRef.current = Date.now() - elapsed * 1000;
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, completed]);

  // Navigation guard — warn if user tries to close/refresh mid-session
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (started && !completed) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [started, completed]);

  const progress = Math.min(count / target, 1);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const handleTap = useCallback(() => {
    if (completed) return;
    if (!started) setStarted(true);
    setCount((prev) => {
      const next = prev + 1;
      if (next >= target) {
        setCompleted(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
      return next;
    });
  }, [started, completed, target]);

  const handleSave = () => {
    saveMutation.mutate(
      { count, target, duration_seconds: elapsed, completed },
      {
        onSuccess: () => {
          toast.success("Session saved!");
          handleReset();
        },
        onError: () => toast.error("Failed to save session"),
      }
    );
  };

  const handleReset = () => {
    setCount(0);
    setStarted(false);
    setElapsed(0);
    setCompleted(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/naam-jap"
            onClick={(e) => {
              if (started && !completed) {
                e.preventDefault();
                setShowLeaveDialog(true);
              }
            }}
            className="inline-flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-display text-foreground">Instant Naam Jap</h1>
        </div>
      </div>

      {/* Target selector — only before starting */}
      {!started && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface rounded-xl border border-border p-5"
        >
          <p className="text-small font-medium text-foreground mb-3">Select target</p>
          <div className="flex flex-wrap gap-2">
            {TARGET_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                className={cn(
                  "px-4 py-2 rounded-lg text-body font-medium border transition-all",
                  target === t
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:border-accent/30"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main counter area */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface rounded-xl border border-border p-8 flex flex-col items-center"
      >
        {/* Circular progress */}
        <div className="relative w-52 h-52 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            <motion.circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className="text-accent"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground tabular-nums">{count}</span>
            <span className="text-small text-muted-foreground">/ {target}</span>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 text-body text-muted-foreground mb-6">
          <Clock className="w-4 h-4" />
          <span className="tabular-nums">{formatDuration(elapsed)}</span>
        </div>

        {/* Completed state */}
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 mb-4 px-4 py-2 rounded-lg bg-success/10 border border-success/20 text-success"
            >
              <Trophy className="w-5 h-5" />
              <span className="text-body font-medium">Target reached!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap Zone */}
        {!completed && (
          <button
            onClick={handleTap}
            className="w-full max-w-xs h-24 rounded-2xl bg-accent/10 border-2 border-accent/30 text-accent text-heading font-semibold active:scale-95 active:bg-accent/20 transition-all select-none touch-manipulation"
          >
            {started ? "Tap" : "Tap to start"}
          </button>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-6">
          {started && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-body font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          )}
          {(completed || (started && count > 0)) && (
            <GradientButton
              onClick={handleSave}
              size="sm"
              disabled={saveMutation.isPending}
            >
              <Check className="w-4 h-4" />
              {saveMutation.isPending ? "Saving..." : "Save Session"}
            </GradientButton>
          )}
        </div>
      </motion.div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div className="surface rounded-xl border border-border p-5">
          <h2 className="text-heading font-semibold text-foreground mb-4">Recent Sessions</h2>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold",
                      s.completed
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {s.completed ? <Check className="w-4 h-4" /> : `${Math.round((s.count / s.target) * 100)}%`}
                  </div>
                  <div>
                    <p className="text-body font-medium text-foreground">
                      {s.count} / {s.target}
                    </p>
                    <p className="text-small text-muted-foreground">
                      {formatDuration(s.duration_seconds)} &middot; {s.session_date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation guard dialog */}
      <AnimatePresence>
        {showLeaveDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setShowLeaveDialog(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="surface w-full max-w-sm rounded-xl shadow-modal border border-border/50 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-heading font-semibold text-foreground mb-2">
                  Leave session?
                </h3>
                <p className="text-body text-muted-foreground mb-4">
                  You have an active jap session ({count}/{target}). Your progress will be lost.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowLeaveDialog(false)}
                    className="h-9 px-4 rounded-md text-body font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Stay
                  </button>
                  <button
                    onClick={() => navigate("/dashboard/naam-jap")}
                    className="h-9 px-4 rounded-md text-body font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    Leave
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
