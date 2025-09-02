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
import { Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  onSuccess: (email: string) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showSSN, setShowSSN] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      ssn: "",
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
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold blue-header">Sign in to ID</h2>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        * Indicates a required field
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email *
          </Label>
          <Input
            {...form.register("email")}
            type="email"
            id="email"
            data-testid="input-email"
            className="border-gray-300"
            placeholder="Enter your email address"
          />
          {form.formState.errors.email && (
            <p className="text-destructive text-sm" data-testid="error-email">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password *
          </Label>
          <div className="relative">
            <Input
              {...form.register("password")}
              type={showPassword ? "text" : "password"}
              id="password"
              data-testid="input-password"
              className="border-gray-300 pr-10"
              placeholder="Enter password"
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

        {/* SSN Input */}
        <div className="space-y-2">
          <Label htmlFor="ssn" className="text-sm font-medium">
            SSN *
          </Label>
          <div className="relative">
            <Input
              {...form.register("ssn")}
              type={showSSN ? "text" : "password"}
              id="ssn"
              data-testid="input-ssn"
              className="border-gray-300 pr-10"
              placeholder="XXX-XX-XXXX"
            />
            <button
              type="button"
              onClick={() => setShowSSN(!showSSN)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-toggle-ssn"
            >
              {showSSN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.formState.errors.ssn && (
            <p className="text-destructive text-sm" data-testid="error-ssn">
              {form.formState.errors.ssn.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Format: XXX-XX-XXXX
          </p>
        </div>


        {/* Sign In Button */}
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90"
          disabled={loginMutation.isPending}
          data-testid="button-sign-in"
        >
          {loginMutation.isPending ? "Signing In..." : "Sign In"}
        </Button>
      </form>

    </div>
  );
}
