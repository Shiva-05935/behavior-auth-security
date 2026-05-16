import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function BehaviorIndicator({ isCollecting }) {
  if (!isCollecting) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 text-xs text-primary mt-2"
    >
      <Activity className="w-3.5 h-3.5 animate-pulse" />
      Analyzing typing & mouse behavior…
    </motion.div>
  );
}