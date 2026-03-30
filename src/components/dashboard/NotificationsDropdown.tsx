import { CheckCircle, MessageSquare, BookOpen, GitBranch, Share2, Clock } from "lucide-react";

const mockNotifications = [
  { id: "1", icon: MessageSquare, text: "Scholar B raised a meaning on Chapter 2, Verse 47", time: "2m ago", unread: true, color: "text-accent" },
  { id: "2", icon: CheckCircle, text: "Your meaning on Verse 14 was approved", time: "1h ago", unread: true, color: "text-success" },
  { id: "3", icon: Share2, text: "Dr. Sharma shared 'Yoga Sutras' with you", time: "3h ago", unread: false, color: "text-accent" },
  { id: "4", icon: GitBranch, text: "Scholar C added an interpretation to your meaning", time: "5h ago", unread: false, color: "text-muted-foreground" },
  { id: "5", icon: BookOpen, text: "New sloka added to Bhagavad Gita by admin", time: "1d ago", unread: false, color: "text-muted-foreground" },
];

interface Props {
  onClose: () => void;
}

export function NotificationsDropdown({ onClose }: Props) {
  return (
    <div className="absolute right-0 top-full mt-1 w-80 rounded-xl border border-border surface shadow-elevated z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-foreground">Notifications</h3>
        <span className="text-[11px] text-accent font-medium cursor-pointer hover:underline">Mark all read</span>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {mockNotifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/50 last:border-0 ${
              n.unread ? "bg-accent/[0.03]" : ""
            }`}
          >
            <n.icon className={`w-4 h-4 shrink-0 mt-0.5 ${n.color}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[12px] leading-relaxed ${n.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {n.text}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {n.time}
              </p>
            </div>
            {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />}
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-border">
        <button className="text-[12px] text-accent font-medium hover:underline w-full text-center">
          View all notifications
        </button>
      </div>
    </div>
  );
}
