import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import StatusAlert from "@/components/auth/StatusAlert";
import { resetPassword, authenticateCredentials } from "@/lib/behaviorStore";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // "email" | "reset" | "done"
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "info", message: "", visible: false });

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setAlert({ type: "warning", message: "Please enter your email address.", visible: true });
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    // Check if user exists
    const result = authenticateCredentials(email, "__DUMMY__");
    if (result.error === "User not found") {
      setAlert({ type: "error", message: "No account found with that email.", visible: true });
      setLoading(false);
      return;
    }
    setAlert({ visible: false });
    setStep("reset");
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setAlert({ type: "warning", message: "Please fill in both password fields.", visible: true });
      return;
    }
    if (newPassword.length < 6) {
      setAlert({ type: "warning", message: "Password must be at least 6 characters.", visible: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlert({ type: "error", message: "Passwords do not match.", visible: true });
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const result = resetPassword(email, newPassword);
    if (result.success) {
      setStep("done");
    } else {
      setAlert({ type: "error", message: result.error || "Failed to reset password.", visible: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
          >
            <KeyRound className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "email" && "Enter your email to reset your password"}
            {step === "reset" && "Set a new password for your account"}
            {step === "done" && "Your password has been updated"}
          </p>
        </div>

        <div className="bg-card rounded-3xl border border-border shadow-sm p-8">
          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <StatusAlert {...alert} />
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-semibold">
                {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Checking…</span> : "Continue"}
              </Button>
            </form>
          )}

          {/* Step 2: New Password */}
          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-5">
              <StatusAlert {...alert} />
              <div className="space-y-2">
                <Label className="text-sm font-medium">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showNew ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-semibold">
                {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving…</span> : "Reset Password"}
              </Button>
            </form>
          )}

          {/* Step 3: Done */}
          {step === "done" && (
            <div className="text-center space-y-5">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground">Password reset successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">You can now log in with your new password.</p>
              </div>
              <Button onClick={() => navigate("/")} className="w-full h-12 rounded-xl text-base font-semibold">
                Back to Login
              </Button>
            </div>
          )}

          {step !== "done" && (
            <Button variant="ghost" onClick={() => step === "reset" ? setStep("email") : navigate("/")}
              className="w-full mt-4 gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}