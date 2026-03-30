import { MeaningFilter as FilterType } from "@/types/sloka";
import { cn } from "@/lib/utils";
import { TrendingUp, Clock, Star, User } from "lucide-react";

interface MeaningFilterProps {
  active: FilterType;
  onChange: (filter: FilterType) => void;
}

const filters: { value: FilterType; label: string; icon: React.ElementType }[] = [
  { value: "most-voted", label: "Most Voted", icon: TrendingUp },
  { value: "newest", label: "Newest", icon: Clock },
  { value: "most-relevant", label: "Relevant", icon: Star },
  { value: "by-user", label: "By User", icon: User },
];

export function MeaningFilterBar({ active, onChange }: MeaningFilterProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-small font-medium transition-all",
            active === f.value
              ? "bg-surface text-foreground shadow-surface"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <f.icon className="w-3 h-3" />
          {f.label}
        </button>
      ))}
    </div>
  );
}
