import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout, containerVariants, itemVariants } from "@/components/auth/AuthLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { GradientButton } from "@/components/ui/gradient-button";
import { useForgotPasswordMutation } from "@/lib/api/endpoints/auth";
import { useToast } from "@/hooks/use-toast";
import type { ApiError } from "@/types";

const forgotSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const { toast } = useToast();
  const forgotMutation = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: ForgotValues) => {
    forgotMutation.mutate(data, {
      onSuccess: () => {
        setSubmittedEmail(data.email);
        setSent(true);
      },
      onError: (error: ApiError) => {
        toast({
          variant: "destructive",
          title: "Request failed",
          description: error.message || "Could not send reset email. Please try again.",
        });
      },
    });
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle={sent ? "Check your email for a reset link." : "Enter your email to receive a password reset link."}
    >
      {!sent ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <motion.div variants={containerVariants} className="space-y-4">
            <motion.div variants={itemVariants}>
              <AuthInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email")}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <GradientButton type="submit" className="w-full" disabled={forgotMutation.isPending}>
                {forgotMutation.isPending ? "Sending…" : "Send reset link"}
              </GradientButton>
            </motion.div>
          </motion.div>
        </form>
      ) : (
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-body text-muted-foreground">We sent a link to <span className="font-medium text-foreground">{submittedEmail}</span></p>
        </div>
      )}
      <p className="mt-6 text-center text-small text-muted-foreground">
        <Link to="/login" className="text-accent hover:text-accent/80 font-medium transition-colors">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
