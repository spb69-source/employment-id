import { Shield, Check } from "lucide-react";

export default function BrandingPanel() {
  return (
    <div className="hidden lg:block space-y-8">
      {/* Logo and Company Name */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 shield-gradient rounded-xl flex items-center justify-center shadow-lg">
          <Shield className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Secure Professional Bank</h1>
          <p className="text-muted-foreground text-sm">Your trusted banking partner</p>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="space-y-4">
        <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
          Welcome Back to<br />
          <span className="text-primary">Next-Gen Banking</span>
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
          Access your account with military-grade security and experience banking that adapts to your lifestyle.
        </p>
      </div>

      {/* Features List */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 feature-check rounded-full flex items-center justify-center">
            <Check className="text-white w-4 h-4" />
          </div>
          <span className="text-foreground font-medium">Bank-grade security & encryption</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 feature-check rounded-full flex items-center justify-center">
            <Check className="text-white w-4 h-4" />
          </div>
          <span className="text-foreground font-medium">Instant global transfers</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 feature-check rounded-full flex items-center justify-center">
            <Check className="text-white w-4 h-4" />
          </div>
          <span className="text-foreground font-medium">24/7 expert support</span>
        </div>
      </div>
    </div>
  );
}
