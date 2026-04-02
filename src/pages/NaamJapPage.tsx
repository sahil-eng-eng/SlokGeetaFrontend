import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Plus, Trophy, Target, Calendar, Clock, TrendingUp, Flame, Edit3,
  X, ChevronDown, ChevronRight, Star, CalendarDays, Filter,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { DatePicker } from "@/components/ui/date-picker";
import { format, differenceInDays, addDays, subDays, parseISO } from "date-fns";
import naamJapHero from "@/assets/naam-jap-hero.jpg";
import {
  useNaamTargetQuery,
  useSetNaamTargetMutation,
  useTodayEntriesQuery,
  useAddJapEntryMutation,
  useDeleteJapEntryMutation,
  useNaamJapHistoryQuery,
} from "@/lib/api/endpoints/naamJap";
import type { JapEntryResponse, DayLogResponse } from "@/types";

/* ── Helpers ── */
function computeStreak(history: DayLogResponse[]): number {
  let streak = 0;
  for (const day of history) {
    if (day.total > 0) streak++;
    else break;
  }
  return streak;
}

export default function NaamJapPage() {
  /* ── API ── */
  const { data: targetData } = useNaamTargetQuery();
  const { data: todayData, isLoading: todayLoading } = useTodayEntriesQuery();

  /* ── History filter state (default: last 7 days) ── */
  const [historyFrom, setHistoryFrom] = useState(
    format(subDays(new Date(), 6), "yyyy-MM-dd")
  );
  const [historyTo, setHistoryTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: historyData } = useNaamJapHistoryQuery({
    fromDate: historyFrom,
    toDate: historyTo,
    limit: 90,
  });
  const setTargetMutation = useSetNaamTargetMutation();
  const addEntryMutation = useAddJapEntryMutation();
  const deleteEntryMutation = useDeleteJapEntryMutation();

  const target = targetData?.data ?? null;
  const todayEntries: JapEntryResponse[] = todayData?.data ?? [];
  const history: DayLogResponse[] = historyData?.data ?? [];

  /* ── Target editing state ── */
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetForm, setTargetForm] = useState({ startDate: "", endDate: "", totalGoal: "" });

  /* ── Add entry state ── */
  const [addOpen, setAddOpen] = useState(false);
  const [newSlot, setNewSlot] = useState("");
  const [newCount, setNewCount] = useState("");

  /* ── History expand ── */
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  /* ── Calculations ── */
  const todayTotal = todayEntries.reduce((s, e) => s + e.count, 0);
  const historyTotal = history.reduce((s, d) => s + d.total, 0);
  const grandTotal = todayTotal + historyTotal;
  const streak = computeStreak([
    { date: format(new Date(), "yyyy-MM-dd"), entries: todayEntries, total: todayTotal },
    ...history,
  ]);

  const daysRemaining = target
    ? Math.max(differenceInDays(parseISO(target.end_date), new Date()), 0)
    : 0;
  const goalTotal = target?.total_goal ?? 100000;
  const remaining = Math.max(goalTotal - grandTotal, 0);
  const dailyAvgNeeded = daysRemaining > 0 ? Math.ceil(remaining / daysRemaining) : 0;
  const progress = Math.min((grandTotal / goalTotal) * 100, 100);
  const todayAchieved = dailyAvgNeeded > 0 && todayTotal >= dailyAvgNeeded;

  /* ── Handlers ── */
  const handleAdd = () => {
    if (!newSlot || !newCount) return;
    addEntryMutation.mutate(
      {
        entry_date: format(new Date(), "yyyy-MM-dd"),
        time_slot: newSlot,
        count: parseInt(newCount) || 0,
      },
      {
        onSuccess: () => {
          setNewSlot("");
          setNewCount("");
          setAddOpen(false);
        },
      }
    );
  };

  const removeEntry = (id: string) => deleteEntryMutation.mutate(id);

  const openEditTarget = () => {
    setTargetForm({
      startDate: target?.start_date ?? format(new Date(), "yyyy-MM-dd"),
      endDate: target?.end_date ?? format(addDays(new Date(), 364), "yyyy-MM-dd"),
      totalGoal: (target?.total_goal ?? 100000).toString(),
    });
    setEditingTarget(true);
  };

  const applyPreset = (days: number) => {
    setHistoryFrom(format(subDays(new Date(), days - 1), "yyyy-MM-dd"));
    setHistoryTo(format(new Date(), "yyyy-MM-dd"));
  };

  const saveTarget = () => {
    if (!targetForm.startDate || !targetForm.endDate || !targetForm.totalGoal) return;
    setTargetMutation.mutate(
      {
        start_date: targetForm.startDate,
        end_date: targetForm.endDate,
        total_goal: parseInt(targetForm.totalGoal) || 100000,
      },
      { onSuccess: () => setEditingTarget(false) }
    );
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded overflow-hidden h-40"
      >
        <img src={naamJapHero} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/30 to-transparent" />
        <div className="relative z-10 flex items-end justify-between h-full px-6 pb-5">
          <div>
            <h1 className="text-[1.5rem] font-display font-bold text-white">🙏 Naam Jap Tracker</h1>
            <p className="text-[13px] text-white/75 mt-1">Track your daily chanting and achieve your goals</p>
          </div>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-orange-500/25 backdrop-blur-sm text-white text-[12px] font-semibold border border-orange-400/30"
              >
                <Flame className="w-3.5 h-3.5 text-orange-300" /> {streak} day streak
              </motion.span>
            )}
            <GradientButton size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Log Chanting
            </GradientButton>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Today's Chants",
            value: todayTotal.toLocaleString(),
            icon: Star,
            color: "text-accent",
            bgColor: "bg-accent/10",
            border: "border-accent/20 hover:border-accent/40",
          },
          {
            label: "Total Chanted",
            value: grandTotal.toLocaleString(),
            icon: TrendingUp,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            border: "border-emerald-500/20 hover:border-emerald-500/40",
          },
          {
            label: "Daily Avg Needed",
            value: dailyAvgNeeded > 0 ? dailyAvgNeeded.toLocaleString() : "—",
            icon: Target,
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
            border: "border-amber-500/20 hover:border-amber-500/40",
          },
          {
            label: "Days Remaining",
            value: target ? (daysRemaining > 0 ? daysRemaining.toString() : "🎉") : "—",
            icon: CalendarDays,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            border: "border-purple-500/20 hover:border-purple-500/40",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`surface rounded border ${stat.border} p-4 transition-colors`}
          >
            <div className={`w-9 h-9 rounded ${stat.bgColor} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-[18px] h-[18px] ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
            <p className="text-small text-muted-foreground mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Target + Progress */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="surface rounded border border-border p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" /> Goal Target
          </h2>
          <button
            onClick={openEditTarget}
            className="inline-flex items-center gap-1 text-small text-accent hover:text-accent-glow font-medium transition-colors"
          >
            <Edit3 className="w-3 h-3" /> {target ? "Edit" : "Set Target"}
          </button>
        </div>

        {target ? (
          <div className="space-y-4">
            {/* Target info row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Start", value: format(parseISO(target.start_date), "MMM d, yy") },
                { label: "End", value: format(parseISO(target.end_date), "MMM d, yy") },
                { label: "Goal", value: target.total_goal.toLocaleString() },
                { label: "Remaining", value: remaining.toLocaleString() },
              ].map((item) => (
                <div key={item.label} className="p-2.5 rounded bg-muted/50 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{item.label}</p>
                  <p className="text-[13px] font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-small mb-1.5">
                <span className="text-muted-foreground">{grandTotal.toLocaleString()} chanted</span>
                <span className="font-semibold text-foreground">
                  {grandTotal > goalTotal
                    ? `${((grandTotal / goalTotal) * 100).toFixed(1)}%`
                    : `${progress.toFixed(1)}%`}
                </span>
              </div>
              {/* Multi-color bar: blue→yellow→orange→green, with gold overflow extension */}
              <div className="relative h-3 bg-muted rounded-sm overflow-visible">
                {/* Main progress fill: color changes by stage */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-sm absolute top-0 left-0"
                  style={{
                    background:
                      progress < 25
                        ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
                        : progress < 50
                          ? "linear-gradient(90deg, #eab308, #facc15)"
                          : progress < 75
                            ? "linear-gradient(90deg, #f97316, #fb923c)"
                            : "linear-gradient(90deg, #22c55e, #4ade80)",
                  }}
                />
                {/* Overflow bar: shown when grandTotal exceeds goalTotal */}
                {grandTotal > goalTotal && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(((grandTotal - goalTotal) / goalTotal) * 100, 50)}%`,
                    }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                    className="h-full absolute top-0 left-full rounded-r-sm"
                    style={{ background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }}
                    title={`+${(grandTotal - goalTotal).toLocaleString()} beyond goal`}
                  />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0</span>
                {grandTotal > goalTotal && (
                  <span className="text-amber-500 font-medium">
                    +{(grandTotal - goalTotal).toLocaleString()} beyond goal
                  </span>
                )}
                <span>{goalTotal.toLocaleString()}</span>
              </div>
            </div>

            {progress >= 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-center"
              >
                <Trophy className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-heading font-bold text-emerald-600 dark:text-emerald-400">Target Achieved! 🎉</p>
                <p className="text-small text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                  Incredible dedication! Set a new target to keep growing.
                </p>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-body text-muted-foreground">No target set yet</p>
            <button
              onClick={openEditTarget}
              className="inline-flex items-center gap-1 text-small text-accent hover:text-accent-glow font-medium mt-2 transition-colors"
            >
              Set your first goal <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Today + History — resizable split */}
      <PanelGroup
        direction="horizontal"
        className="!overflow-visible gap-3"
        style={{ display: "flex", alignItems: "start" }}
      >
        <Panel defaultSize={45} minSize={30} className="min-w-0">
      {/* Today's Summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="surface rounded border border-border p-5 h-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" /> Today's Sessions
          </h2>
          <div className="flex items-center gap-2">
            {dailyAvgNeeded > 0 && (
              <span
                className={`text-small font-semibold px-2.5 py-1 rounded-full ${
                  todayAchieved
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {todayTotal} / {dailyAvgNeeded} needed
              </span>
            )}
            <GradientButton size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </GradientButton>
          </div>
        </div>

        {/* Today's mini progress bar */}
        {dailyAvgNeeded > 0 && (
          <div className="mb-4">
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((todayTotal / dailyAvgNeeded) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  todayAchieved
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : "bg-gradient-to-r from-accent to-accent-glow"
                }`}
              />
            </div>
          </div>
        )}

        {todayAchieved && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5"
          >
            <Trophy className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-body font-semibold text-emerald-600 dark:text-emerald-400">Daily target achieved! 🎉</p>
              <p className="text-small text-emerald-600/70 dark:text-emerald-400/70">Keep going to build your streak!</p>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          {todayLoading ? (
            <div className="py-6 text-center">
              <Clock className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2 animate-pulse" />
              <p className="text-small text-muted-foreground">Loading…</p>
            </div>
          ) : todayEntries.length > 0 ? (
            todayEntries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded border border-border hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-foreground">{entry.time_slot}</p>
                    <p className="text-small text-muted-foreground">{entry.count.toLocaleString()} chants</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-body font-bold text-accent">{entry.count}</span>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-body text-muted-foreground">No sessions logged today</p>
              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-1 text-small text-accent hover:text-accent-glow font-medium mt-1.5 transition-colors"
              >
                Start your first session <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
        </Panel>

        <PanelResizeHandle className="w-1.5 flex items-center justify-center cursor-col-resize group">
          <div className="w-0.5 h-16 rounded-full bg-border group-hover:bg-accent transition-colors" />
        </PanelResizeHandle>

        <Panel defaultSize={55} minSize={30} className="min-w-0">
      {/* History */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="surface rounded border border-border p-5 h-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-heading text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" /> Chanting History
          </h2>
          {/* Date range filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              {[7, 30].map((n) => (
                <button
                  key={n}
                  onClick={() => applyPreset(n)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    historyFrom === format(subDays(new Date(), n - 1), "yyyy-MM-dd") &&
                    historyTo === format(new Date(), "yyyy-MM-dd")
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}d
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-muted-foreground" />
              <DatePicker
                value={historyFrom}
                onChange={setHistoryFrom}
                placeholder="From"
                toDate={historyTo ? parseISO(historyTo) : undefined}
                className="w-36"
              />
              <span className="text-muted-foreground text-[11px]">–</span>
              <DatePicker
                value={historyTo}
                onChange={setHistoryTo}
                placeholder="To"
                fromDate={historyFrom ? parseISO(historyFrom) : undefined}
                className="w-36"
              />
            </div>
          </div>
        </div>
        {history.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground/25 mx-auto mb-2" />
            <p className="text-body text-muted-foreground">No history yet — start logging!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((day) => {
              const achieved = dailyAvgNeeded > 0 && day.total >= dailyAvgNeeded;
              const expanded = expandedDay === day.date;
              const dayDate = parseISO(day.date);
              return (
                <div key={day.date} className="border border-border rounded overflow-hidden">
                  <button
                    onClick={() => setExpandedDay(expanded ? null : day.date)}
                    className="flex items-center justify-between w-full p-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <div className="text-left">
                        <span className="text-body font-semibold text-foreground">
                          {format(dayDate, "EEEE, MMM d")}
                        </span>
                        <p className="text-small text-muted-foreground">
                          {day.entries.length} session{day.entries.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Mini progress bar */}
                      {dailyAvgNeeded > 0 && day.total > 0 && (
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${achieved ? "bg-emerald-500" : "bg-accent"}`}
                            style={{ width: `${Math.min((day.total / dailyAvgNeeded) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                      {day.total === 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-500/10 text-red-500">
                          Missed
                        </span>
                      ) : achieved ? (
                        <>
                          <span className="text-body font-bold text-emerald-600 dark:text-emerald-400">
                            {day.total.toLocaleString()}
                          </span>
                          <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                        </>
                      ) : (
                        <span className="text-body font-bold text-amber-500">
                          {day.total.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </button>
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-border"
                      >
                        <div className="px-4 py-3 space-y-1.5 bg-muted/20">
                          {day.entries.length > 0 ? (
                            day.entries.map((e) => (
                              <div
                                key={e.id}
                                className="flex items-center justify-between text-small py-1.5 px-2 rounded hover:bg-muted/40 transition-colors"
                              >
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" /> {e.time_slot}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {e.count.toLocaleString()} chants
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-small text-muted-foreground py-2 text-center">
                              No sessions recorded.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
        </Panel>
      </PanelGroup>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {addOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setAddOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="surface w-full max-w-sm rounded shadow-modal border border-accent/15 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-heading text-foreground">Log Chanting Session</h2>
                    <p className="text-small text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMMM d")}</p>
                  </div>
                  <button
                    onClick={() => setAddOpen(false)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Time Slot</label>
                    <input
                      value={newSlot}
                      onChange={(e) => setNewSlot(e.target.value)}
                      placeholder="e.g., 6:00 AM – 7:00 AM"
                      className="flex h-10 w-full rounded border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Number of Chants</label>
                    <input
                      type="number"
                      value={newCount}
                      onChange={(e) => setNewCount(e.target.value)}
                      placeholder="e.g., 108"
                      className="flex h-10 w-full rounded border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {[27, 54, 108, 216, 324, 432].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNewCount(n.toString())}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                            newCount === n.toString()
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAddOpen(false)}
                      className="h-10 px-4 rounded text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <GradientButton
                      size="sm"
                      onClick={handleAdd}
                      disabled={addEntryMutation.isPending || !newSlot || !newCount}
                    >
                      {addEntryMutation.isPending ? "Adding…" : "Add Session"}
                    </GradientButton>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Target Modal */}
      <AnimatePresence>
        {editingTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setEditingTarget(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="surface w-full max-w-md rounded shadow-modal border border-accent/15 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-heading text-foreground">{target ? "Edit Goal" : "Set Your Goal"}</h2>
                    <p className="text-small text-muted-foreground mt-0.5">Define your chanting target</p>
                  </div>
                  <button
                    onClick={() => setEditingTarget(false)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-small font-medium text-foreground">Start Date</label>
                      <DatePicker
                        value={targetForm.startDate}
                        onChange={(v) => setTargetForm((p) => ({ ...p, startDate: v }))}
                        placeholder="Pick start date"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-small font-medium text-foreground">End Date</label>
                      <DatePicker
                        value={targetForm.endDate}
                        onChange={(v) => setTargetForm((p) => ({ ...p, endDate: v }))}
                        placeholder="Pick end date"
                        fromDate={targetForm.startDate ? parseISO(targetForm.startDate) : undefined}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Total Goal (chants)</label>
                    <input
                      type="number"
                      value={targetForm.totalGoal}
                      onChange={(e) => setTargetForm((p) => ({ ...p, totalGoal: e.target.value }))}
                      placeholder="e.g., 100000"
                      className="flex h-10 w-full rounded border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {[1080, 10800, 100000, 108000, 1000000].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setTargetForm((p) => ({ ...p, totalGoal: n.toString() }))}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                            targetForm.totalGoal === n.toString()
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {n.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                  {targetForm.startDate && targetForm.endDate && targetForm.totalGoal && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded bg-accent/5 border border-accent/15 text-small text-muted-foreground space-y-1"
                    >
                      <p>
                        Duration:{" "}
                        <span className="text-foreground font-semibold">
                          {differenceInDays(parseISO(targetForm.endDate), parseISO(targetForm.startDate)) + 1} days
                        </span>
                      </p>
                      <p>
                        Daily average:{" "}
                        <span className="text-foreground font-semibold">
                          {Math.ceil(
                            (parseInt(targetForm.totalGoal) || 0) /
                              Math.max(
                                differenceInDays(parseISO(targetForm.endDate), parseISO(targetForm.startDate)) + 1,
                                1
                              )
                          ).toLocaleString()}
                        </span>{" "}
                        chants/day
                      </p>
                    </motion.div>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingTarget(false)}
                      className="h-10 px-4 rounded text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <GradientButton size="sm" onClick={saveTarget} disabled={setTargetMutation.isPending}>
                      {setTargetMutation.isPending ? "Saving…" : "Save Goal"}
                    </GradientButton>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
