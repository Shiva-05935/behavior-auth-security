import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart2, ShieldAlert, Users, Activity, LogOut, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import StatusAlert from "@/components/auth/StatusAlert";
import SecurityBanner from "@/components/dashboard/SecurityBanner";
import KPICards from "@/components/dashboard/KPICards";
import ThreatFeed from "@/components/dashboard/ThreatFeed";
import SystemStatus from "@/components/dashboard/SystemStatus";
import SessionsTab from "@/components/dashboard/SessionsTab";
import VisitorsTab from "@/components/dashboard/VisitorsTab";
import ConfidenceGauge from "@/components/dashboard/ConfidenceGauge";
import BehaviorBreakdown from "@/components/dashboard/BehaviorBreakdown";
import {
  getSession,
  clearSession,
  saveBehaviorProfile,
  getUserBehaviorProfile,
} from "@/lib/behaviorStore";
import { recordSessionEvent } from "@/lib/ipTracker";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "threats", label: "Threats", icon: ShieldAlert },
  { id: "visitors", label: "Visitors", icon: Globe },
  { id: "sessions", label: "Sessions", icon: Users },
  { id: "behavior", label: "Behavior", icon: Activity },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [session, setSessionData] = useState(null);
  const [alert, setAlert] = useState({ type: "info", message: "", visible: false });
  const [saving, setSaving] = useState(false);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch attack logs from entity
  const { data: attackLogs = [] } = useQuery({
    queryKey: ["attackLogs"],
    queryFn: () => base44.entities.AttackLog.list("-created_date", 50),
    refetchInterval: 5000,
  });

  // Fetch user sessions for KPI count
  const { data: userSessions = [] } = useQuery({
    queryKey: ["userSessions"],
    queryFn: () => base44.entities.UserSession.list("-created_date", 100),
    refetchInterval: 3000,
  });

  // Real-time subscription for sessions
  useEffect(() => {
    const unsub = base44.entities.UserSession.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["userSessions"] });
    });
    return unsub;
  }, [queryClient]);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate("/");
      return;
    }
    setSessionData(s);
    setHasSavedProfile(!!getUserBehaviorProfile(s.email));

    const remaining = 30 * 60 * 1000 - (Date.now() - s.loginTime);
    setSessionTimeout(Math.ceil(remaining / 60000));

    const sessionInterval = setInterval(() => {
      const s2 = getSession();
      if (!s2) {
        setAlert({ type: "warning", message: "Session expired. Please login again.", visible: true });
        setTimeout(() => navigate("/"), 2000);
      } else {
        setSessionTimeout(Math.ceil((30 * 60 * 1000 - (Date.now() - s2.loginTime)) / 60000));
      }
    }, 60000);

    return () => clearInterval(sessionInterval);
  }, [navigate]);

  const handleSaveBehavior = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    const success = saveBehaviorProfile(session.email, session.behaviorData);
    if (success) {
      setHasSavedProfile(true);
      setAlert({ type: "success", message: "Behavior profile saved successfully", visible: true });
    } else {
      setAlert({ type: "error", message: "Failed to save behavior profile", visible: true });
    }
    setSaving(false);
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (!session) return null;

  const { behaviorData, comparison, attemptsUsed, otpVerified } = session;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">Security Dashboard</h1>
          <div className="flex items-center gap-3">
            {sessionTimeout && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                Session: {sessionTimeout}m remaining
              </span>
            )}
            <Button size="sm" variant="outline" onClick={handleLogout} className="gap-1.5">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <StatusAlert {...alert} />

        {/* Mobile tab bar */}
        <div className="flex border-b overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors min-w-[60px] ${
                  activeTab === t.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <SecurityBanner
              session={session}
              otpVerified={otpVerified}
              comparison={comparison}
              attemptsUsed={attemptsUsed}
              hasSavedProfile={hasSavedProfile}
              saving={saving}
              onSave={handleSaveBehavior}
            />

            <KPICards
              totalAttacks={attackLogs.length}
              blockedAttacks={attackLogs.length}
              activeSessions={userSessions.filter(s => s.status === "active" || s.status === "otp_required").length}
              blockedIps={userSessions.filter(s => s.status === "blocked").length}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Recent Threats</h3>
                  <button onClick={() => setActiveTab("threats")} className="text-xs text-primary hover:underline">
                    View all
                  </button>
                </div>
                <ThreatFeed logs={attackLogs} compact />
              </div>
              <SystemStatus />
            </div>

            {/* Suspicious sessions alert */}
            {userSessions.filter(s => s.event === "otp_verified" || s.event === "otp_required" || s.event === "failed_attempts").length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-sm font-semibold text-amber-700">
                      {userSessions.filter(s => s.event === "otp_verified" || s.event === "otp_required" || s.event === "failed_attempts").length} suspicious session(s) detected
                    </span>
                  </div>
                  <button onClick={() => setActiveTab("sessions")} className="text-xs text-amber-700 font-medium hover:underline">
                    View & Block →
                  </button>
                </div>
                <p className="text-xs text-amber-600 mt-1">Users with behavior mismatch or failed OTP attempts. Go to Sessions tab to block their IPs.</p>
              </div>
            )}
          </div>
        )}

        {/* THREATS TAB */}
        {activeTab === "threats" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Live Threat Intelligence</h2>
                <p className="text-xs text-muted-foreground">Real-time DDoS monitoring & attack analysis</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{attackLogs.length} Active Threats</span>
                <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl border p-5 text-center shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">Total DDoS Attacks</p>
                <p className="text-3xl font-bold text-red-500">{attackLogs.length}</p>
              </div>
              <div className="bg-card rounded-2xl border p-5 text-center shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">Blocked Threats</p>
                <p className="text-3xl font-bold text-emerald-500">{attackLogs.length}</p>
              </div>
              <div className="bg-card rounded-2xl border p-5 text-center shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">Firewall Status</p>
                <p className="text-3xl font-bold text-primary">ACTIVE</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border p-5 shadow-sm">
              <h3 className="font-semibold text-sm mb-1">Live Attack Feed</h3>
              <p className="text-xs text-muted-foreground mb-4">Real-time blocked DDoS attacks</p>
              <ThreatFeed logs={attackLogs} />
            </div>
          </div>
        )}

        {/* VISITORS TAB */}
        {activeTab === "visitors" && <VisitorsTab />}

        {/* SESSIONS TAB */}
        {activeTab === "sessions" && <SessionsTab />}

        {/* BEHAVIOR TAB */}
        {activeTab === "behavior" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Behavior Analysis</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConfidenceGauge confidence={comparison?.confidence || 100} />
              <BehaviorBreakdown breakdown={comparison?.breakdown} behaviorData={behaviorData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}