import { useEffect, useState } from "react";

// Empty string means same origin (Vercel serves the API at /api).
export const API = process.env.REACT_APP_API_URL ?? "http://localhost:5001";

export const COLORS = {
  Open: "#ff4d6d", "Under Investigation": "#f4a261", Resolved: "#52b788", Closed: "#4cc9f0",
  Critical: "#ff073a", High: "#ff4d6d", Medium: "#f4a261", Low: "#52b788",
  Recovered: "#52b788", Ongoing: "#f4a261", Compensated: "#4cc9f0", Dismissed: "#adb5bd",
  Monitoring: "#f4a261", Blocked: "#ff073a", Active: "#ff4d6d", Cleared: "#52b788",
};

export const riskColor = (r) => ({ Critical: "#ff073a", High: "#ff4d6d", Medium: "#f4a261", Low: "#52b788" }[r] || "#adb5bd");
export const statusColor = (s) => COLORS[s] || "#adb5bd";

export const Badge = ({ label, color }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}55`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>
    {label}
  </span>
);

export const StatCard = ({ icon, label, value, sub, accent }) => (
  <div style={{ background: "#0d1117", border: `1px solid ${accent}33`, borderRadius: 12, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
    <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 32, fontWeight: 800, color: accent, fontFamily: "monospace", letterSpacing: -1 }}>{value ?? "..."}</div>
    <div style={{ fontSize: 13, color: "#8b949e", marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: accent + "aa", marginTop: 6, fontFamily: "monospace" }}>{sub}</div>}
  </div>
);

export const SectionTitle = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
    <div style={{ width: 3, height: 20, background: "#4cc9f0", borderRadius: 2 }} />
    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e6edf3", letterSpacing: 1, textTransform: "uppercase", fontFamily: "monospace" }}>{children}</h2>
  </div>
);

export const Card = ({ children, style = {} }) => (
  <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 12, padding: 24, ...style }}>
    {children}
  </div>
);

export const Loader = () => (
  <div style={{ color: "#4cc9f0", fontFamily: "monospace", fontSize: 13, padding: 20 }}>Loading live data...</div>
);

export const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ margin: 0, color: "#8b949e", fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color || "#4cc9f0", fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>
          {p.name}: {typeof p.value === "number" && p.value > 1000 ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

// Fetches JSON from the API; `reload` refetches, e.g. after a form changes data.
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fetch(`${API}${path}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(d => { if (!cancelled) { setData(d); setError(null); } })
      .catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [path, version]);
  return { data, error, reload: () => setVersion(v => v + 1) };
}

export const th = { textAlign: "left", padding: "8px 12px", color: "#8b949e", fontWeight: 600, fontSize: 11, letterSpacing: 1 };
export const td = { padding: "12px", color: "#e6edf3", fontSize: 12 };
