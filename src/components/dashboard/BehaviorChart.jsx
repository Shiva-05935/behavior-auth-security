import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

export default function BehaviorChart({ label, value, maxValue = 100, color = "hsl(var(--primary))" }) {
  const percentage = Math.min(100, Math.round((value / maxValue) * 100));
  const data = [{ name: label, value: percentage, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={100} height={100}>
        <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "hsl(var(--border))" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <span className="text-sm font-bold mt-1">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}