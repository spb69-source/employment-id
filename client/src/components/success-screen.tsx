import { useEffect } from "react";
import { Check } from "lucide-react";

export default function SuccessScreen() {
  useEffect(() => {
    // Simulate redirect after 3 seconds
    const timer = setTimeout(() => {
      console.log("Would redirect to dashboard");
      // In a real app: window.location.href = "/dashboard";
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg mx-auto animate-checkmark">
        <Check className="text-white w-8 h-8 sm:w-10 sm:h-10" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl sm:text-2xl font-bold blue-header" data-testid="text-success-title">
          Login Successful!
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground px-2" data-testid="text-success-message">
          Redirecting to your dashboard...
        </p>
      </div>
      <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto" data-testid="spinner-loading"></div>
      </div>
    </div>
  );
}
