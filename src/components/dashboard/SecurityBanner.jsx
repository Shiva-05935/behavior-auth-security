import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Save, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SecurityBanner({ session, otpVerified, comparison, attemptsUsed, hasSavedProfile, saving, onSave }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        {otpVerified
          ? <ShieldAlert className="w-8 h-8 text-amber-500" />
          : <ShieldCheck className="w-8 h-8 text-emerald-500" />
        }
        <div>
          <h2 className="font-semibold text-sm">
            {otpVerified ? "Verified via OTP — Monitor Active" : "Behavior Verified — Secure Session"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Logged in as {session.email} · {otpVerified
              ? "Behavior mismatch was detected at login"
              : `${comparison?.confidence || 100}% behavior confidence`
            }
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={attemptsUsed > 0 ? "destructive" : "secondary"} className="gap-1">
          {3 - (attemptsUsed || 0)} attempts left
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={onSave}
          disabled={hasSavedProfile || saving}
          className="gap-1"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {hasSavedProfile ? "Saved" : saving ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </motion.div>
  );
}