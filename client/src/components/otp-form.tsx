import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone, Shield, ArrowLeft } from "lucide-react";

interface OTPFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function OTPForm({ email, onSuccess, onBack }: OTPFormProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const { toast } = useToast();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsResendDisabled(false);
    }
  }, [timeLeft]);

  const verifyOTPMutation = useMutation({
    mutationFn: async (code: string) => {
      // Use different URLs for production (Netlify) vs development
      const apiUrl = window.location.hostname.includes('netlify.app') 
        ? '/.netlify/functions/api/auth/verify-otp'
        : '/api/auth/verify-otp';
      const response = await apiRequest("POST", apiUrl, {
        email,
        code,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Login Successful",
          description: "Redirecting to your dashboard...",
        });
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: data.message,
        });
        // Clear OTP inputs
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "An error occurred during verification",
      });
    },
  });

  const resendOTPMutation = useMutation({
    mutationFn: async () => {
      // Use different URLs for production (Netlify) vs development
      const apiUrl = window.location.hostname.includes('netlify.app') 
        ? '/.netlify/functions/api/auth/resend-otp'
        : '/api/auth/resend-otp';
      const response = await apiRequest("POST", apiUrl, { email });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Code Sent",
          description: "New verification code sent to your email",
        });
        setTimeLeft(60);
        setIsResendDisabled(true);
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Resend",
        description: error.message || "Failed to resend verification code",
      });
    },
  });

  const handleOTPInput = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all fields are filled
    if (newOtp.every((digit) => digit.length === 1)) {
      verifyOTPMutation.mutate(newOtp.join(""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length === 6) {
      verifyOTPMutation.mutate(code);
    }
  };

  const handleResend = () => {
    resendOTPMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 sm:w-16 sm:h-16 shield-gradient rounded-xl flex items-center justify-center shadow-lg mx-auto mb-3 sm:mb-4">
          <Smartphone className="text-white w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold blue-header">Verify Your Identity</h3>
        <p className="text-sm sm:text-base text-muted-foreground px-2">Enter the 6-digit code sent to your email</p>
        <p className="text-xs sm:text-sm text-muted-foreground break-all px-2" data-testid="text-email-display">
          {email}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* OTP Input */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-center space-x-2 sm:space-x-3 px-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOTPInput(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="otp-input-responsive"
                data-testid={`input-otp-${index}`}
              />
            ))}
          </div>
          {verifyOTPMutation.isError && (
            <p className="text-destructive text-sm text-center" data-testid="error-otp">
              Invalid OTP code. Please try again.
            </p>
          )}
        </div>

        {/* Timer and Resend */}
        <div className="text-center space-y-3 sm:space-y-4 px-2">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Code expires in{" "}
            <span className="font-medium text-foreground" data-testid="text-timer">
              {formatTime(timeLeft)}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            disabled={isResendDisabled || resendOTPMutation.isPending}
            className="text-primary hover:text-primary/80 text-sm sm:text-base"
            data-testid="button-resend-otp"
          >
            {resendOTPMutation.isPending ? "Sending..." : "Resend Code"}
          </Button>
        </div>

        {/* Verify Button */}
        <Button
          type="submit"
          className="w-full h-10 sm:h-11"
          disabled={verifyOTPMutation.isPending || otp.some((digit) => !digit)}
          data-testid="button-verify-otp"
        >
          <span className="text-sm sm:text-base">
            {verifyOTPMutation.isPending ? "Verifying..." : "Verify Code"}
          </span>
          <Shield className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </form>

      {/* Back to Login */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground text-sm sm:text-base"
          data-testid="button-back-to-login"
        >
          <ArrowLeft className="mr-2 w-3 h-3 sm:w-4 sm:h-4" />
          Back to Login
        </Button>
      </div>
    </div>
  );
}
