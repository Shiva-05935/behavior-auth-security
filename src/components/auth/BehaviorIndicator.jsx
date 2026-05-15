import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function BehaviorIndicator({ isCollecting }) {
  if (!isCollecting) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2"
    >
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <Activity className="w-3.5 h-3.5 text-primary" />
      </motion.div>
      <span>Analyzing typing & mouse behavior…</span>
    </motion.div>
  );
}