import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";

import {
  Keyboard,
  MousePointer2,
  Timer,
  Activity,
  LogOut,
  Save,
  Shield,
  Hash,
  Zap,
  Clock,
  Lock,
  Globe,
  Server,
  Wifi,
  Eye,
  TrendingUp,
  Users,
  ShieldAlert,
  ShieldCheck,
  Bell,
  BarChart2,
  Radio,
  Ban,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import MetricCard from "@/components/dashboard/MetricCard";

import ConfidenceGauge from "@/components/dashboard/ConfidenceGauge";

import BehaviorBreakdown from "@/components/dashboard/BehaviorBreakdown";

import StatusAlert from "@/components/auth/StatusAlert";

import {
  getSession,
  clearSession,
  saveBehaviorProfile,
  getUserBehaviorProfile,
} from "@/lib/behaviorStore";

const ACTIVE_SESSIONS = [
  {
    id: 1,
    user: "admin@test.com",
    device: "Chrome / Windows",
    location: "Local",
    status: "active",
    duration: "28m",
  },

  {
    id: 2,
    user: "user@test.com",
    device: "Safari / macOS",
    location: "192.168.1.5",
    status: "idle",
    duration: "1h 12m",
  },

  {
    id: 3,
    user: "guest@test.com",
    device: "Firefox / Linux",
    location: "10.0.0.12",
    status: "active",
    duration: "5m",
  },
];

const severityColor = {
  high: "bg-red-100 text-red-700 border-red-200",

  medium:
    "bg-amber-100 text-amber-700 border-amber-200",

  low:
    "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusColor = {
  active: "bg-emerald-400",

  idle: "bg-amber-400",
};

export default function Dashboard() {

  const navigate = useNavigate();

  // LIVE ATTACK DATA
  const [attackData, setAttackData] =
    useState({
      totalAttacks: 0,
      blockedAttacks: 0,
      logs: [],
    });

  // SESSION DATA
  const [session, setSessionData] =
    useState(null);

  const [alert, setAlert] = useState({
    type: "info",
    message: "",
    visible: false,
  });

  const [saving, setSaving] =
    useState(false);

  const [hasSavedProfile, setHasSavedProfile] =
    useState(false);

  const [sessionTimeout, setSessionTimeout] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("overview");

  // FETCH ATTACK DATA
  const fetchAttackData = async () => {

    try {

      const response = await fetch(
        "http://localhost:5000/api/attacks"
      );

      const data =
        await response.json();

      setAttackData(data);

    } catch (error) {

      console.log(error);
    }
  };

  // INITIAL LOAD
  useEffect(() => {

    fetchAttackData();

    const attackInterval =
      setInterval(() => {

        fetchAttackData();

      }, 2000);

    const s = getSession();

    if (!s) {

      navigate("/");

      return;
    }

    setSessionData(s);

    setHasSavedProfile(
      !!getUserBehaviorProfile(s.email)
    );

    const remaining =
      30 * 60 * 1000 -
      (Date.now() - s.loginTime);

    setSessionTimeout(
      Math.ceil(remaining / 60000)
    );

    const sessionInterval =
      setInterval(() => {

        const s2 = getSession();

        if (!s2) {

          setAlert({
            type: "warning",
            message:
              "Session expired. Please login again.",
            visible: true,
          });

          setTimeout(() => {

            navigate("/");

          }, 2000);

        } else {

          setSessionTimeout(
            Math.ceil(
              (
                30 * 60 * 1000 -
                (Date.now() - s2.loginTime)
              ) / 60000
            )
          );
        }

      }, 60000);

    return () => {

      clearInterval(attackInterval);

      clearInterval(sessionInterval);
    };

  }, [navigate]);

  // SAVE PROFILE
  const handleSaveBehavior =
    async () => {

      setSaving(true);

      await new Promise((r) =>
        setTimeout(r, 800)
      );

      const success =
        saveBehaviorProfile(
          session.email,
          session.behaviorData
        );

      if (success) {

        setHasSavedProfile(true);

        setAlert({
          type: "success",
          message:
            "Behavior profile saved successfully",
          visible: true,
        });

      } else {

        setAlert({
          type: "error",
          message:
            "Failed to save behavior profile",
          visible: true,
        });
      }

      setSaving(false);
    };

  // LOGOUT
  const handleLogout = () => {

    clearSession();

    navigate("/");
  };

  if (!session) return null;

  const {
    behaviorData,
    comparison,
    attemptsUsed,
    otpVerified,
  } = session;

  const data =
    behaviorData || {};

  // THREAT FEED
  const THREAT_FEED =
    attackData.logs || [];

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "threats", label: "Threats", icon: ShieldAlert },
    { id: "sessions", label: "Sessions", icon: Users },
    { id: "behavior", label: "Behavior", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm leading-tight">SecureWatch</h1>
              <p className="text-[11px] text-muted-foreground">Behavior Based Security</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === t.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 hidden sm:flex text-xs">
              <Clock className="w-3 h-3" /> {sessionTimeout}m
            </Badge>
            <div className="relative">
              <Bell className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-xs">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-border bg-card overflow-x-auto">
        {tabs.map((t) => {
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <StatusAlert {...alert} />

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Security Status Banner */}
            <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              otpVerified ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  otpVerified ? "bg-amber-100" : "bg-emerald-100"
                }`}>
                  {otpVerified
                    ? <ShieldAlert className="w-6 h-6 text-amber-600" />
                    : <ShieldCheck className="w-6 h-6 text-emerald-600" />}
                </div>
                <div>
                  <h2 className="font-bold text-foreground">
                    {otpVerified ? "Verified via OTP — Monitor Active" : "Behavior Verified — Secure Session"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Logged in as <span className="font-medium">{session.email}</span> · {otpVerified
                      ? "Behavior mismatch was detected at login"
                      : `${comparison?.confidence || 100}% behavior confidence`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={attemptsUsed > 0 ? "destructive" : "secondary"} className="gap-1">
                  <Hash className="w-3 h-3" /> {3 - (attemptsUsed || 0)} attempts left
                </Badge>
                <Button onClick={handleSaveBehavior} disabled={saving || hasSavedProfile} size="sm" className="gap-1.5">
                  <Save className="w-3.5 h-3.5" />
                  {hasSavedProfile ? "Saved" : saving ? "Saving…" : "Save Profile"}
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

  {/* DDoS ATTACKS */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card rounded-2xl border border-border p-5"
  >

    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">

      <ShieldAlert className="w-5 h-5 text-red-500" />

    </div>

    <p className="text-3xl font-bold text-red-500">

      {attackData.totalAttacks}

    </p>

    <p className="text-xs text-muted-foreground mt-1">
      DDoS Attacks
    </p>

  </motion.div>

  {/* BLOCKED */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="bg-card rounded-2xl border border-border p-5"
  >

    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">

      <Ban className="w-5 h-5 text-green-500" />

    </div>

    <p className="text-3xl font-bold text-green-500">

      {attackData.blockedAttacks}

    </p>

    <p className="text-xs text-muted-foreground mt-1">
      Threats Blocked
    </p>

  </motion.div>

  {/* ACTIVE USERS */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="bg-card rounded-2xl border border-border p-5"
  >

    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">

      <Users className="w-5 h-5 text-blue-500" />

    </div>

    <p className="text-3xl font-bold text-blue-500">

      {ACTIVE_SESSIONS.length}

    </p>

    <p className="text-xs text-muted-foreground mt-1">
      Active Sessions
    </p>

  </motion.div>

  {/* FIREWALL */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="bg-card rounded-2xl border border-border p-5"
  >

    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">

      <ShieldCheck className="w-5 h-5 text-emerald-500" />

    </div>

    <p className="text-2xl font-bold text-emerald-500">
      ACTIVE
    </p>

    <p className="text-xs text-muted-foreground mt-1">
      Firewall Status
    </p>

  </motion.div>

</div>

            {/* Quick threat preview + system status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent Threats */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-500" /> Recent Threats</h3>
                  <button onClick={() => setActiveTab("threats")} className="text-xs text-primary hover:underline">View all</button>
                </div>
                <div className="space-y-2">
                  {THREAT_FEED.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{t.type}</p>
                        <p className="text-xs text-muted-foreground">{t.ip} · {t.time}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${severityColor[t.severity]}`}>
                        {t.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Status */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-4"><Server className="w-4 h-4 text-primary" /> System Status</h3>
                <div className="space-y-3">
                  {[
                    { label: "Auth Service", icon: Lock, status: "Online", ok: true },
                    { label: "Behavior Engine", icon: Activity, status: "Running", ok: true },
                    { label: "Firewall", icon: Shield, status: "Active", ok: true },
                    { label: "Intrusion Detection", icon: Radio, status: "Monitoring", ok: true },
                    { label: "Network Monitor", icon: Wifi, status: "Online", ok: true },
                    { label: "Geo-IP Lookup", icon: Globe, status: "Active", ok: true },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        {s.label}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${s.ok ? "bg-emerald-400" : "bg-red-400"}`}></span>
                        <span className={`text-xs font-medium ${s.ok ? "text-emerald-600" : "text-red-600"}`}>{s.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── THREATS TAB ── */}
{activeTab === "threats" && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="space-y-6"
  >

    {/* HEADER */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

      <div>

        <h2 className="text-2xl font-bold flex items-center gap-2">

          <ShieldAlert className="w-6 h-6 text-red-500" />

          Live Threat Intelligence

        </h2>

        <p className="text-sm text-muted-foreground mt-1">

          Real-time DDoS monitoring & attack analysis

        </p>

      </div>

      <div className="flex items-center gap-3">

        <Badge className="bg-red-100 text-red-700 border-red-200 border px-3 py-1">

          {THREAT_FEED.length} Active Threats

        </Badge>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100">

          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>

          <span className="text-xs font-semibold text-green-700">

            LIVE

          </span>

        </div>

      </div>

    </div>

    {/* THREAT STATS */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      {/* TOTAL */}
      <div className="bg-card border border-border rounded-2xl p-5">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm text-muted-foreground">

              Total DDoS Attacks

            </p>

            <h2 className="text-4xl font-bold text-red-500 mt-2">

              {attackData.totalAttacks}

            </h2>

          </div>

          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">

            <ShieldAlert className="w-7 h-7 text-red-500" />

          </div>

        </div>

      </div>

      {/* BLOCKED */}
      <div className="bg-card border border-border rounded-2xl p-5">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm text-muted-foreground">

              Blocked Threats

            </p>

            <h2 className="text-4xl font-bold text-green-500 mt-2">

              {attackData.blockedAttacks}

            </h2>

          </div>

          <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">

            <Ban className="w-7 h-7 text-green-500" />

          </div>

        </div>

      </div>

      {/* FIREWALL */}
      <div className="bg-card border border-border rounded-2xl p-5">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm text-muted-foreground">

              Firewall Status

            </p>

            <h2 className="text-2xl font-bold text-emerald-500 mt-3">

              ACTIVE

            </h2>

          </div>

          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">

            <ShieldCheck className="w-7 h-7 text-emerald-500" />

          </div>

        </div>

      </div>

    </div>

    {/* LIVE THREAT FEED */}
    <div className="bg-card rounded-3xl border border-border overflow-hidden">

      <div className="p-5 border-b border-border flex items-center justify-between">

        <div>

          <h3 className="font-bold text-lg">

            Live Attack Feed

          </h3>

          <p className="text-sm text-muted-foreground">

            Real-time blocked DDoS attacks

          </p>

        </div>

        <Activity className="w-5 h-5 text-primary animate-pulse" />

      </div>

      <div className="divide-y divide-border">

        {THREAT_FEED.length > 0 ? (

          THREAT_FEED.map((t, index) => (

            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 hover:bg-secondary/20 transition-colors"
            >

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                <div className="flex items-center gap-4">

                  <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">

                    <ShieldAlert className="w-6 h-6 text-red-500" />

                  </div>

                  <div>

                    <h4 className="font-semibold text-red-500">

                      {t.type || "DDoS Attack"}

                    </h4>

                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">

                      <span>

                        IP: {t.ip || "Unknown"}

                      </span>

                      <span>

                        Status: BLOCKED

                      </span>

                    </div>

                  </div>

                </div>

                <div className="flex items-center gap-3">

                  <Badge className="bg-green-100 text-green-700 border-green-200 border">

                    Blocked

                  </Badge>

                  <span className="text-sm text-muted-foreground">

                    {t.time || "Now"}

                  </span>

                </div>

              </div>

            </motion.div>

          ))

        ) : (

          <div className="p-12 text-center">

            <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />

            <h3 className="text-xl font-bold">

              System Protected

            </h3>

            <p className="text-muted-foreground mt-2">

              No DDoS attacks detected

            </p>

          </div>

        )}

      </div>

    </div>

  </motion.div>
)}

        {/* ── SESSIONS TAB ── */}
        {activeTab === "sessions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Active Sessions</h2>
            <div className="grid gap-3">
              {ACTIVE_SESSIONS.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      {s.user[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{s.user}</p>
                      <p className="text-xs text-muted-foreground">{s.device} · {s.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="gap-1.5 text-xs">
                      <Clock className="w-3 h-3" /> {s.duration}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statusColor[s.status]}`}></span>
                      <span className="text-xs capitalize font-medium">{s.status}</span>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/5">
                      Revoke
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── BEHAVIOR TAB ── */}
        {activeTab === "behavior" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Behavior Analysis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard icon={Keyboard} label="Typing Speed" value={data.typingSpeed || 0} unit="CPM" delay={0.1} />
              <MetricCard icon={Timer} label="Avg Key Interval" value={data.avgInterval || 0} unit="ms" delay={0.2} />
              <MetricCard icon={Activity} label="Key Hold Duration" value={data.avgHoldDuration || 0} unit="ms" delay={0.3} />
              <MetricCard icon={MousePointer2} label="Mouse Speed" value={data.mouseSpeed || 0} unit="px/s" delay={0.4} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ConfidenceGauge confidence={comparison?.confidence || 100} />
              <div className="lg:col-span-2">
                <BehaviorBreakdown breakdown={comparison?.breakdown} behaviorData={data} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricCard icon={MousePointer2} label="Mouse Accuracy" value={data.mouseAccuracy || 0} unit="%" delay={0.1} />
              <MetricCard icon={Zap} label="Mouse Clicks" value={data.mouseClicks || 0} unit="" delay={0.2} />
              <MetricCard icon={Keyboard} label="Total Keystrokes" value={data.totalKeystrokes || 0} unit="" delay={0.3} />
              <MetricCard icon={Activity} label="Mouse Samples" value={data.mouseMovementSamples || 0} unit="" delay={0.4} />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}