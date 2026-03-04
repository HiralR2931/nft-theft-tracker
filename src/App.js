import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
// ── Real data from CSVs ──────────────────────────────────────
const THEFT_STATUSES = [
  { name: "Open", value: 7, color: "#ff4d6d" },
  { name: "Under Investigation", value: 7, color: "#f4a261" },
  { name: "Resolved", value: 5, color: "#52b788" },
  { name: "Closed", value: 1, color: "#4cc9f0" },
];

const WALLET_RISKS = [
  { name: "Critical", value: 6, color: "#ff073a" },
  { name: "High", value: 5, color: "#ff4d6d" },
  { name: "Medium", value: 5, color: "#f4a261" },
  { name: "Low", value: 4, color: "#52b788" },
];

const PLATFORM_REPORTS = [
  { platform: "OpenSea", reports: 7 },
  { platform: "Rarible", reports: 5 },
  { platform: "Foundation", reports: 5 },
  { platform: "SuperRare", reports: 3 },
];

const RESOLUTION_OUTCOMES = [
  { outcome: "Recovered", value: 4, color: "#52b788" },
  { outcome: "Ongoing", value: 4, color: "#f4a261" },
  { outcome: "Compensated", value: 2, color: "#4cc9f0" },
  { outcome: "Dismissed", value: 1, color: "#adb5bd" },
];

const INVESTIGATORS = [
  { name: "John Detective", cases: 3, active: 2, expertise: "Blockchain Forensics" },
  { name: "Lisa Tracker", cases: 2, active: 1, expertise: "Digital Art Auth." },
  { name: "Robert Holmes", cases: 2, active: 1, expertise: "NFT Fraud" },
  { name: "Maria Inspector", cases: 2, active: 2, expertise: "Copyright Law" },
  { name: "Tom Analyst", cases: 2, active: 1, expertise: "Transaction Analysis" },
  { name: "Agent X006", cases: 2, active: 1, expertise: "Consultant" },
  { name: "Agent X007", cases: 2, active: 2, expertise: "Forensic Analyst" },
  { name: "Agent X008", cases: 1, active: 1, expertise: "Assistant" },
];

const RECENT_TRANSACTIONS = [
  { id: "TXN001", artwork: "AWK001", wallet: "0xSuspicious001", risk: "High", amount: 250000, time: "2023-09-01" },
  { id: "TXN002", artwork: "AWK002", wallet: "0xSuspicious002", risk: "Critical", amount: 180000, time: "2023-09-02" },
  { id: "TXN003", artwork: "AWK003", wallet: "0xSuspicious003", risk: "Medium", amount: 320000, time: "2023-09-03" },
  { id: "TXN004", artwork: "AWK004", wallet: "0xSuspicious004", risk: "Low", amount: 100000, time: "2023-09-04" },
  { id: "TXN005", artwork: "AWK005", wallet: "0xSuspicious005", risk: "High", amount: 120000, time: "2023-09-05" },
  { id: "TXN006", artwork: "AWK006", wallet: "0xSuspicious001", risk: "High", amount: 95000, time: "2023-09-06" },
];

const SUSPICIOUS_WALLETS = [
  { id: "WAL001", address: "0xSuspicious001", risk: "High", status: "Monitoring", flagged: "2023-08-01", lastActivity: "2023-09-20" },
  { id: "WAL002", address: "0xSuspicious002", risk: "Critical", status: "Blocked", flagged: "2023-08-05", lastActivity: "2023-09-19" },
  { id: "WAL003", address: "0xSuspicious003", risk: "Medium", status: "Active", flagged: "2023-08-10", lastActivity: "2023-09-18" },
  { id: "WAL004", address: "0xSuspicious004", risk: "Low", status: "Cleared", flagged: "2023-08-15", lastActivity: "2023-09-17" },
  { id: "WAL005", address: "0xSuspicious005", risk: "High", status: "Monitoring", flagged: "2023-08-20", lastActivity: "2023-09-21" },
  { id: "WAL006", address: "0xSuspicious006", risk: "Critical", status: "Blocked", flagged: "2023-08-22", lastActivity: "2023-09-22" },
];

// ── Helpers ──────────────────────────────────────────────────
const riskColor = (r) => ({ Critical: "#ff073a", High: "#ff4d6d", Medium: "#f4a261", Low: "#52b788" }[r] || "#adb5bd");
const statusColor = (s) => ({ Open: "#ff4d6d", "Under Investigation": "#f4a261", Resolved: "#52b788", Closed: "#4cc9f0", Monitoring: "#f4a261", Blocked: "#ff073a", Active: "#ff4d6d", Cleared: "#52b788" }[s] || "#adb5bd");

const Badge = ({ label, color }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}55`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>
    {label}
  </span>
);

const StatCard = ({ icon, label, value, sub, accent }) => (
  <div style={{ background: "#0d1117", border: `1px solid ${accent}33`, borderRadius: 12, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
    <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 32, fontWeight: 800, color: accent, fontFamily: "monospace", letterSpacing: -1 }}>{value}</div>
    <div style={{ fontSize: 13, color: "#8b949e", marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: accent + "aa", marginTop: 6, fontFamily: "monospace" }}>{sub}</div>}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
    <div style={{ width: 3, height: 20, background: "#4cc9f0", borderRadius: 2 }} />
    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e6edf3", letterSpacing: 1, textTransform: "uppercase", fontFamily: "monospace" }}>{children}</h2>
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 12, padding: 24, ...style }}>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
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

// ── NAV TABS ─────────────────────────────────────────────────
const TABS = ["Overview", "Investigations", "Wallets", "Transactions"];

export default function NFTDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div style={{ minHeight: "100vh", background: "#010409", color: "#e6edf3", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #21262d", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, background: "#0d1117" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #4cc9f0, #f72585)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔍</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#e6edf3", letterSpacing: 2 }}>NFT THEFT TRACKER</div>
            <div style={{ fontSize: 10, color: "#4cc9f0", letterSpacing: 3 }}>FORENSICS DASHBOARD</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#52b788", boxShadow: "0 0 6px #52b788" }} />
          <span style={{ fontSize: 11, color: "#52b788", letterSpacing: 1 }}>LIVE</span>
          <span style={{ fontSize: 11, color: "#8b949e", marginLeft: 8 }}>20 Active Cases</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #21262d", padding: "0 32px", display: "flex", gap: 0, background: "#0d1117" }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #4cc9f0" : "2px solid transparent", color: activeTab === tab ? "#4cc9f0" : "#8b949e", padding: "14px 20px", fontSize: 12, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1, cursor: "pointer", transition: "color 0.2s" }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 32, maxWidth: 1400, margin: "0 auto" }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "Overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <StatCard icon="📋" label="Total Theft Reports" value="20" sub="7 Open · 7 Under Investigation" accent="#ff4d6d" />
              <StatCard icon="🔎" label="Active Investigations" value="8" sub="4 High/Critical Priority" accent="#f4a261" />
              <StatCard icon="👛" label="Suspicious Wallets" value="20" sub="6 Critical · 5 High Risk" accent="#f72585" />
              <StatCard icon="✅" label="Cases Resolved" value="6" sub="4 Recovered · 2 Compensated" accent="#52b788" />
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Card>
                <SectionTitle>Theft Reports by Status</SectionTitle>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={THEFT_STATUSES} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" paddingAngle={3}>
                      {THEFT_STATUSES.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: "#8b949e", fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <SectionTitle>Platform Theft Reports</SectionTitle>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={PLATFORM_REPORTS} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="platform" tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="reports" fill="#4cc9f0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Resolution outcomes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Card>
                <SectionTitle>Case Resolution Outcomes</SectionTitle>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={RESOLUTION_OUTCOMES} layout="vertical" barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="outcome" tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {RESOLUTION_OUTCOMES.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <SectionTitle>Wallet Risk Distribution</SectionTitle>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={WALLET_RISKS} cx="50%" cy="50%" outerRadius={75} dataKey="value" paddingAngle={3}>
                      {WALLET_RISKS.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: "#8b949e", fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {/* ── INVESTIGATIONS TAB ── */}
        {activeTab === "Investigations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <StatCard icon="🟥" label="Critical Priority" value="2" sub="Immediate action required" accent="#ff073a" />
              <StatCard icon="🟧" label="High Priority" value="2" sub="Urgent cases" accent="#f4a261" />
              <StatCard icon="👥" label="Total Investigators" value="8" sub="Across all active cases" accent="#4cc9f0" />
            </div>

            <Card>
              <SectionTitle>Investigator Workload</SectionTitle>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={INVESTIGATORS} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="name" tick={{ fill: "#8b949e", fontSize: 10 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ color: "#8b949e", fontSize: 12 }}>{v}</span>} />
                  <Bar dataKey="cases" name="Total Cases" fill="#4cc9f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="active" name="Active Cases" fill="#f72585" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <SectionTitle>Investigator Roster</SectionTitle>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #21262d" }}>
                    {["Name", "Expertise", "Total Cases", "Active", "Load"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#8b949e", fontWeight: 600, fontSize: 11, letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INVESTIGATORS.map((inv, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #161b22" }}>
                      <td style={{ padding: "12px", color: "#e6edf3", fontWeight: 600 }}>{inv.name}</td>
                      <td style={{ padding: "12px", color: "#8b949e", fontSize: 12 }}>{inv.expertise}</td>
                      <td style={{ padding: "12px" }}><Badge label={inv.cases} color="#4cc9f0" /></td>
                      <td style={{ padding: "12px" }}><Badge label={inv.active} color={inv.active >= 2 ? "#f4a261" : "#52b788"} /></td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ width: 80, height: 6, background: "#21262d", borderRadius: 3 }}>
                          <div style={{ width: `${(inv.active / 3) * 100}%`, height: "100%", background: inv.active >= 2 ? "#f4a261" : "#52b788", borderRadius: 3 }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ── WALLETS TAB ── */}
        {activeTab === "Wallets" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <StatCard icon="🔴" label="Critical Wallets" value="6" sub="Immediate block recommended" accent="#ff073a" />
              <StatCard icon="🟠" label="High Risk" value="5" sub="Under active monitoring" accent="#ff4d6d" />
              <StatCard icon="🚫" label="Blocked" value="6" sub="Access restricted" accent="#f72585" />
              <StatCard icon="👁️" label="Monitoring" value="7" sub="Flagged for tracking" accent="#f4a261" />
            </div>

            <Card>
              <SectionTitle>Suspicious Wallet Registry</SectionTitle>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #21262d" }}>
                    {["Wallet ID", "Address", "Risk Level", "Status", "First Flagged", "Last Activity"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#8b949e", fontWeight: 600, fontSize: 11, letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SUSPICIOUS_WALLETS.map((w, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #161b22", background: i % 2 === 0 ? "#0d111722" : "transparent" }}>
                      <td style={{ padding: "12px", color: "#4cc9f0", fontFamily: "monospace", fontSize: 12 }}>{w.id}</td>
                      <td style={{ padding: "12px", color: "#8b949e", fontFamily: "monospace", fontSize: 11 }}>{w.address}</td>
                      <td style={{ padding: "12px" }}><Badge label={w.risk} color={riskColor(w.risk)} /></td>
                      <td style={{ padding: "12px" }}><Badge label={w.status} color={statusColor(w.status)} /></td>
                      <td style={{ padding: "12px", color: "#8b949e", fontSize: 12 }}>{w.flagged}</td>
                      <td style={{ padding: "12px", color: "#8b949e", fontSize: 12 }}>{w.lastActivity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card>
              <SectionTitle>Risk Level Breakdown</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={WALLET_RISKS} barSize={50}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="name" tick={{ fill: "#8b949e", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#8b949e", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Wallets" radius={[6, 6, 0, 0]}>
                    {WALLET_RISKS.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── TRANSACTIONS TAB ── */}
        {activeTab === "Transactions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <StatCard icon="💸" label="Total Transactions" value="20" sub="Linked to suspicious wallets" accent="#4cc9f0" />
              <StatCard icon="📈" label="Highest Amount" value="320K" sub="TXN003 · AWK003" accent="#f72585" />
              <StatCard icon="⚠️" label="High/Critical Linked" value="11" sub="Require forensic review" accent="#ff4d6d" />
            </div>

            <Card>
              <SectionTitle>Recent Suspicious Transactions</SectionTitle>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #21262d" }}>
                    {["Tx ID", "Artwork", "Wallet", "Risk", "Amount (ETH)", "Date"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#8b949e", fontWeight: 600, fontSize: 11, letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RECENT_TRANSACTIONS.map((tx, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #161b22" }}>
                      <td style={{ padding: "12px", color: "#4cc9f0", fontFamily: "monospace", fontSize: 12 }}>{tx.id}</td>
                      <td style={{ padding: "12px", color: "#e6edf3", fontSize: 12 }}>{tx.artwork}</td>
                      <td style={{ padding: "12px", color: "#8b949e", fontFamily: "monospace", fontSize: 11 }}>{tx.wallet}</td>
                      <td style={{ padding: "12px" }}><Badge label={tx.risk} color={riskColor(tx.risk)} /></td>
                      <td style={{ padding: "12px", color: "#f4a261", fontFamily: "monospace", fontWeight: 700 }}>{tx.amount.toLocaleString()}</td>
                      <td style={{ padding: "12px", color: "#8b949e", fontSize: 12 }}>{tx.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card>
              <SectionTitle>Transaction Amounts by Artwork</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={RECENT_TRANSACTIONS} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="artwork" tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
                    {RECENT_TRANSACTIONS.map((e, i) => <Cell key={i} fill={riskColor(e.risk)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
