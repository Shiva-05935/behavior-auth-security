import { motion } from "framer-motion";
import { ShieldAlert, Ban, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const severityColor = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function ThreatFeed({ logs, compact = false }) {
  const displayLogs = compact ? logs.slice(0, 3) : logs;

  if (!displayLogs.length) {
    return (
      <div className="text-center py-8">
        <ShieldAlert className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
        <h3 className="font-semibold text-sm">System Protected</h3>
        <p className="text-xs text-muted-foreground">No DDoS attacks detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayLogs.map((t, index) => (
        <motion.div
          key={t.id || index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <Ban className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium">{t.type || "DDoS Attack"}</p>
              <p className="text-[11px] text-muted-foreground">IP: {t.ip || "Unknown"} · {t.time || "Now"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
              Blocked
            </Badge>
            {t.severity && (
              <Badge variant="outline" className={`text-[10px] ${severityColor[t.severity] || severityColor.high}`}>
                {t.severity}
              </Badge>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}