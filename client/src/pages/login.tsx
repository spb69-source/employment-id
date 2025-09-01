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
    <div className="min-h-screen gradient-bg">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            <BrandingPanel />

            <div className="w-full max-w-md mx-auto">
              <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
                
                {/* Mobile Logo */}
                <div className="lg:hidden flex justify-center mb-8">
                  <div className="w-16 h-16 shield-gradient rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-shield-alt text-white text-2xl"></i>
                  </div>
                </div>

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
        </div>
      </div>

      {/* Activate Windows Watermark */}
      <div className="fixed bottom-4 right-4 text-muted-foreground text-xs opacity-50 select-none pointer-events-none">
        Activate Windows
      </div>
    </div>
  );
}
