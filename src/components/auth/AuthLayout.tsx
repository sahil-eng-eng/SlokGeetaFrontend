import { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

// Floating orb component for animated background blobs
function Orb({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={className} style={style} />;
}

function VedicPanel() {
  return (
    // Pure image — zero overlays, zero text
    <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
      <img
        src="/images/vedicImage.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
    </div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
};

export { containerVariants, itemVariants };

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background">
      <VedicPanel />

      {/* ── Form panel ── */}
      <div className="auth-form-scope w-full lg:w-[45%] relative flex items-center justify-center p-6 lg:p-10 overflow-x-hidden overflow-y-auto">

        {/* Animated gradient background */}
        <div className="absolute inset-0 auth-panel-bg" />

        {/* Floating orbs */}
        <Orb className="auth-orb auth-orb-1" />
        <Orb className="auth-orb auth-orb-2" />
        <Orb className="auth-orb auth-orb-3" />

        {/* Mobile vedic image strip */}
        <div className="lg:hidden w-full h-28 absolute top-0 left-0 overflow-hidden">
          <img
            src="/images/vedicImage.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 0%, var(--auth-panel-solid) 100%)" }} />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[360px] py-6 relative z-10"
        >
          {/* Brand mark */}
          <motion.div variants={itemVariants} className="mb-7">

            <h1 className="text-display text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-body text-muted-foreground mt-1.5">{subtitle}</p>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            {children}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
