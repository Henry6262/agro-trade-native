"use client";

import { Check, Lock, Bell, TrendingUp, CheckCircle, Truck, ShieldCheck, Package, Search, User } from "lucide-react";

// ── Onboarding screens cycling inside the phone mockup ──────────────────────

export function ScreenWelcome() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#0C0904" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "rgba(232,200,112,0.12)", border: "1px solid rgba(232,200,112,0.25)" }}>
        <span style={{ fontSize: 32 }}>🌾</span>
      </div>
      <h2 style={{ color: "#F0E5CC", fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>
        Welcome to AgroTrade
      </h2>
      <p style={{ color: "#8B7B68", fontSize: 12, textAlign: "center", lineHeight: 1.6, marginBottom: 32 }}>
        Agricultural trade powered by{"\n"}smart-contract escrow
      </p>
      <div style={{
        width: "100%", padding: "14px 0", borderRadius: 16, textAlign: "center",
        background: "#E8C870", color: "#0C0904", fontSize: 14, fontWeight: 700,
      }}>
        Get Started
      </div>
      <p style={{ color: "#8B7B68", fontSize: 11, marginTop: 16 }}>Sign in with wallet · No crypto needed</p>
    </div>
  );
}

export function ScreenRoleSelect() {
  const roles = [
    { icon: Package, label: "Buyer", desc: "Source grain & produce", active: true },
    { icon: User, label: "Seller", desc: "List your harvest" },
    { icon: Search, label: "Inspector", desc: "Verify quality on-site" },
    { icon: Truck, label: "Transporter", desc: "Bid on shipments" },
  ];
  return (
    <div className="w-full h-full flex flex-col px-5 pt-14 pb-6"
      style={{ backgroundColor: "#0C0904" }}>
      <p style={{ color: "#8B7B68", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 6 }}>
        STEP 1 OF 2
      </p>
      <h2 style={{ color: "#F0E5CC", fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
        I am a…
      </h2>
      <p style={{ color: "#8B7B68", fontSize: 11, marginBottom: 20 }}>
        Select your role to personalise your experience
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {roles.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.label}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 14, cursor: "pointer",
                background: r.active ? "rgba(232,200,112,0.08)" : "rgba(255,255,255,0.02)",
                border: r.active ? "1.5px solid rgba(232,200,112,0.30)" : "1px solid rgba(255,255,255,0.06)",
              }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, display: "flex",
                alignItems: "center", justifyContent: "center",
                background: r.active ? "rgba(232,200,112,0.15)" : "rgba(255,255,255,0.04)",
              }}>
                <Icon size={16} color={r.active ? "#E8C870" : "#8B7B68"} />
              </div>
              <div>
                <p style={{ color: r.active ? "#F0E5CC" : "#8B7B68", fontSize: 13, fontWeight: 700 }}>{r.label}</p>
                <p style={{ color: "#8B7B68", fontSize: 10 }}>{r.desc}</p>
              </div>
              {r.active && (
                <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%",
                  background: "#E8C870", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={10} color="#0C0904" strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{
        padding: "13px 0", borderRadius: 14, textAlign: "center",
        background: "#E8C870", color: "#0C0904", fontSize: 13, fontWeight: 700, marginTop: 8,
      }}>
        Continue as Buyer →
      </div>
    </div>
  );
}

export function ScreenDashboard() {
  return (
    <div className="w-full h-full overflow-hidden flex flex-col"
      style={{ backgroundColor: "#0C0904", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div className="flex items-center justify-between px-8 pt-5 pb-1" style={{ color: "#8B7B68", fontSize: "11px" }}>
        <span style={{ fontWeight: 600 }}>9:41</span>
        <div className="flex items-center gap-1">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor" opacity="0.7">
            <rect x="0" y="3" width="3" height="7" rx="1" /><rect x="4.5" y="1.5" width="3" height="8.5" rx="1" />
            <rect x="9" y="0" width="3" height="10" rx="1" /><rect x="13.5" y="0.5" width="2" height="9" rx="1" opacity="0.3" />
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none" opacity="0.7">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.5" />
            <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" />
            <path d="M23 4v4a2 2 0 000-4z" fill="currentColor" fillOpacity="0.4" />
          </svg>
        </div>
      </div>
      <div className="flex items-center justify-between px-6 py-3">
        <div>
          <p style={{ color: "#8B7B68", fontSize: "12px" }}>Welcome back 👋</p>
          <h2 style={{ color: "#F0E5CC", fontSize: "20px", fontWeight: 700 }}>Dashboard</h2>
        </div>
        <div className="relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(232,200,112,0.10)" }}>
            <Bell size={18} style={{ color: "#E8C870" }} />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ backgroundColor: "#E8C870", color: "#0C0904" }}>2</div>
        </div>
      </div>
      <div className="mx-4 p-4 rounded-3xl mb-3" style={{
        background: "rgba(232,200,112,0.06)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(232,200,112,0.18)",
      }}>
        <p style={{ color: "#8B7B68", fontSize: "11px", marginBottom: "4px" }}>ESCROW LOCKED</p>
        <p style={{ color: "#E8C870", fontSize: "26px", fontWeight: 800 }}>
          $840.00 <span style={{ fontSize: "13px", color: "#8B7B68", fontWeight: 400 }}>cUSD</span>
        </p>
        <div className="flex items-center gap-1.5 mt-2" style={{ color: "#3D7A50" }}>
          <TrendingUp size={12} /><span style={{ fontSize: "11px", fontWeight: 600 }}>+12.4% this month</span>
        </div>
      </div>
      <div className="px-4 mb-3">
        <p style={{ color: "#8B7B68", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "6px" }}>ACTIVE TRADE</p>
        <div className="p-3 rounded-2xl" style={{ background: "rgba(232,200,112,0.04)", border: "1px solid rgba(232,200,112,0.10)" }}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p style={{ color: "#F0E5CC", fontSize: "13px", fontWeight: 700 }}>50kg Wheat · Grade A</p>
              <p style={{ color: "#8B7B68", fontSize: "10px" }}>Trade #TRD-2891 · Sofia → Istanbul</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: "rgba(61,122,80,0.15)", color: "#3D7A50" }}>IN TRANSIT</span>
          </div>
          <div className="w-full h-1.5 rounded-full mb-1.5" style={{ backgroundColor: "rgba(232,200,112,0.08)" }}>
            <div className="h-full rounded-full" style={{ width: "65%", background: "linear-gradient(to right, #C4831A, #E8C870)" }} />
          </div>
          <div className="flex justify-between" style={{ color: "#8B7B68", fontSize: "9px" }}>
            <span>Listed</span><span>Inspected</span>
            <span style={{ color: "#E8C870", fontWeight: 600 }}>In Transit</span><span>Delivered</span>
          </div>
        </div>
      </div>
      <div className="px-4 grid grid-cols-2 gap-2 mb-3">
        {[{ label: "Total Trades", value: "24", icon: "📦" }, { label: "Completed", value: "21", icon: "✅" }].map((s) => (
          <div key={s.label} className="p-3 rounded-2xl flex items-center gap-2"
            style={{ background: "rgba(232,200,112,0.04)", border: "1px solid rgba(232,200,112,0.08)" }}>
            <span style={{ fontSize: "18px" }}>{s.icon}</span>
            <div>
              <p style={{ color: "#F0E5CC", fontSize: "15px", fontWeight: 700 }}>{s.value}</p>
              <p style={{ color: "#8B7B68", fontSize: "9px" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 mb-2">
        <div className="p-3 rounded-2xl flex items-center gap-2"
          style={{ backgroundColor: "rgba(61,122,80,0.08)", border: "1px solid rgba(61,122,80,0.2)" }}>
          <CheckCircle size={14} style={{ color: "#3D7A50" }} />
          <p style={{ color: "#3D7A50", fontSize: "11px", fontWeight: 600 }}>Escrow secured · Celo blockchain</p>
          <Lock size={11} style={{ color: "#3D7A50", marginLeft: "auto" }} />
        </div>
      </div>
      <div className="mt-auto border-t flex" style={{ borderColor: "rgba(232,200,112,0.08)", backgroundColor: "#0C0904" }}>
        {["🏠", "📋", "💬", "👤"].map((icon, i) => (
          <button key={i} className="flex-1 py-2.5 flex flex-col items-center gap-0.5"
            style={{ color: i === 0 ? "#E8C870" : "#8B7B68" }}>
            <span style={{ fontSize: "18px" }}>{icon}</span>
            <span style={{ fontSize: "8px", fontWeight: 600 }}>{["Home", "Orders", "Messages", "Profile"][i]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ScreenPaymentReleased() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#0C0904" }}>
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full animate-ping"
          style={{ background: "rgba(74,222,128,0.12)", animationDuration: "1.5s" }} />
        <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "rgba(74,222,128,0.12)", border: "1.5px solid rgba(74,222,128,0.35)" }}>
          <CheckCircle size={36} color="#4ADE80" />
        </div>
      </div>
      <h2 style={{ color: "#4ADE80", fontSize: 20, fontWeight: 800, textAlign: "center", marginBottom: 6 }}>
        Payment Released!
      </h2>
      <p style={{ color: "#8B7B68", fontSize: 12, textAlign: "center", lineHeight: 1.6, marginBottom: 24 }}>
        $2,400 cUSD sent to seller{"\n"}automatically by smart contract
      </p>
      <div style={{
        width: "100%", padding: "12px 16px", borderRadius: 14, marginBottom: 10,
        background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)",
      }}>
        {[["Trade", "#TRD-2891"], ["Amount", "$2,400 cUSD"], ["Route", "Sofia → Istanbul"]].map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#8B7B68", fontSize: 11 }}>{label}</span>
            <span style={{ color: label === "Amount" ? "#4ADE80" : "#F0E5CC", fontSize: 11, fontWeight: label === "Amount" ? 700 : 600 }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
        <ShieldCheck size={13} color="#E8C870" />
        <span style={{ color: "#8B7B68", fontSize: 11 }}>Recorded on Celo · Tx: 0xe5df...8735</span>
      </div>
      <div style={{
        width: "100%", padding: "13px 0", borderRadius: 14, textAlign: "center",
        background: "#E8C870", color: "#0C0904", fontSize: 13, fontWeight: 700,
      }}>
        View Receipt
      </div>
    </div>
  );
}

export const HERO_SCREENS = [
  { id: "welcome", Component: ScreenWelcome, label: "Onboarding" },
  { id: "role", Component: ScreenRoleSelect, label: "Role Select" },
  { id: "dashboard", Component: ScreenDashboard, label: "Dashboard" },
  { id: "released", Component: ScreenPaymentReleased, label: "Payment Released" },
];
