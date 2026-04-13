import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Check, Clock, Trophy, Sparkles, Dot } from "lucide-react";
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

// Smooth per-step colour interpolation for the progress ring
function lerpHsl(stops: [number, [number, number, number]][], t: number): string {
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, [h0, s0, l0]] = stops[i - 1];
      const [t1, [h1, s1, l1]] = stops[i];
      const u = (t - t0) / (t1 - t0);
      return `hsl(${Math.round(h0 + (h1 - h0) * u)} ${Math.round(s0 + (s1 - s0) * u)}% ${Math.round(l0 + (l1 - l0) * u)}%)`;
    }
  }
  const [h, s, l] = stops[stops.length - 1][1];
  return `hsl(${h} ${s}% ${l}%)`;
}

const JAP_COLOR_STOPS: [number, [number, number, number]][] = [
  [0,    [262, 70, 60]],  // accent purple
  [0.25, [215, 75, 58]],  // blue
  [0.5,  [45,  90, 60]],  // gold
  [0.75, [120, 58, 50]],  // green
  [1,    [145, 65, 42]],  // deep success green
];

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
  }, [started, completed, elapsed]);

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
  const remaining = Math.max(target - count, 0);
  const focusMode = started && !completed;

  // Smooth per-step colour transitions — changes with every single tap
  const pct = Math.round(progress * 100);
  const gradStop1 = lerpHsl(JAP_COLOR_STOPS, Math.max(0, progress - 0.12));
  const gradStop2 = lerpHsl(JAP_COLOR_STOPS, progress);
  // Track colour also responds to progress
  const trackOpacity = 0.3 + progress * 0.2;

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
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded border border-accent/20 surface px-5 py-5 sm:px-6 sm:py-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-success/10" />
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-success/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
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

            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded border border-accent/15 bg-background/70 px-2.5 py-1 text-small text-muted-foreground backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Focused chanting session
              </div>
              <h1 className="text-display text-foreground">Instant Naam Jap</h1>
              <p className="mt-1 max-w-2xl text-body text-muted-foreground">
                A calmer counting flow with smoother progress feedback and cleaner, more immersive spacing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[420px]">
            {[
              { label: "Target", value: target.toString() },
              { label: "Completed", value: count.toString() },
              { label: "Remaining", value: remaining.toString() },
              { label: "Time", value: formatDuration(elapsed) },
            ].map((item) => (
              <div key={item.label} className="rounded border border-accent/15 bg-background/80 px-3 py-2.5 backdrop-blur-sm">
                <p className="text-small text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-heading text-foreground tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className={`grid gap-6 ${!focusMode ? "xl:grid-cols-[280px_minmax(0,1fr)_320px]" : ""}`}>
        {!focusMode && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface rounded border border-accent/20 p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-heading text-foreground">Session target</p>
              <p className="text-small text-muted-foreground">Choose a count before you begin.</p>
            </div>
            <div className="rounded bg-accent/10 px-2.5 py-1 text-small font-medium text-accent">{target}</div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {TARGET_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => !started && setTarget(t)}
                disabled={started}
                className={cn(
                  "rounded border px-3 py-2 text-[13px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60",
                  target === t
                    ? "border-accent/30 bg-accent/10 text-accent shadow-surface"
                    : "border-accent/20 bg-background text-muted-foreground hover:border-accent/20 hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded border border-accent/15 bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-small text-muted-foreground">
              <Dot className="h-4 w-4 text-accent" />
              The target locks once the session starts.
            </div>
          </div>
        </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={focusMode ? handleTap : undefined}
          className={`relative overflow-hidden surface rounded border p-6 sm:p-8 transition-all duration-300 ${
            focusMode
              ? "border-accent/50 ring-2 ring-accent/20 shadow-[0_0_40px_hsl(var(--accent)/0.15)] cursor-pointer select-none"
              : "border-accent/20"
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-accent/10 via-accent/5 to-transparent" />
          <div className="relative flex flex-col items-center">
            <div className="relative mb-6 grid place-items-center">
              {/* Glow layers — intensify as progress rises */}
              <div
                className="absolute rounded-full blur-3xl transition-all duration-500"
                style={{
                  width: 176, height: 176,
                  background: `hsl(var(--accent) / ${0.06 + progress * 0.14})`,
                }}
              />
              <div
                className="absolute rounded-full blur-2xl transition-all duration-500"
                style={{
                  width: 112, height: 112,
                  background: completed
                    ? "hsl(var(--success) / 0.25)"
                    : `hsl(var(--accent) / ${0.04 + progress * 0.1})`,
                }}
              />
              <div className="relative h-56 w-56">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="jap-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={gradStop1} />
                      <stop offset="100%" stopColor={gradStop2} />
                    </linearGradient>
                  </defs>
                  {/* Track */}
                  <circle
                    cx="100" cy="100" r={radius}
                    fill="none"
                    stroke={`hsl(var(--muted) / ${trackOpacity})`}
                    strokeWidth="3"
                  />
                  {/* Progress arc */}
                  <motion.circle
                    cx="100" cy="100" r={radius}
                    fill="none"
                    stroke="url(#jap-grad)"
                    strokeWidth={completed ? 5 : 3}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    style={{ filter: progress > 0 ? `drop-shadow(0 0 ${4 + progress * 8}px ${gradStop2})` : "none" }}
                  />
                </svg>
                {/* Inner circle */}
                <div
                  className="absolute inset-0 m-5 flex flex-col items-center justify-center rounded-full border bg-background/85 shadow-elevated backdrop-blur-sm transition-all duration-500"
                  style={{
                    borderColor: completed
                      ? "hsl(var(--success) / 0.3)"
                      : `hsl(var(--accent) / ${0.1 + progress * 0.2})`,
                  }}
                >
                  <span className="text-2xl font-semibold text-foreground tabular-nums">{count}</span>
                  <span className="mt-0.5 text-small text-muted-foreground">of {target}</span>
                  <span
                    className="mt-1.5 text-[11px] font-semibold tabular-nums transition-colors duration-500"
                    style={{ color: gradStop2 }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6 flex items-center gap-1.5 rounded border border-accent/15 bg-background/70 px-3 py-2 text-body text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="tabular-nums">{formatDuration(elapsed)}</span>
            </div>

            <AnimatePresence>
              {completed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-5 flex items-center gap-2 rounded border border-success/20 bg-success/10 px-4 py-2.5 text-success"
                >
                  <Trophy className="w-5 h-5" />
                  <span className="text-body font-medium">Target reached — beautiful consistency.</span>
                </motion.div>
              )}
            </AnimatePresence>

            {focusMode && (
              <div className="flex flex-col items-center gap-2 mb-2">
                <p className="text-small text-accent/70 tracking-wide">Tap anywhere to count</p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  End session
                </button>
              </div>
            )}

            {!completed && !focusMode && (
              <button
                onClick={handleTap}
                className="w-full max-w-sm rounded border border-accent/20 bg-gradient-to-b from-accent/15 to-accent/10 px-6 py-4 text-heading font-semibold text-accent shadow-surface transition-all active:scale-[0.985] active:border-accent/30 active:bg-accent/20"
              >
                <span className="block text-heading">{started ? "Continue counting" : "Tap to begin"}</span>
                <span className="mt-1 block text-small font-normal text-muted-foreground">Each tap advances your live progress ring.</span>
              </button>
            )}

            {!focusMode && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {started && (
                  <button
                    onClick={handleReset}
                    className="inline-flex h-9 items-center gap-1.5 rounded border border-accent/20 px-4 text-body font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                )}
                {(completed || (started && count > 0)) && (
                  <GradientButton
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="h-9 rounded px-5"
                  >
                    <Check className="w-4 h-4" />
                    {saveMutation.isPending ? "Saving..." : "Save Session"}
                  </GradientButton>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {!focusMode && (
        <div className="space-y-4">
          <div className="surface rounded border border-accent/20 p-5">
            <h2 className="text-heading font-semibold text-foreground">Session feel</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: "Current target", value: `${target} names` },
                { label: "Remaining", value: `${remaining} left` },
                { label: "Completion", value: `${Math.round(progress * 100)}%` },
              ].map((item) => (
                <div key={item.label} className="rounded border border-accent/15 bg-muted/20 px-3 py-2.5">
                  <p className="text-small text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-body font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {sessions.length > 0 && (
            <div className="surface rounded border border-accent/20 p-5">
              <h2 className="mb-4 text-heading font-semibold text-foreground">Recent Sessions</h2>
              <div className="space-y-2">
                {sessions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded border border-accent/15 bg-muted/20 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded text-[11px] font-semibold",
                          s.completed ? "bg-success/10 text-success" : "bg-background text-muted-foreground"
                        )}
                      >
                        {s.completed ? <Check className="w-4 h-4" /> : `${Math.round((s.count / s.target) * 100)}%`}
                      </div>
                      <div>
                        <p className="text-body font-medium text-foreground">{s.count} / {s.target}</p>
                        <p className="text-small text-muted-foreground">{formatDuration(s.duration_seconds)} · {s.session_date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      <AnimatePresence>
        {showLeaveDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setShowLeaveDialog(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="surface w-full max-w-sm rounded border border-accent/15 p-6 shadow-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-2 text-heading font-semibold text-foreground">Leave session?</h3>
                <p className="mb-4 text-body text-muted-foreground">
                  You have an active jap session ({count}/{target}). Your progress will be lost.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowLeaveDialog(false)}
                    className="h-9 rounded px-4 text-body font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Stay
                  </button>
                  <button
                    onClick={() => navigate("/dashboard/naam-jap")}
                    className="h-9 rounded bg-destructive/10 px-4 text-body font-medium text-destructive transition-colors hover:bg-destructive/20"
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
