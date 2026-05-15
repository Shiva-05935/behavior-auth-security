import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
  const passwordRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    collectorRef.current = createBehaviorCollector();
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

    if (comparison.match) {
      setSession({
        email,
        name: authResult.user.name,
        behaviorData,
        comparison,
        attemptsUsed: MAX_ATTEMPTS - attemptsLeft,
      });
      setAlert({ type: "success", message: "Login successful! Behavior verified.", visible: true });
      setTimeout(() => navigate("/dashboard"), 800);
    } else {
      const newAttempts = attemptsLeft - 1;
      setAttemptsLeft(newAttempts);

      if (newAttempts <= 0) {
        setAlert({
          type: "error",
          message: "Behavior mismatch detected. Redirecting to OTP verification…",
          visible: true,
        });
        setTimeout(() => navigate("/otp-verify", { state: { email, name: authResult.user.name, behaviorData, comparison } }), 1500);
      } else {
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
            <Fingerprint className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">Behavior Auth</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Authenticate using your unique typing & mouse patterns
          </p>

          {/* Tech stack badges */}
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tech Stack</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> Java
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Python
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> HTML
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span> JS
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> CSS
              </span>
            </div>
            <div className="flex justify-center gap-4 mt-1">
              <span className="text-[11px] text-muted-foreground">Backend: Java / Python</span>
              <span className="text-muted-foreground text-[11px]">•</span>
              <span className="text-[11px] text-muted-foreground">Frontend: HTML / JS / CSS</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <StatusAlert {...alert} />

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email or Username</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@test.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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
            </div>

            <BehaviorIndicator isCollecting={isTyping} />

            <div className="flex items-center justify-between">
              <AttemptIndicator attemptsLeft={attemptsLeft} maxAttempts={MAX_ATTEMPTS} />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-base font-semibold"
            >
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

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}