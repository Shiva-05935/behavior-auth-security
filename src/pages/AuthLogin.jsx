import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Fingerprint, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AttemptIndicator from "@/components/auth/AttemptIndicator";
import BehaviorIndicator from "@/components/auth/BehaviorIndicator";
import StatusAlert from "@/components/auth/StatusAlert";
import { createBehaviorCollector } from "@/lib/behaviorCollector";
import {
  authenticateCredentials,
  getUserBehaviorProfile,
  compareBehavior,
  setSession,
} from "@/lib/behaviorStore";
import { recordSessionEvent, isIpBlocked, recordVisitor } from "@/lib/ipTracker";

const MAX_ATTEMPTS = 3;

export default function AuthLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [alert, setAlert] = useState({ type: "info", message: "", visible: false });
  const [isTyping, setIsTyping] = useState(false);

  const collectorRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    collectorRef.current = createBehaviorCollector();
    // Track this visitor's IP immediately
    isIpBlocked().then((blocked) => {
      if (blocked) { navigate("/blocked"); return; }
      recordVisitor();
    });
  }, []);

  const handlePasswordKeyDown = useCallback((e) => {
    collectorRef.current?.onKeyDown(e);
    setIsTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1500);
  }, []);

  const handlePasswordKeyUp = useCallback((e) => {
    collectorRef.current?.onKeyUp(e);
  }, []);

  useEffect(() => {
    const handleMouse = (e) => collectorRef.current?.onMouseMove(e);
    const handleClick = (e) => collectorRef.current?.onClick(e);
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setAlert({ type: "warning", message: "Please enter both email and password.", visible: true });
      return;
    }

    // Re-check block status before each attempt
    const blocked = await isIpBlocked();
    if (blocked) { navigate("/blocked"); return; }

    setLoading(true);
    setAlert({ ...alert, visible: false });

    await new Promise((r) => setTimeout(r, 1200));

    const authResult = authenticateCredentials(email, password);
    if (!authResult.success) {
      setLoading(false);
      setAlert({ type: "error", message: authResult.error, visible: true });
      return;
    }

    const behaviorData = collectorRef.current?.getAnalysis();
    const savedProfile = getUserBehaviorProfile(email);
    const comparison = compareBehavior(behaviorData, savedProfile);
    const attemptsUsedNow = MAX_ATTEMPTS - attemptsLeft;

    if (comparison.match) {
      setSession({
        email,
        name: authResult.user.name,
        behaviorData,
        comparison,
        attemptsUsed: attemptsUsedNow,
      });
      // Record successful login
      recordSessionEvent({ email, event: "logged_in", behaviorConfidence: comparison.confidence, failedAttempts: attemptsUsedNow });
      setAlert({ type: "success", message: "Login successful! Behavior verified.", visible: true });
      setTimeout(() => navigate("/dashboard"), 800);
    } else {
      const newAttempts = attemptsLeft - 1;
      setAttemptsLeft(newAttempts);

      if (newAttempts <= 0) {
        // Record suspicious activity — needs OTP
        recordSessionEvent({ email, event: "otp_required", behaviorConfidence: comparison.confidence, failedAttempts: MAX_ATTEMPTS, otpUsed: true });
        setAlert({
          type: "error",
          message: "Behavior mismatch detected. Redirecting to OTP verification…",
          visible: true,
        });
        setTimeout(() => navigate("/otp-verify", { state: { email, name: authResult.user.name, behaviorData, comparison } }), 1500);
      } else {
        recordSessionEvent({ email, event: "failed_attempts", failedAttempts: MAX_ATTEMPTS - newAttempts });
        setAlert({
          type: "warning",
          message: `Behavior mismatch detected. ${newAttempts} attempt${newAttempts !== 1 ? "s" : ""} remaining.`,
          visible: true,
        });
        collectorRef.current?.reset();
        setPassword("");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Fingerprint className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Behavior Auth</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Authenticate using your unique typing & mouse patterns
          </p>
        </div>

        {/* Tech stack badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="text-[10px] font-medium text-muted-foreground">Tech Stack</span>
          {["Java", "Python", "HTML", "JS", "CSS"].map((t) => (
            <span key={t} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-[10px] rounded-full font-medium">
              {t}
            </span>
          ))}
        </div>
        <p className="text-center text-[10px] text-muted-foreground mb-6">
          Backend: Java / Python • Frontend: HTML / JS / CSS
        </p>

        {/* Card */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">
          <StatusAlert {...alert} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email or Username</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@test.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Password</Label>
                <AttemptIndicator attemptsLeft={attemptsLeft} maxAttempts={MAX_ATTEMPTS} />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  onKeyUp={handlePasswordKeyUp}
                  className="pl-10 pr-10 h-12 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <BehaviorIndicator isCollecting={isTyping} />
            </div>

            <div className="flex justify-end">
              <Link to="/reset-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating…
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}