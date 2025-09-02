import { useState } from "react";
import BrandingPanel from "@/components/branding-panel";
import LoginForm from "@/components/login-form";
import OTPForm from "@/components/otp-form";
import SuccessScreen from "@/components/success-screen";

type AuthStep = "login" | "otp" | "success";

export default function Login() {
  const [currentStep, setCurrentStep] = useState<AuthStep>("login");
  const [userEmail, setUserEmail] = useState("");

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    setCurrentStep("otp");
  };

  const handleOTPSuccess = () => {
    setCurrentStep("success");
  };

  const handleBackToLogin = () => {
    setCurrentStep("login");
    setUserEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-sm sm:max-w-md mx-auto">
          <div className="bg-card rounded-lg shadow-lg p-6 sm:p-8 border border-border">
            
            <BrandingPanel />

            {/* Render current step */}
            {currentStep === "login" && (
              <LoginForm onSuccess={handleLoginSuccess} />
            )}
            
            {currentStep === "otp" && (
              <OTPForm 
                email={userEmail} 
                onSuccess={handleOTPSuccess}
                onBack={handleBackToLogin}
              />
            )}
            
            {currentStep === "success" && (
              <SuccessScreen />
            )}

          </div>
        </div>
      </div>

      {/* Activate Windows Watermark */}
      <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 text-muted-foreground text-xs opacity-50 select-none pointer-events-none">
        Activate Windows
      </div>
    </div>
  );
}
