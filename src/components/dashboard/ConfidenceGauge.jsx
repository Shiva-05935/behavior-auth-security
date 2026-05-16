import { motion } from "framer-motion";

export default function ConfidenceGauge({ confidence }) {
  const color = confidence >= 75 ? "text-emerald-500" : confidence >= 50 ? "text-amber-500" : "text-red-500";
  const bg = confidence >= 75 ? "bg-emerald-500" : confidence >= 50 ? "bg-amber-500" : "bg-red-500";
  const label = confidence >= 75 ? "High Confidence" : confidence >= 50 ? "Medium Confidence" : "Low Confidence";

  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <span className="text-sm text-muted-foreground font-medium">Authentication Confidence</span>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r="42" fill="none"
            stroke="currentColor"
            className={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${confidence * 2.64} 264`}
            initial={{ strokeDasharray: "0 264" }}
            animate={{ strokeDasharray: `${confidence * 2.64} 264` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{confidence}%</span>
        </div>
      </div>
      <span className={`text-sm font-medium ${color}`}>{label}</span>
    </div>
  );
}