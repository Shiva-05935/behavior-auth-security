import { useEffect, useState } from "react";
import { ShieldX, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { getPublicIp } from "@/lib/ipTracker";

export default function Blocked() {
  const [ip, setIp] = useState("...");

  useEffect(() => {
    getPublicIp().then(setIp);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm w-full"
      >
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-6">
          <ShieldX className="w-12 h-12 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-sm mb-4">
          Your IP address has been blocked by the administrator.
        </p>

        {/* IP display */}
        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-6">
          <WifiOff className="w-4 h-4 text-red-400" />
          <span className="font-mono text-sm font-bold text-red-600">{ip}</span>
          <span className="text-xs text-red-400">— Blocked</span>
        </div>

        <div className="bg-card border rounded-xl p-4 text-left space-y-2 text-sm text-muted-foreground">
          <p>🚫 <strong className="text-foreground">Why am I blocked?</strong></p>
          <p>The administrator has flagged your IP address due to suspicious activity or a security policy violation.</p>
          <p className="mt-2">📧 If you believe this is a mistake, contact the app administrator to get unblocked.</p>
        </div>
      </motion.div>
    </div>
  );
}