import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout, containerVariants, itemVariants } from "@/components/auth/AuthLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { GradientButton } from "@/components/ui/gradient-button";
import { useVerifyEmailMutation, useResendOtpMutation } from "@/lib/api/endpoints/auth";
import { useToast } from "@/hooks/use-toast";
import type { ApiError } from "@/types";

const verifySchema = z.object({
  token: z.string().trim().min(1, "Verification code is required"),
});

type VerifyValues = z.infer<typeof verifySchema>;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const email: string | undefined = (location.state as { email?: string })?.email;

  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useResendOtpMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { token: "" },
  });

  const onSubmit = (data: VerifyValues) => {
    verifyMutation.mutate(data.token, {
      onSuccess: () => {
        toast({ title: "Email verified", description: "Your account is now active." });
        navigate("/login");
      },
      onError: (error: ApiError) => {
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: error.message || "Invalid or expired code. Please try again.",
        });
      },
    });
  };

  const handleResend = () => {
    if (!email) {
      toast({ variant: "destructive", title: "Cannot resend", description: "Email address not found." });
      return;
    }
    resendMutation.mutate(email, {
      onSuccess: () => {
        toast({ title: "Code resent", description: `A new verification code was sent to ${email}.` });
      },
      onError: (error: ApiError) => {
        toast({
          variant: "destructive",
          title: "Resend failed",
          description: error.message || "Could not resend the code. Please try again.",
        });
      },
    });
  };

  return (
    <AuthLayout title="Verify your email" subtitle="Enter the verification code sent to your email address.">
      <form onSubmit={handleSubmit(onSubmit)}>
        <motion.div variants={containerVariants} className="space-y-6">
          <motion.div variants={itemVariants}>
            <AuthInput
              label="Verification Code"
              placeholder="Enter your verification code"
              error={errors.token?.message}
              {...register("token")}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <GradientButton type="submit" className="w-full" disabled={verifyMutation.isPending}>
              {verifyMutation.isPending ? "Verifying…" : "Verify"}
            </GradientButton>
          </motion.div>
        </motion.div>
      </form>
      <p className="mt-6 text-center text-small text-muted-foreground">
        Didn't receive a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendMutation.isPending}
          className="text-accent hover:text-accent/80 font-medium transition-colors disabled:opacity-50"
        >
          {resendMutation.isPending ? "Resending…" : "Resend"}
        </button>
      </p>
    </AuthLayout>
  );
}
