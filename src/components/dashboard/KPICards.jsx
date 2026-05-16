import { motion } from "framer-motion";
import { Shield, ShieldAlert, Users, Ban } from "lucide-react";

export default function KPICards({ totalAttacks, blockedAttacks, activeSessions, blockedIps }) {
  const cards = [
    { label: "DDoS Attacks", value: totalAttacks, icon: ShieldAlert, color: "text-red-500" },
    { label: "Threats Blocked", value: blockedAttacks, icon: Shield, color: "text-emerald-500" },
    { label: "Active Sessions", value: activeSessions, icon: Users, color: "text-primary" },
    { label: "Blocked IPs", value: blockedIps || 0, icon: Ban, color: "text-orange-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl border p-4 flex flex-col items-center text-center gap-2 shadow-sm"
          >
            <Icon className={`w-5 h-5 ${card.color}`} />
            <span className="text-2xl font-bold">{card.value}</span>
            <span className="text-[11px] text-muted-foreground">{card.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}