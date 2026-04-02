import * as React from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string; // "yyyy-MM-dd"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  fromDate?: Date;
  toDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
  fromDate,
  toDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? parseISO(value) : undefined;

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      onChange(format(day, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded border border-input bg-background px-3 text-[13px] text-foreground transition-all",
            "hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
            !value && "text-muted-foreground/60",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="flex-1 text-left truncate">
            {selected ? format(selected, "MMM d, yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[200]" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          fromDate={fromDate}
          toDate={toDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
