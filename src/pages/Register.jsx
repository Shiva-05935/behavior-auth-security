import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Mail, Lock, User, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import StatusAlert from "@/components/auth/StatusAlert";
import BehaviorIndicator from "@/components/auth/BehaviorIndicator";
import { createBehaviorCollector } from "@/lib/behaviorCollector";
import { registerUser, saveBehaviorProfile } from "@/lib/behaviorStore";
import { recordSessionEvent, isIpBlocked, recordVisitor } from "@/lib/ipTracker";

const STEPS = ["account", "behavior", "done"];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "info", message: "", visible: false });
  const [isTyping, setIsTyping] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [samplePassword, setSamplePassword] = useState("");

  const collectorRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const REQUIRED_SAMPLES = 3;

  useEffect(() => {
    collectorRef.current = createBehaviorCollector();
    // Track visitor IP on page load
    isIpBlocked().then((blocked) => {
      if (blocked) navigate("/blocked");
      else recordVisitor();
    });
  }, []);

  useEffect(() => {
    if (step === "behavior") {
      const handleMouse = (e) => collectorRef.current?.onMouseMove(e);
      const handleClick = (e) => collectorRef.current?.onClick(e);
      window.addEventListener("mousemove", handleMouse);
      window.addEventListener("click", handleClick);
      return () => {
        window.removeEventListener("mousemove", handleMouse);
        window.removeEventListener("click", handleClick);
      };
    }
  }, [step]);

  const handleSampleKeyDown = useCallback((e) => {
    collectorRef.current?.onKeyDown(e);
    setIsTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1500);
  }, []);

  const handleSampleKeyUp = useCallback((e) => {
    collectorRef.current?.onKeyUp(e);
  }, []);

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setAlert({ type: "warning", message: "Please enter your full name.", visible: true });
      return;
    }
    if (!email || !password || !confirm) {
      setAlert({ type: "warning", message: "Please fill in all fields.", visible: true });
      return;
    }
    if (password !== confirm) {
      setAlert({ type: "error", message: "Passwords do not match.", visible: true });
      return;
    }
    if (password.length < 6) {
      setAlert({ type: "warning", message: "Password must be at least 6 characters.", visible: true });
      return;
    }
    const result = registerUser(email, password, name.trim());
    if (!result.success) {
      setAlert({ type: "error", message: result.error, visible: true });
      return;
    }
    // Record registration event with IP
    recordSessionEvent({ email, event: "registered" });
    setAlert({ type: "info", message: "", visible: false });
    setStep("behavior");
  };

  const handleSampleSubmit = () => {
    if (!samplePassword) {
      setAlert({ type: "warning", message: "Type your password to record a sample.", visible: true });
      return;
    }
    const newCount = sampleCount + 1;
    setSampleCount(newCount);
    setSamplePassword("");
    collectorRef.current?.reset();

    if (newCount >= REQUIRED_SAMPLES) {
      setAlert({ type: "info", message: "", visible: false });
    } else {
      setAlert({
        type: "info",
        message: `Sample ${newCount}/${REQUIRED_SAMPLES} recorded. Type again to continue.`,
        visible: true,
      });
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const behaviorData = collectorRef.current?.getAnalysis();
    saveBehaviorProfile(email, behaviorData);
    setLoading(false);
    setStep("done");
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
            <Fingerprint className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register and set your behavioral biometric profile
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                STEPS.indexOf(step) >= i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${STEPS.indexOf(step) > i ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-8 text-[10px] text-muted-foreground mb-6">
          <span>Account</span><span>Behavior</span><span>Done</span>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">
          <StatusAlert {...alert} />

          <AnimatePresence mode="wait">
            {/* Step 1: Account details */}
            {step === "account" && (
              <motion.form key="account" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleAccountSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-12 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 rounded-xl" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10 h-12 rounded-xl" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold">Continue →</Button>
              </motion.form>
            )}

            {/* Step 2: Behavior sample */}
            {step === "behavior" && (
              <motion.div key="behavior" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="text-center">
                  <h2 className="text-lg font-semibold">Record Typing Pattern</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Type your password <strong>{REQUIRED_SAMPLES} times</strong> naturally so the system learns your unique keystroke rhythm.
                  </p>
                </div>

                {/* Sample progress */}
                <div className="flex items-center justify-center gap-3">
                  {Array.from({ length: REQUIRED_SAMPLES }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < sampleCount ? "bg-primary scale-110" : "bg-border"}`} />
                  ))}
                  <span className="text-xs text-muted-foreground">{sampleCount}/{REQUIRED_SAMPLES} samples recorded</span>
                </div>

                <div className="space-y-2">
                  <Label>Type your password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={samplePassword}
                      onChange={(e) => setSamplePassword(e.target.value)}
                      onKeyDown={handleSampleKeyDown}
                      onKeyUp={handleSampleKeyUp}
                      onKeyPress={(e) => { if (e.key === "Enter") handleSampleSubmit(); }}
                      className="pl-10 h-12 rounded-xl"
                      autoFocus
                    />
                  </div>
                  <BehaviorIndicator isCollecting={isTyping} />
                </div>

                {sampleCount < REQUIRED_SAMPLES ? (
                  <Button onClick={handleSampleSubmit} className="w-full h-12 rounded-xl text-base font-semibold">
                    Record Sample ({sampleCount + 1}/{REQUIRED_SAMPLES})
                  </Button>
                ) : (
                  <Button onClick={handleFinalize} className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving profile…</span>
                    ) : (
                      "Save Behavior Profile ✓"
                    )}
                  </Button>
                )}
              </motion.div>
            )}

            {/* Step 3: Done */}
            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                <h2 className="text-xl font-semibold">You're all set, {name}!</h2>
                <p className="text-sm text-muted-foreground">
                  Your account and behavioral biometric profile have been created. Future logins require an <strong>80% behavior match</strong>.
                </p>
                <Button onClick={() => navigate("/")} className="w-full h-12 rounded-xl text-base font-semibold">
                  Go to Login
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {step === "account" && (
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/" className="text-primary font-medium hover:underline">Sign in</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}