import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Clock, Calendar, Trophy, History,
  ChevronDown, ChevronRight, Trash2, Gift, RotateCcw, Percent, CheckCircle2, Circle,
  Loader2, Pencil, Filter, ClipboardList,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { format, subDays, parseISO, isAfter } from "date-fns";
import {
  useScheduleVersionsQuery,
  useActiveScheduleVersionQuery,
  useCreateScheduleVersionMutation,
  useActivateScheduleVersionMutation,
  useUpdateScheduleVersionMutation,
  useSubmitCheckInMutation,
  useUpdateCheckInMutation,
  useScheduleCheckInsQuery,
  useTodayCheckInQuery,
} from "@/lib/api/endpoints/schedule";
import type { ScheduleItemType, CheckInItemType, CheckInResponse } from "@/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Display a schedule item's time range */
function formatItemTime(item: ScheduleItemType): string {
  if (item.start_time) {
    return item.end_time ? `${item.start_time}–${item.end_time}` : item.start_time;
  }
  return item.time ?? "";
}

/** Alignment label + colors */
function alignmentMeta(pct: number) {
  if (pct === 100) return { label: "Perfect", color: "text-success", bg: "bg-success/10" };
  if (pct >= 80) return { label: "Great", color: "text-success", bg: "bg-success/10" };
  if (pct >= 50) return { label: "Partial", color: "text-warning", bg: "bg-warning/10" };
  return { label: "Missed", color: "text-destructive", bg: "bg-destructive/10" };
}

export default function SchedulePage() {
  /* ── API ── */
  const { data: versionsData, isLoading: versionsLoading } = useScheduleVersionsQuery();
  const { data: activeData } = useActiveScheduleVersionQuery();
  const { data: checkInsData } = useScheduleCheckInsQuery(90);
  const { data: todayCheckInData } = useTodayCheckInQuery();
  const createVersionMutation = useCreateScheduleVersionMutation();
  const activateVersionMutation = useActivateScheduleVersionMutation();
  const updateVersionMutation = useUpdateScheduleVersionMutation();
  const submitCheckInMutation = useSubmitCheckInMutation();
  const updateCheckInMutation = useUpdateCheckInMutation();

  const versions = versionsData?.data ?? [];
  const activeVersion = activeData?.data ?? null;
  const allCheckIns = checkInsData?.data ?? [];
  const todayCheckIn = todayCheckInData?.data ?? null;

  /* ── UI state ── */
  const [showCreate, setShowCreate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [historyDays, setHistoryDays] = useState<7 | 14 | 30 | 90>(30);
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  // check-in being edited from history (null = today's new check-in)
  const [editingCheckIn, setEditingCheckIn] = useState<CheckInResponse | null>(null);
  // which version to show details for in history
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);

  /* Create/Edit form */
  const [newItems, setNewItems] = useState<ScheduleItemType[]>([{ id: "n1", start_time: "", end_time: "", activity: "" }]);
  const [newDays, setNewDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [newReward, setNewReward] = useState("");
  const [newRewardDays, setNewRewardDays] = useState("7");

  /* Check-in state */
  const [checkInItems, setCheckInItems] = useState<CheckInItemType[]>([]);

  const consecutiveAligned = allCheckIns.filter((c) => c.alignment >= 80).length;
  const rewardMet = activeVersion?.reward_days ? consecutiveAligned >= activeVersion.reward_days : false;

  // Filter check-ins by selected date range
  const cutoff = subDays(new Date(), historyDays);
  const checkIns = allCheckIns.filter((c) => isAfter(parseISO(c.check_in_date), cutoff));

  const addNewItem = () => setNewItems((p) => [...p, { id: Date.now().toString(), start_time: "", end_time: "", activity: "" }]);
  const removeNewItem = (id: string) => setNewItems((p) => p.filter((i) => i.id !== id));
  const updateNewItem = (id: string, field: "start_time" | "end_time" | "activity", val: string) =>
    setNewItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: val } : i)));

  const toggleDay = (day: string) =>
    setNewDays((p) => (p.includes(day) ? p.filter((d) => d !== day) : [...p, day]));

  const openCreateSchedule = () => {
    setEditingVersionId(null);
    setNewItems([{ id: "n1", start_time: "", end_time: "", activity: "" }]);
    setNewDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    setNewReward("");
    setNewRewardDays("7");
    setShowCreate(true);
  };

  const openEditVersion = (v: typeof activeVersion) => {
    if (!v) return;
    setEditingVersionId(v.id);
    setNewItems(
      v.items.map((item) => ({
        id: item.id,
        start_time: item.start_time ?? item.time ?? "",
        end_time: item.end_time ?? "",
        activity: item.activity,
      }))
    );
    setNewDays([...v.applies_to]);
    setNewReward(v.reward ?? "");
    setNewRewardDays(String(v.reward_days ?? 7));
    setShowCreate(true);
  };

  const saveSchedule = () => {
    const validItems = newItems.filter((i) => i.activity);
    if (validItems.length === 0) return;

    if (editingVersionId) {
      // Edit existing version
      updateVersionMutation.mutate(
        {
          versionId: editingVersionId,
          data: {
            items: validItems,
            applies_to: newDays,
            reward: newReward || null,
            reward_days: parseInt(newRewardDays) || null,
          },
        },
        {
          onSuccess: () => {
            setShowCreate(false);
            setEditingVersionId(null);
          },
        }
      );
    } else {
      // Create new version
      createVersionMutation.mutate(
        {
          items: validItems,
          applies_to: newDays,
          reward: newReward || undefined,
          reward_days: parseInt(newRewardDays) || undefined,
        },
        {
          onSuccess: () => {
            setShowCreate(false);
            setNewItems([{ id: "n1", start_time: "", end_time: "", activity: "" }]);
            setNewReward("");
            setNewRewardDays("7");
          },
        }
      );
    }
  };

  const switchVersion = (id: string) => {
    activateVersionMutation.mutate(id, {
      onSuccess: () => setShowHistory(false),
    });
  };

  const startCheckIn = () => {
    if (!activeVersion) return;
    setEditingCheckIn(null);
    // Merge existing today check-in items (preserve done states) with any newly-added schedule items
    if (todayCheckIn) {
      const existingMap = Object.fromEntries(todayCheckIn.items.map((i) => [i.id, i.done]));
      const merged: CheckInItemType[] = activeVersion.items.map((i) => ({
        id: i.id,
        activity: i.activity,
        done: existingMap[i.id] ?? false,
      }));
      setCheckInItems(merged);
    } else {
      setCheckInItems(activeVersion.items.map((i) => ({ id: i.id, activity: i.activity, done: false })));
    }
    setShowCheckIn(true);
  };

  const startEditCheckIn = (ci: CheckInResponse) => {
    setEditingCheckIn(ci);
    setCheckInItems(ci.items.map((i) => ({ id: i.id, activity: i.activity, done: i.done })));
    setShowCheckIn(true);
  };

  const toggleCheckItem = (id: string) =>
    setCheckInItems((p) => p.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));

  const checkInAlignment = checkInItems.length > 0
    ? Math.round((checkInItems.filter((i) => i.done).length / checkInItems.length) * 100)
    : 0;

  const saveCheckIn = () => {
    if (editingCheckIn) {
      // Editing a historical check-in
      updateCheckInMutation.mutate(
        { checkinId: editingCheckIn.id, data: { version_id: editingCheckIn.version_id ?? "", items: checkInItems } },
        { onSuccess: () => { setShowCheckIn(false); setEditingCheckIn(null); } }
      );
    } else {
      if (!activeVersion) return;
      submitCheckInMutation.mutate(
        { version_id: activeVersion.id, items: checkInItems },
        { onSuccess: () => setShowCheckIn(false) }
      );
    }
  };

  return (
    <div className="min-h-screen">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl mx-4 md:mx-6 mt-4 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        <div className="relative px-6 py-8 md:px-10 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                📋 Schedule
              </h1>
              <p className="text-body text-muted-foreground mt-1">
                Your daily timetable with version history and check-ins
              </p>
              {/* Quick stats row */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-accent" />
                  <span className="text-small font-medium text-foreground">{consecutiveAligned} aligned days</span>
                </div>
                {activeVersion?.reward_days && (
                  <div className="flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-accent" />
                    <span className="text-small text-muted-foreground">
                      {rewardMet ? "Reward earned!" : `${Math.min(consecutiveAligned, activeVersion.reward_days)}/${activeVersion.reward_days} days to reward`}
                    </span>
                  </div>
                )}
                {todayCheckIn && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span className="text-small text-muted-foreground">Today: {todayCheckIn.alignment}% aligned</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowHistory(true)}
                className="h-9 px-3 rounded-md border border-border text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors inline-flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" /> Versions
              </button>
              <GradientButton size="sm" onClick={openCreateSchedule}>
                <Plus className="w-4 h-4" /> New Schedule
              </GradientButton>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reward Banner (full width, shown when earned) ── */}
      <AnimatePresence>
        {rewardMet && activeVersion?.reward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mx-4 md:mx-6 mb-4 surface rounded-xl border border-success/30 bg-success/5 p-5 text-center"
          >
            <Trophy className="w-10 h-10 text-success mx-auto mb-2" />
            <p className="text-heading font-bold text-success">Congratulations! 🎉</p>
            <p className="text-body text-muted-foreground mt-1">You followed your schedule for {activeVersion.reward_days} days!</p>
            <p className="text-body font-medium text-foreground mt-2">
              Your reward: <span className="text-accent">{activeVersion.reward}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Split Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 md:px-6 pb-8">

        {/* ════════════════════ LEFT PANEL (col-span-1) ════════════════════ */}
        <div className="space-y-4">

          {/* Active Schedule Card */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface rounded-xl border border-border p-5">
        {versionsLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 text-muted-foreground/40 animate-spin mx-auto mb-2" />
            <p className="text-small text-muted-foreground">Loading schedule…</p>
          </div>
        ) : !activeVersion ? (
          <div className="py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-body text-muted-foreground mb-3">No schedule yet</p>
            <GradientButton size="sm" onClick={openCreateSchedule}>
              <Plus className="w-4 h-4 mr-1" /> Create first schedule
            </GradientButton>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-heading text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" /> Active Schedule
                </h2>
                <p className="text-small text-muted-foreground mt-0.5">
                  Applies to: {activeVersion.applies_to.join(", ")} · Created {format(new Date(activeVersion.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEditVersion(activeVersion)} className="h-8 px-3 rounded-md border border-border text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors inline-flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <GradientButton size="sm" onClick={startCheckIn}>
                  <CheckCircle2 className="w-4 h-4" /> Daily Check-in
                </GradientButton>
              </div>
            </div>

            {activeVersion.reward && (
              <div className="mb-4 p-3 rounded-lg bg-accent/5 border border-accent/10 flex items-center gap-2.5">
                <Gift className="w-4 h-4 text-accent shrink-0" />
                <div>
                  <p className="text-small font-medium text-foreground">Reward: {activeVersion.reward}</p>
                  <p className="text-[11px] text-muted-foreground">Follow this for {activeVersion.reward_days} days to earn it</p>
                </div>
              </div>
            )}

            {/* Today check-in status */}
            {todayCheckIn && (
              <div className={`mb-4 p-3 rounded-lg border flex items-center gap-2.5 ${todayCheckIn.alignment >= 80 ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${todayCheckIn.alignment >= 80 ? "text-success" : "text-warning"}`} />
                <p className="text-small font-medium text-foreground">
                  Today's check-in: <span className={todayCheckIn.alignment >= 80 ? "text-success" : "text-warning"}>{todayCheckIn.alignment}% aligned</span>
                </p>
              </div>
            )}

            <div className="space-y-1">
              {activeVersion.items.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="w-24 text-right shrink-0">
                    <span className="text-small font-medium text-accent">{formatItemTime(item)}</span>
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <p className="text-body text-foreground">{item.activity}</p>
                </motion.div>
              ))}
            </div>
          </>
        )}
          </motion.div>

          {/* ── Stats Card ── */}
          {activeVersion && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="surface rounded-xl border border-border p-5">
              <h2 className="text-heading text-foreground flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-accent" /> Progress
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-small text-muted-foreground">Aligned check-ins</span>
                  <span className="text-body font-semibold text-foreground">{consecutiveAligned}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-small text-muted-foreground">Total check-ins</span>
                  <span className="text-body font-semibold text-foreground">{allCheckIns.length}</span>
                </div>
                {activeVersion.reward && (
                  <div className="pt-3 border-t border-border/40">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Gift className="w-3.5 h-3.5 text-accent" />
                      <span className="text-small font-medium text-foreground">{activeVersion.reward}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-accent/70 transition-all duration-500"
                        style={{ width: `${Math.min((consecutiveAligned / (activeVersion.reward_days ?? 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      {rewardMet ? "Reward earned! 🎉" : `${Math.min(consecutiveAligned, activeVersion.reward_days ?? 0)}/${activeVersion.reward_days} days`}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </div>
        {/* ════════════════════ END LEFT PANEL ════════════════════ */}

        {/* ════════════════════ RIGHT PANEL (col-span-2) ════════════════════ */}
        <div className="lg:col-span-2 space-y-4">

        {/* Check-in Log */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="surface rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" /> Check-in History
          </h2>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {([7, 14, 30, 90] as const).map((n) => (
              <button key={n} onClick={() => setHistoryDays(n)} className={`h-7 px-2.5 rounded-md text-[11px] font-medium transition-all ${historyDays === n ? "bg-accent/15 text-accent border border-accent/30" : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"}`}>
                {n}d
              </button>
            ))}
          </div>
        </div>
        {checkIns.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground/25 mx-auto mb-2" />
            <p className="text-body text-muted-foreground">No check-ins yet — start your first daily check-in!</p>
          </div>
        ) : (
        <div className="space-y-2">
          {checkIns.map((ci) => {
            const expanded = expandedLog === ci.check_in_date;
            const ciVersion = ci.version_id ? versions.find((v) => v.id === ci.version_id) ?? null : null;
            return (
              <div key={ci.check_in_date} className="border border-border rounded-lg overflow-hidden">
                <button onClick={() => setExpandedLog(expanded ? null : ci.check_in_date)} className="flex items-center justify-between w-full p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span className="text-body font-medium text-foreground">{format(new Date(ci.check_in_date), "EEE, MMM d")}</span>
                  </div>
                  {(() => {
                    const m = alignmentMeta(ci.alignment);
                    return (
                      <span className={`inline-flex items-center gap-1 text-small font-semibold px-2.5 py-0.5 rounded-full ${m.bg} ${m.color}`}>
                        <Percent className="w-3 h-3" /> {ci.alignment}% · {m.label}
                      </span>
                    );
                  })()}
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-3 pb-3 pl-10 space-y-1">
                        {ci.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-small py-1">
                            {item.done ? <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
                            <span className={item.done ? "text-foreground" : "text-muted-foreground line-through"}>{item.activity}</span>
                          </div>
                        ))}
                        {/* Actions row */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border/40 mt-2">
                          <button
                            onClick={() => startEditCheckIn(ci)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent-glow transition-colors"
                          >
                            <Pencil className="w-3 h-3" /> Edit check-in
                          </button>
                          {ciVersion && (
                            <button
                              onClick={() => setViewingVersionId(ciVersion.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors ml-3"
                            >
                              <ClipboardList className="w-3 h-3" /> View schedule used
                            </button>
                          )}
                        </div>
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

        </div>
        {/* ════════════════════ END RIGHT PANEL ════════════════════ */}

      </div>
      {/* ════════════════════ END MAIN GRID ════════════════════ */}

      {/* ── Create Schedule Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" onClick={() => setShowCreate(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="surface w-full max-w-lg rounded-xl shadow-modal border border-border/50 p-6 my-8" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-heading text-foreground">{editingVersionId ? "Edit Schedule" : "Create Schedule"}</h2>
                  <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                </div>

                {/* Day selector */}
                <div className="mb-5 space-y-2">
                  <label className="text-small font-medium text-foreground">Applies to</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map((d) => (
                      <button key={d} type="button" onClick={() => toggleDay(d)} className={`px-3 py-1.5 rounded-md text-[12px] font-medium border transition-all ${newDays.includes(d) ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:text-foreground"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div className="mb-5 space-y-2">
                  <label className="text-small font-medium text-foreground">Timetable</label>
                  {newItems.map((item) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <input
                        type="time"
                        value={item.start_time ?? ""}
                        onChange={(e) => updateNewItem(item.id, "start_time", e.target.value)}
                        className="h-9 w-24 shrink-0 rounded-md border border-input bg-background px-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                        title="Start time"
                      />
                      <span className="text-muted-foreground text-[13px] shrink-0">–</span>
                      <input
                        type="time"
                        value={item.end_time ?? ""}
                        onChange={(e) => updateNewItem(item.id, "end_time", e.target.value)}
                        className="h-9 w-24 shrink-0 rounded-md border border-input bg-background px-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                        title="End time"
                      />
                      <input value={item.activity} onChange={(e) => updateNewItem(item.id, "activity", e.target.value)} placeholder="Activity" className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                      {newItems.length > 1 && (
                        <button onClick={() => removeNewItem(item.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={addNewItem} className="text-small text-accent hover:text-accent-glow font-medium inline-flex items-center gap-1 transition-colors mt-1">
                    <Plus className="w-3 h-3" /> Add item
                  </button>
                </div>

                {/* Reward */}
                <div className="mb-5 space-y-2">
                  <label className="text-small font-medium text-foreground flex items-center gap-1.5"><Gift className="w-3.5 h-3.5 text-accent" /> Self-Reward (optional)</label>
                  <input value={newReward} onChange={(e) => setNewReward(e.target.value)} placeholder="e.g., Buy a new book I've been wanting" className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                  <div className="flex items-center gap-2">
                    <span className="text-small text-muted-foreground whitespace-nowrap">Earn after</span>
                    <input type="number" value={newRewardDays} onChange={(e) => setNewRewardDays(e.target.value)} className="h-8 w-16 rounded-md border border-input bg-background px-2 text-[13px] text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                    <span className="text-small text-muted-foreground">days</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowCreate(false)} className="h-9 px-4 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Cancel</button>
                  <GradientButton size="sm" onClick={saveSchedule} disabled={createVersionMutation.isPending || updateVersionMutation.isPending}>
                    {(createVersionMutation.isPending || updateVersionMutation.isPending) ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Saving…</> : editingVersionId ? "Save Changes" : "Save Schedule"}
                  </GradientButton>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Version History Modal ── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" onClick={() => setShowHistory(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="surface w-full max-w-md rounded-xl shadow-modal border border-border/50 p-6 my-8" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-heading text-foreground">Schedule Versions</h2>
                  <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-3">
                  {versions.map((v) => (
                    <div key={v.id} className={`p-3 rounded-lg border transition-all ${v.is_active ? "border-accent bg-accent/5" : "border-border hover:bg-muted/30 cursor-pointer"}`} onClick={() => !v.is_active && switchVersion(v.id)}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-body font-medium text-foreground">Created {format(new Date(v.created_at), "MMM d, yyyy")}</span>
                        {v.is_active && <span className="text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">Active</span>}
                      </div>
                      <p className="text-small text-muted-foreground">{v.items.length} items · {v.applies_to.join(", ")}</p>
                      {!v.is_active && (
                        <button onClick={(e) => { e.stopPropagation(); switchVersion(v.id); }} className="text-small text-accent hover:text-accent-glow font-medium mt-1.5 inline-flex items-center gap-1 transition-colors">
                          <RotateCcw className="w-3 h-3" /> Switch to this
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Check-in Modal ── */}
      <AnimatePresence>
        {showCheckIn && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" onClick={() => setShowCheckIn(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="surface w-full max-w-md rounded-xl shadow-modal border border-border/50 p-6 my-8" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-heading text-foreground">
                    {editingCheckIn
                      ? `Edit Check-in — ${format(new Date(editingCheckIn.check_in_date), "EEE, MMM d")}`
                      : "Daily Check-in"}
                  </h2>
                  <button onClick={() => { setShowCheckIn(false); setEditingCheckIn(null); }} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <p className="text-small text-muted-foreground mb-4">Mark each item as done or not done for today.</p>

                <div className="space-y-1.5 mb-5">
                  {checkInItems.map((item) => (
                    <button key={item.id} type="button" onClick={() => toggleCheckItem(item.id)} className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all ${item.done ? "border-success/30 bg-success/5" : "border-border hover:bg-muted/30"}`}>
                      {item.done ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                      <span className={`text-body text-left ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.activity}</span>
                    </button>
                  ))}
                </div>

                {/* Alignment score */}
                <div className="p-4 rounded-lg bg-muted/50 text-center mb-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Today's Alignment</p>
                  <p className={`text-[28px] font-bold ${checkInAlignment >= 80 ? "text-success" : checkInAlignment >= 50 ? "text-warning" : "text-destructive"}`}>{checkInAlignment}%</p>
                </div>

                {checkInAlignment === 100 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-3 rounded-lg bg-success/10 border border-success/20 text-center mb-4">
                    <Trophy className="w-6 h-6 text-success mx-auto mb-1" />
                    <p className="text-body font-medium text-success">Perfect day! 🌟</p>
                  </motion.div>
                )}

                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowCheckIn(false); setEditingCheckIn(null); }} className="h-9 px-4 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Cancel</button>
                  <GradientButton size="sm" onClick={saveCheckIn} disabled={submitCheckInMutation.isPending || updateCheckInMutation.isPending}>
                    {(submitCheckInMutation.isPending || updateCheckInMutation.isPending) ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Saving…</> : editingCheckIn ? "Update Check-in" : "Save Check-in"}
                  </GradientButton>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── View Schedule Used (in check-in history) Modal ── */}
      <AnimatePresence>
        {viewingVersionId && (() => {
          const v = versions.find((x) => x.id === viewingVersionId);
          if (!v) return null;
          return (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" onClick={() => setViewingVersionId(null)} />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="surface w-full max-w-md rounded-xl shadow-modal border border-border/50 p-6 my-8" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-heading text-foreground flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-accent" /> Schedule Used
                    </h2>
                    <button onClick={() => setViewingVersionId(null)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                  <p className="text-small text-muted-foreground mb-3">
                    Created {format(new Date(v.created_at), "MMM d, yyyy")} · Applies to: {v.applies_to.join(", ")}
                    {v.is_active && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">Current</span>}
                  </p>
                  <div className="space-y-1">
                    {v.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                        <div className="w-20 text-right shrink-0">
                          <span className="text-small font-medium text-accent">{formatItemTime(item)}</span>
                        </div>
                        <div className="w-px h-5 bg-border" />
                        <p className="text-small text-foreground">{item.activity}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button onClick={() => setViewingVersionId(null)} className="h-9 px-4 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Close</button>
                  </div>
                </motion.div>
              </div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
