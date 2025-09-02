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
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg mx-auto animate-checkmark">
        <Check className="text-white w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold purple-header" data-testid="text-success-title">
          Login Successful!
        </h3>
        <p className="text-muted-foreground" data-testid="text-success-message">
          Redirecting to your dashboard...
        </p>
      </div>
      <div className="w-12 h-12 mx-auto">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" data-testid="spinner-loading"></div>
      </div>
    </div>
  );
}
