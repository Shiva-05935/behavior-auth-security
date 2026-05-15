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
      transition={{ delay: 0.3 }}
      className="bg-card rounded-2xl border border-border p-6 h-full flex flex-col"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
        Behavior Match Breakdown
      </p>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "13px"
              }}
              formatter={(value) => [`${value}%`, "Match Score"]}
            />
            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Raw values */}
      {behaviorData && (
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-bold">{behaviorData.typingSpeed}</p>
            <p className="text-[11px] text-muted-foreground">Chars/min</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{behaviorData.avgInterval}ms</p>
            <p className="text-[11px] text-muted-foreground">Avg Interval</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{behaviorData.avgHoldDuration}ms</p>
            <p className="text-[11px] text-muted-foreground">Avg Hold</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{behaviorData.mouseSpeed}</p>
            <p className="text-[11px] text-muted-foreground">Mouse px/s</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}