import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusAlert from "@/components/auth/StatusAlert";
import { setSession } from "@/lib/behaviorStore";
import { base44 } from "@/api/base44Client";

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state || {};

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [alert, setAlert] = useState({ type: "info", message: "", visible: false });
  const inputRefs = useRef([]);
  const otpCodeRef = useRef("");

  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const sendOtpEmail = async () => {
    setSending(true);
    const code = generateOtp();
    otpCodeRef.current = code;
    await base44.integrations.Core.SendEmail({
      to: userData.email,
      subject: "Your OTP Verification Code",
      body: `Hello,\n\nYour one-time password (OTP) for Behavior Auth login is:\n\n${code}\n\nThis code is valid for 5 minutes. Do not share it with anyone.\n\nIf you did not request this, please ignore this email.`,
    });
    setSending(false);
    setAlert({
      type: "success",
      message: `OTP sent to ${userData.email}`,
      visible: true,
    });
  };

  useEffect(() => {
    if (!userData.email) {
      navigate("/");
      return;
    }
    sendOtpEmail();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    setResendTimer(30);
    setOtp(["", "", "", "", "", ""]);
    await sendOtpEmail();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setAlert({ type: "warning", message: "Please enter the complete 6-digit code.", visible: true });
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    if (code === otpCodeRef.current) {
      setSession({
        email: userData.email,
        name: userData.name || "User",
        behaviorData: userData.behaviorData,
        comparison: userData.comparison,
        attemptsUsed: 3,
        otpVerified: true,
      });
      setAlert({ type: "success", message: "OTP verified! Redirecting…", visible: true });
      setTimeout(() => navigate("/dashboard"), 800);
    } else {
      setAlert({ type: "error", message: "Invalid OTP code. Please try again.", visible: true });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  const maskedEmail = userData.email
    ? userData.email.replace(/(.{3})(.+)(@.+)/, (_, a, b, c) => a + "*".repeat(Math.min(b.length, 4)) + c)
    : "";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 mb-4"
          >
            <ShieldCheck className="w-8 h-8 text-amber-600" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">OTP Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Behavior mismatch detected — verify your identity
          </p>
        </div>

        <div className="bg-card rounded-3xl border border-border shadow-sm p-8">
          <div className="space-y-6">
            <StatusAlert {...alert} />

            {sending && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Sending OTP to your email…
              </div>
            )}

            <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                Code sent to <span className="font-medium text-foreground">{maskedEmail}</span>
              </p>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center gap-3">
              {otp.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl"
                />
              ))}
            </div>

            {/* Resend */}
            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Resend in <span className="font-medium text-foreground">{resendTimer}s</span>
                </p>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleResend} className="gap-2">
                  <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                </Button>
              )}
            </div>

            <Button
              onClick={handleVerify}
              disabled={loading}
              className="w-full h-12 rounded-xl text-base font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
                </span>
              ) : (
                "Verify OTP"
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full gap-2 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}