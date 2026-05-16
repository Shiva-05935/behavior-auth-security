import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, ShieldCheck, Monitor, Smartphone, Loader2, Radio, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const eventLabel = {
  logged_in: { label: "Logged In", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  otp_verified: { label: "OTP Verified ⚠️", color: "bg-amber-100 text-amber-700 border-amber-200" },
  otp_required: { label: "OTP Required", color: "bg-amber-100 text-amber-700 border-amber-200" },
  failed_attempts: { label: "Failed Attempts 🚨", color: "bg-red-100 text-red-700 border-red-200" },
  registered: { label: "Registered", color: "bg-blue-100 text-blue-700 border-blue-200" },
};

const statusColor = {
  active: "bg-emerald-400",
  blocked: "bg-red-500",
  otp_required: "bg-amber-400",
  suspicious: "bg-orange-500",
};

function DeviceIcon({ device }) {
  const isPhone = /iPhone|Android|iPad/.test(device || "");
  return isPhone
    ? <Smartphone className="w-4 h-4 text-muted-foreground" />
    : <Monitor className="w-4 h-4 text-muted-foreground" />;
}

export default function SessionsTab() {
  const queryClient = useQueryClient();
  const [blocking, setBlocking] = useState({});
  const [unblocking, setUnblocking] = useState({});

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["userSessions"],
    queryFn: () => base44.entities.UserSession.list("-created_date", 100),
    refetchInterval: 3000,
  });

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.UserSession.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["userSessions"] });
    });
    return unsub;
  }, [queryClient]);

  const handleBlock = async (session) => {
    setBlocking((p) => ({ ...p, [session.id]: true }));
    await base44.entities.UserSession.update(session.id, { status: "blocked" });
    // Also block all other sessions from the same IP
    const sameIp = sessions.filter(s => s.ip === session.ip && s.id !== session.id);
    await Promise.all(sameIp.map(s => base44.entities.UserSession.update(s.id, { status: "blocked" })));
    queryClient.invalidateQueries({ queryKey: ["userSessions"] });
    setBlocking((p) => ({ ...p, [session.id]: false }));
  };

  const handleUnblock = async (session) => {
    setUnblocking((p) => ({ ...p, [session.id]: true }));
    const sameIp = sessions.filter(s => s.ip === session.ip);
    await Promise.all(sameIp.map(s => base44.entities.UserSession.update(s.id, { status: "active" })));
    queryClient.invalidateQueries({ queryKey: ["userSessions"] });
    setUnblocking((p) => ({ ...p, [session.id]: false }));
  };

  const suspiciousSessions = sessions.filter(s => s.event === "otp_verified" || s.event === "otp_required" || s.event === "failed_attempts");
  const normalSessions = sessions.filter(s => !suspiciousSessions.find(x => x.id === s.id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Live User Sessions</h2>
          <p className="text-xs text-muted-foreground">Real IPs tracked in real-time. Block any user instantly.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
          <span className="text-xs text-muted-foreground">{sessions.length} total</span>
        </div>
      </div>

      {/* Suspicious / Flagged Sessions — highlighted */}
      {suspiciousSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-amber-700">Suspicious Activity Detected</h3>
          </div>
          <AnimatePresence>
            {suspiciousSessions.map((s) => {
              const ev = eventLabel[s.event] || { label: s.event, color: "bg-secondary text-foreground border-border" };
              const isBlocked = s.status === "blocked";
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
                      {(s.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{s.email}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-xs text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">{s.ip}</span>
                        <DeviceIcon device={s.device} />
                        <span className="text-[11px] text-muted-foreground">{s.device}</span>
                      </div>
                      {s.behavior_confidence !== null && s.behavior_confidence !== undefined && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">Behavior confidence: {s.behavior_confidence}%</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] ${ev.color}`}>{ev.label}</Badge>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${statusColor[s.status] || statusColor.active}`} />
                      <span className="text-xs capitalize">{s.status}</span>
                    </div>
                    {isBlocked ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnblock(s)}
                        disabled={unblocking[s.id]}
                        className="gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                      >
                        {unblocking[s.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                        Unblock
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleBlock(s)}
                        disabled={blocking[s.id]}
                        className="gap-1"
                      >
                        {blocking[s.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                        Block IP
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* All Sessions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">All Sessions</h3>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Monitor className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No sessions recorded yet.</p>
            <p className="text-xs mt-1">Sessions appear here as users log in from their devices.</p>
          </div>
        ) : (
          <AnimatePresence>
            {sessions.map((s, i) => {
              const ev = eventLabel[s.event] || { label: s.event || "Unknown", color: "bg-secondary text-foreground border-border" };
              const isBlocked = s.status === "blocked";
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-card rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isBlocked ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isBlocked ? "bg-red-100 text-red-700" : "bg-primary/10 text-primary"}`}>
                      {(s.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.email}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-xs text-blue-600 font-semibold">{s.ip}</span>
                        <DeviceIcon device={s.device} />
                        <span className="text-[11px] text-muted-foreground">{s.device}</span>
                      </div>
                      {s.failed_attempts > 0 && (
                        <p className="text-[11px] text-red-500 mt-0.5">{s.failed_attempts} failed attempt{s.failed_attempts !== 1 ? "s" : ""}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] ${ev.color}`}>{ev.label}</Badge>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${statusColor[s.status] || statusColor.active}`} />
                      <span className="text-xs capitalize">{s.status}</span>
                    </div>
                    {isBlocked ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnblock(s)}
                        disabled={unblocking[s.id]}
                        className="gap-1 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                      >
                        {unblocking[s.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                        Unblock
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBlock(s)}
                        disabled={blocking[s.id]}
                        className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      >
                        {blocking[s.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                        Block IP
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}