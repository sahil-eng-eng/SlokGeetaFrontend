import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout, containerVariants, itemVariants } from "@/components/auth/AuthLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { GradientButton } from "@/components/ui/gradient-button";
import { useResetPasswordMutation } from "@/lib/api/endpoints/auth";
import { useToast } from "@/hooks/use-toast";
import type { ApiError } from "@/types";

const resetSchema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { toast } = useToast();
  const resetMutation = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { new_password: "", confirm: "" },
  });

  const onSubmit = (data: ResetValues) => {
    if (!token) {
      toast({ variant: "destructive", title: "Invalid link", description: "Reset token is missing. Please request a new link." });
      return;
    }
    resetMutation.mutate(
      { token, new_password: data.new_password },
      {
        onSuccess: () => {
          toast({ title: "Password updated", description: "You can now sign in with your new password." });
          navigate("/login");
        },
        onError: (error: ApiError) => {
          toast({
            variant: "destructive",
            title: "Reset failed",
            description: error.message || "Invalid or expired link. Please request a new one.",
          });
        },
      }
    );
  };

  return (
    <AuthLayout title="Reset password" subtitle="Enter your new password below.">
      <form onSubmit={handleSubmit(onSubmit)}>
        <motion.div variants={containerVariants} className="space-y-4">
          <motion.div variants={itemVariants}>
            <AuthInput
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={errors.new_password?.message}
              {...register("new_password")}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <AuthInput
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirm?.message}
              {...register("confirm")}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <GradientButton type="submit" className="w-full" disabled={resetMutation.isPending}>
              {resetMutation.isPending ? "Updating…" : "Update password"}
            </GradientButton>
          </motion.div>
        </motion.div>
      </form>
    </AuthLayout>
  );
}
