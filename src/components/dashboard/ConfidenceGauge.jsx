import { motion } from "framer-motion";

export default function ConfidenceGauge({ confidence }) {
  const color = confidence >= 75 ? "text-emerald-500" : confidence >= 50 ? "text-amber-500" : "text-red-500";
  const bg = confidence >= 75 ? "bg-emerald-500" : confidence >= 50 ? "bg-amber-500" : "bg-red-500";
  const label = confidence >= 75 ? "High Confidence" : confidence >= 50 ? "Medium Confidence" : "Low Confidence";

  return (
    <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center gap-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Authentication Confidence
      </p>
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
          <motion.circle
            cx="60" cy="60" r="52" fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 52}
            initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - confidence / 100) }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-bold"
          >
            {confidence}%
          </motion.span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${bg}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}