import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { loginSchema, type LoginRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";

interface LoginFormProps {
  onSuccess: (email: string) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast({
          title: "OTP Sent",
          description: `Verification code sent to ${variables.email}`,
        });
        onSuccess(variables.email);
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An error occurred during login",
      });
    },
  });

  const onSubmit = (data: LoginRequest) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Welcome Back</h3>
        <p className="text-muted-foreground">Sign in to your secure account</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              {...form.register("email")}
              type="email"
              id="email"
              data-testid="input-email"
              className="pl-10"
              placeholder="your.email@example.com"
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-destructive text-sm" data-testid="error-email">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              {...form.register("password")}
              type={showPassword ? "text" : "password"}
              id="password"
              data-testid="input-password"
              className="pl-10 pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-toggle-password"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-destructive text-sm" data-testid="error-password">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              {...form.register("rememberMe")}
              id="rememberMe"
              data-testid="checkbox-remember-me"
            />
            <Label 
              htmlFor="rememberMe" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Remember me
            </Label>
          </div>
          <a 
            href="#" 
            className="text-sm text-primary hover:underline"
            data-testid="link-forgot-password"
          >
            Forgot password?
          </a>
        </div>

        {/* Sign In Button */}
        <Button 
          type="submit" 
          className="w-full"
          disabled={loginMutation.isPending}
          data-testid="button-sign-in"
        >
          <span>{loginMutation.isPending ? "Signing In..." : "Sign In"}</span>
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </form>

      {/* Create Account Link */}
      <div className="text-center">
        <span className="text-muted-foreground text-sm">Don't have an account? </span>
        <a 
          href="#" 
          className="text-primary text-sm font-medium hover:underline"
          data-testid="link-create-account"
        >
          Create Account
        </a>
      </div>
    </div>
  );
}
