import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, ShieldCheck, Monitor, Smartphone, Loader2, Globe, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function DeviceIcon({ device }) {
  const isPhone = /iPhone|Android|iPad/.test(device || "");
  return isPhone
    ? <Smartphone className="w-4 h-4 text-muted-foreground" />
    : <Monitor className="w-4 h-4 text-muted-foreground" />;
}

export default function VisitorsTab() {
  const queryClient = useQueryClient();
  const [blocking, setBlocking] = useState({});
  const [unblocking, setUnblocking] = useState({});
  const [removing, setRemoving] = useState({});

  const { data: allSessions = [], isLoading } = useQuery({
    queryKey: ["visitorSessions"],
    queryFn: () => base44.entities.UserSession.list("-created_date", 200),
    refetchInterval: 2000,
  });

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.UserSession.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["visitorSessions"] });
    });
    return unsub;
  }, [queryClient]);

  // Deduplicate by IP — show latest record per IP
  const byIp = {};
  for (const s of allSessions) {
    if (!byIp[s.ip] || new Date(s.created_date) > new Date(byIp[s.ip].created_date)) {
      byIp[s.ip] = s;
    }
  }
  const visitors = Object.values(byIp).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const blockedVisitors = visitors.filter(v => v.status === "blocked");
  const activeVisitors = visitors.filter(v => v.status !== "blocked");

  const handleBlock = async (visitor) => {
    setBlocking(p => ({ ...p, [visitor.ip]: true }));
    // Block ALL sessions from this IP
    const sameIp = allSessions.filter(s => s.ip === visitor.ip);
    await Promise.all(sameIp.map(s => base44.entities.UserSession.update(s.id, { status: "blocked" })));
    queryClient.invalidateQueries({ queryKey: ["visitorSessions"] });
    queryClient.invalidateQueries({ queryKey: ["userSessions"] });
    setBlocking(p => ({ ...p, [visitor.ip]: false }));
  };

  const handleUnblock = async (visitor) => {
    setUnblocking(p => ({ ...p, [visitor.ip]: true }));
    const sameIp = allSessions.filter(s => s.ip === visitor.ip);
    await Promise.all(sameIp.map(s => base44.entities.UserSession.update(s.id, { status: "active" })));
    queryClient.invalidateQueries({ queryKey: ["visitorSessions"] });
    queryClient.invalidateQueries({ queryKey: ["userSessions"] });
    setUnblocking(p => ({ ...p, [visitor.ip]: false }));
  };

  const handleRemove = async (visitor) => {
    setRemoving(p => ({ ...p, [visitor.ip]: true }));
    const sameIp = allSessions.filter(s => s.ip === visitor.ip);
    await Promise.all(sameIp.map(s => base44.entities.UserSession.delete(s.id)));
    queryClient.invalidateQueries({ queryKey: ["visitorSessions"] });
    queryClient.invalidateQueries({ queryKey: ["userSessions"] });
    setRemoving(p => ({ ...p, [visitor.ip]: false }));
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

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
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Live Visitor Tracker
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Every IP that opens your app is captured here. Block in one click.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
          <span className="text-xs text-muted-foreground">{activeVisitors.length} active · {blockedVisitors.length} blocked</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{visitors.length}</p>
          <p className="text-[11px] text-muted-foreground">Unique IPs</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{activeVisitors.length}</p>
          <p className="text-[11px] text-emerald-700">Active</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{blockedVisitors.length}</p>
          <p className="text-[11px] text-red-700">Blocked</p>
        </div>
      </div>

      {visitors.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No visitors yet</p>
          <p className="text-xs mt-1">Share your app link — anyone who opens it will appear here instantly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Visitors</h3>
          <AnimatePresence>
            {visitors.map((v, i) => {
              const isBlocked = v.status === "blocked";
              const isVisitorOnly = v.event === "visited";
              return (
                <motion.div
                  key={v.ip}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.02 }}
                  className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isBlocked
                      ? "bg-red-50 border-red-200 opacity-75"
                      : "bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isBlocked ? "bg-red-500" : "bg-emerald-400 animate-pulse"}`} />
                    <div>
                      {/* IP address — big and prominent */}
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-sm font-bold ${isBlocked ? "text-red-600" : "text-blue-600"}`}>{v.ip}</span>
                        {isBlocked && <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">BLOCKED</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <DeviceIcon device={v.device} />
                        <span className="text-[11px] text-muted-foreground">{v.device}</span>
                        <span className="text-[11px] text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">{formatTime(v.created_date)}</span>
                        {!isVisitorOnly && (
                          <>
                            <span className="text-[11px] text-muted-foreground">·</span>
                            <span className="text-[11px] font-medium text-foreground">{v.email}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-1">
                        <Badge variant="outline" className={`text-[10px] ${
                          isVisitorOnly ? "bg-slate-100 text-slate-600 border-slate-200" :
                          v.event === "logged_in" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                          v.event === "registered" ? "bg-blue-100 text-blue-700 border-blue-200" :
                          v.event === "otp_required" || v.event === "otp_verified" ? "bg-amber-100 text-amber-700 border-amber-200" :
                          v.event === "failed_attempts" ? "bg-red-100 text-red-700 border-red-200" :
                          "bg-secondary text-foreground border-border"
                        }`}>
                          {isVisitorOnly ? "👁 Visited (no login)" :
                           v.event === "logged_in" ? "✅ Logged In" :
                           v.event === "registered" ? "🆕 Registered" :
                           v.event === "otp_required" ? "⚠️ OTP Required" :
                           v.event === "otp_verified" ? "⚠️ OTP Verified" :
                           v.event === "failed_attempts" ? "🚨 Failed Attempts" :
                           v.event}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isBlocked ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnblock(v)}
                        disabled={unblocking[v.ip]}
                        className="gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                      >
                        {unblocking[v.ip] ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                        Unblock
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleBlock(v)}
                        disabled={blocking[v.ip]}
                        className="gap-1"
                      >
                        {blocking[v.ip] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                        Block IP
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(v)}
                      disabled={removing[v.ip]}
                      className="gap-1 text-muted-foreground hover:text-red-600"
                    >
                      {removing[v.ip] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}