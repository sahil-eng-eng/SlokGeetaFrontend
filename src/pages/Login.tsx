import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout, containerVariants, itemVariants } from "@/components/auth/AuthLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { GradientButton } from "@/components/ui/gradient-button";
import { useLoginMutation } from "@/lib/api/endpoints/auth";
import { useToast } from "@/hooks/use-toast";
import type { ApiError } from "@/types";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginValues) => {
    loginMutation.mutate(data, {
      onSuccess: (res) => {
        const role = res.data.user?.role ?? "user";
        const isAdmin = role === "admin" || role === "superadmin";
        navigate(isAdmin ? "/admin" : "/dashboard");
      },
      onError: (error: ApiError) => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "Invalid email or password.",
        });
      },
    });
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue.">
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
            <AuthInput
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
          </motion.div>
          <motion.div variants={itemVariants} className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-small text-accent hover:text-accent/80 transition-colors">
              Forgot password?
            </Link>
          </motion.div>
          <motion.div variants={itemVariants}>
            <GradientButton type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
            </GradientButton>
          </motion.div>
        </motion.div>
      </form>
      <p className="mt-6 text-center text-small text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/register" className="text-accent hover:text-accent/80 font-medium transition-colors">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
