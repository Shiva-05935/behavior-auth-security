import { motion } from "framer-motion";

export default function MetricCard({ icon: Icon, label, value, unit, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-2xl border p-5 flex flex-col items-center text-center gap-2 shadow-sm"
    >
      {Icon && <Icon className="w-5 h-5 text-primary" />}
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </motion.div>
  );
}