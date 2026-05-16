import { Shield, ShieldAlert, ShieldX } from "lucide-react";

export default function AttemptIndicator({ attemptsLeft, maxAttempts }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: maxAttempts }).map((_, i) => {
        const used = i >= attemptsLeft;
        return (
          <div key={i} className={`transition-all duration-300 ${used ? "text-destructive opacity-60" : "text-primary"}`}>
            {used ? <ShieldX className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          </div>
        );
      })}
      <span className="text-xs text-muted-foreground ml-1">
        {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} left
      </span>
    </div>
  );
}