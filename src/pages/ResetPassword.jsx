import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import StatusAlert from "@/components/auth/StatusAlert";
import { resetPassword, authenticateCredentials } from "@/lib/behaviorStore";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "email" && "Enter your email to reset your password"}
            {step === "reset" && "Set a new password for your account"}
            {step === "done" && "Your password has been updated"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">
          <StatusAlert {...alert} />

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 rounded-xl" />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading}>
                {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Checking…</span> : "Continue"}
              </Button>
            </form>
          )}

          {/* Step 2: New Password */}
          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type={showNew ? "text" : "password"} placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 pr-10 h-12 rounded-xl" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type={showConfirm ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 pr-10 h-12 rounded-xl" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading}>
                {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving…</span> : "Reset Password"}
              </Button>
            </form>
          )}

          {/* Step 3: Done */}
          {step === "done" && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-lg font-semibold">Password reset successfully!</h2>
              <p className="text-sm text-muted-foreground">You can now log in with your new password.</p>
              <Button onClick={() => navigate("/")} className="w-full h-12 rounded-xl text-base font-semibold">
                Back to Login
              </Button>
            </div>
          )}

          {step !== "done" && (
            <Button
              variant="ghost"
              onClick={() => step === "reset" ? setStep("email") : navigate("/")}
              className="w-full mt-4 gap-2 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}