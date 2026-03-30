import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="text-small font-medium text-foreground">{label}</label>
        <input
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded border border-input bg-background px-3 py-1.5 text-sm text-foreground",
            "transition-colors duration-200",
            "placeholder:text-muted-foreground/60",
            "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus:ring-destructive/20 focus:border-destructive",
            className
          )}
          {...props}
        />
        {error && <p className="text-small text-destructive">{error}</p>}
      </div>
    );
  }
);
AuthInput.displayName = "AuthInput";
// hh