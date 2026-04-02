import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, BookOpen, ScrollText, ArrowRight, AlertCircle, CheckCircle, Clock, MessageSquare, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockBooks, mockSlokas } from "@/data/mockSlokas";
import heroImg from "@/assets/hero-spiritual.jpg";
import { useCurrentUserQuery } from "@/lib/api/endpoints/auth";

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const duration = 800;
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(start + (value - start) * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return <>{display.toLocaleString()}</>;
}

const stats = [
  { label: "Total Books", value: 12, icon: BookOpen, color: "bg-accent/10 text-accent" },
  { label: "Total Slokas", value: 248, icon: ScrollText, color: "bg-success/10 text-success" },
  { label: "Pending Approvals", value: 5, icon: AlertCircle, color: "bg-warning/10 text-warning" },
  { label: "Your Contributions", value: 36, icon: TrendingUp, color: "bg-accent/10 text-accent" },
];

const activityFeed = [
  { icon: MessageSquare, text: "Scholar B raised a meaning on Chapter 2, Verse 47", time: "2m ago", iconColor: "text-accent" },
  { icon: CheckCircle, text: "Your interpretation of Verse 14 was approved", time: "1h ago", iconColor: "text-success" },
  { icon: BookOpen, text: "New sloka added to Bhagavad Gita", time: "3h ago", iconColor: "text-muted-foreground" },
  { icon: Users, text: "Dr. Sharma started following your Yoga Sutras book", time: "5h ago", iconColor: "text-accent" },
];

const pendingApprovals = [
  { id: "p1", author: "Scholar D", text: "The verse establishes the principle of Nishkama Karma...", sloka: "Chapter 2, Verse 47", time: "2h ago" },
  { id: "p2", author: "Scholar B", text: "Modern psychology supports this: process-oriented thinking...", sloka: "Chapter 2, Verse 47", time: "4h ago" },
];

export default function DashboardHome() {
  const navigate = useNavigate();
  const { data: userData } = useCurrentUserQuery();
  const role = userData?.data?.role ?? "user";
  const isAdmin = role === "admin" || role === "superadmin";

  return (
    <div className="space-y-6">
      {/* Admin Panel Banner */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 rounded border border-accent/20 bg-accent/5 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/10 text-accent shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">Admin workspace available</p>
              <p className="text-[11px] text-muted-foreground">Manage granths, pages and publishing.</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-1.5 rounded border border-accent/20 bg-accent text-white px-3 py-1.5 text-[12px] font-medium transition-all hover:bg-accent/90 shrink-0"
          >
            Admin Panel <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded overflow-hidden h-44 sm:h-52"
      >
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-8">
          <h1 className="text-[1.5rem] sm:text-[1.75rem] font-display font-bold text-white leading-tight">
            Welcome back
          </h1>
          <p className="text-[13px] text-white/70 mt-1.5 max-w-md">
            Here's what's happening in your library today.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="surface rounded border border-border p-4 hover:shadow-elevated transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-display text-foreground">
              <AnimatedNumber value={stat.value} delay={i * 100} />
            </p>
            <p className="text-small text-muted-foreground mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Approvals */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="lg:col-span-2 surface rounded border border-border p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              Pending Approvals
            </h2>
            <span className="text-small text-muted-foreground">{pendingApprovals.length} waiting</span>
          </div>
          <div className="space-y-2">
            {pendingApprovals.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded border border-warning/20 bg-warning/[0.02] hover:bg-warning/[0.04] cursor-pointer transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-warning/10 flex items-center justify-center text-warning shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-foreground">{item.author} <span className="text-muted-foreground font-normal">on {item.sloka}</span></p>
                  <p className="text-small text-muted-foreground mt-0.5 line-clamp-1">{item.text}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="surface rounded border border-border p-5"
        >
          <h2 className="text-heading text-foreground mb-4">Activity</h2>
          <div className="space-y-3">
            {activityFeed.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-start gap-2.5"
              >
                <item.icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${item.iconColor}`} />
                <div className="min-w-0">
                  <p className="text-[12px] text-foreground leading-relaxed">{item.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Books */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="surface rounded border border-border p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading text-foreground">Recent Books</h2>
            <button
              onClick={() => navigate("/dashboard/library")}
              className="text-small text-accent hover:text-accent-glow font-medium inline-flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {mockBooks.slice(0, 4).map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                onClick={() => navigate(`/dashboard/library/${book.id}`)}
                className="flex items-center gap-3 p-2.5 rounded hover:bg-muted/50 cursor-pointer transition-colors group"
              >
                <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-foreground group-hover:text-accent transition-colors truncate">{book.title}</p>
                  <p className="text-small text-muted-foreground">{book.slokaCount} slokas • {book.author}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Slokas */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
          className="surface rounded border border-border p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading text-foreground">Recent Slokas</h2>
            <button
              onClick={() => navigate("/dashboard/library/b1")}
              className="text-small text-accent hover:text-accent-glow font-medium inline-flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {mockSlokas.map((sloka, i) => (
              <motion.div
                key={sloka.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.05 }}
                onClick={() => navigate(`/dashboard/slokas/${sloka.id}`)}
                className="p-2.5 rounded hover:bg-muted/50 cursor-pointer transition-colors group"
              >
                <p className="text-body font-medium text-foreground group-hover:text-accent transition-colors">{sloka.title}</p>
                <p className="text-small text-muted-foreground mt-0.5 line-clamp-1">{sloka.text.split('\n')[0]}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
