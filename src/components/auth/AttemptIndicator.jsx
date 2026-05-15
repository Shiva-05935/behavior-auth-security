import { Shield, ShieldAlert, ShieldX } from "lucide-react";

export default function AttemptIndicator({ attemptsLeft, maxAttempts }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: maxAttempts }).map((_, i) => {
        const used = i >= attemptsLeft;
        return (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              used ? "bg-destructive/70" : "bg-primary/30"
            }`}
          />
        );
      })}
      <span className="text-xs text-muted-foreground ml-1">
        {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} left
      </span>
    </div>
  );
}