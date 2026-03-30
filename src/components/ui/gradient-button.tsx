import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "gradient" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = "gradient", size = "default", children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

    const variants = {
      gradient: "btn-gradient text-sm",
      outline: "border border-input bg-background hover:bg-muted text-foreground text-sm",
      ghost: "hover:bg-muted text-muted-foreground hover:text-foreground text-sm",
    };

    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-10 px-6",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
GradientButton.displayName = "GradientButton";

export { GradientButton };
