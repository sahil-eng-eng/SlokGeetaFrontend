import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout, containerVariants, itemVariants } from "@/components/auth/AuthLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { GradientButton } from "@/components/ui/gradient-button";
import { useRegisterMutation } from "@/lib/api/endpoints/auth";
import { useToast } from "@/hooks/use-toast";
import type { ApiError } from "@/types";

const registerSchema = z
  .object({
    full_name: z.string().trim().min(1, "Full name is required").max(255, "Full name too long"),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(100, "Username too long")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string().trim().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const registerMutation = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", username: "", email: "", password: "", confirm: "" },
  });

  const onSubmit = (data: RegisterValues) => {
    const { confirm: _confirm, ...payload } = data;
    registerMutation.mutate(payload, {
      onSuccess: () => {
        toast({
          title: "Account created",
          description: "Please check your email for a verification code.",
        });
        navigate("/verify-otp", { state: { email: data.email } });
      },
      onError: (error: ApiError) => {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.message || "Something went wrong. Please try again.",
        });
      },
    });
  };

  return (
    <AuthLayout title="Create account" subtitle="Get started with your free account.">
      <form onSubmit={handleSubmit(onSubmit)}>
        <motion.div variants={containerVariants} className="space-y-4">
          <motion.div variants={itemVariants}>
            <AuthInput
              label="Full Name"
              placeholder="John Doe"
              error={errors.full_name?.message}
              {...register("full_name")}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <AuthInput
              label="Username"
              placeholder="john_doe"
              error={errors.username?.message}
              {...register("username")}
            />
          </motion.div>
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
            <GradientButton type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Creating account…" : "Create account"}
            </GradientButton>
          </motion.div>
        </motion.div>
      </form>
      <p className="mt-6 text-center text-small text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-accent hover:text-accent/80 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
