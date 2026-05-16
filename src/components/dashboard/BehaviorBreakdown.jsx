import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

const COLORS = [
  "hsl(234, 89%, 64%)",
  "hsl(160, 60%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(280, 65%, 60%)"
];

export default function BehaviorBreakdown({ breakdown, behaviorData }) {
  const chartData = breakdown
    ? [
        { name: "Typing", score: breakdown.typingScore },
        { name: "Interval", score: breakdown.intervalScore },
        { name: "Hold Time", score: breakdown.holdScore },
        { name: "Mouse", score: breakdown.mouseScore },
      ]
    : [
        { name: "Typing", score: 100 },
        { name: "Interval", score: 100 },
        { name: "Hold Time", score: 100 },
        { name: "Mouse", score: 100 },
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border p-6 shadow-sm"
    >
      <h3 className="text-base font-semibold mb-4">Behavior Match Breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${value}%`, "Match Score"]} />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {behaviorData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-center">
          <div>
            <div className="text-lg font-bold">{behaviorData.typingSpeed}</div>
            <div className="text-xs text-muted-foreground">Chars/min</div>
          </div>
          <div>
            <div className="text-lg font-bold">{behaviorData.avgInterval}ms</div>
            <div className="text-xs text-muted-foreground">Avg Interval</div>
          </div>
          <div>
            <div className="text-lg font-bold">{behaviorData.avgHoldDuration}ms</div>
            <div className="text-xs text-muted-foreground">Avg Hold</div>
          </div>
          <div>
            <div className="text-lg font-bold">{behaviorData.mouseSpeed}</div>
            <div className="text-xs text-muted-foreground">Mouse px/s</div>
          </div>
        </div>
      )}
    </motion.div>
  );
}