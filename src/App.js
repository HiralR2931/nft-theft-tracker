import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const API = "https://nft-theft-tracker-production.up.railway.app";

const COLORS = {
  Open: "#ff4d6d", "Under Investigation": "#f4a261", Resolved: "#52b788", Closed: "#4cc9f0",
  Critical: "#ff073a", High: "#ff4d6d", Medium: "#f4a261", Low: "#52b788",
  Recovered: "#52b788", Ongoing: "#f4a261", Compensated: "#4cc9f0", Dismissed: "#adb5bd",
  Monitoring: "#f4a261", Blocked: "#ff073a", Active: "#ff4d6d", Cleared: "#52b788",
};

const riskColor = (r) => ({ Critical: "#ff073a", High: "#ff4d6d", Medium: "#f4a261", Low: "#52b788" }[r] || "#adb5bd");
const statusColor = (s) => COLORS[s] || "#adb5bd";

const Badge = ({ label, color }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}55`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>
    {label}
  </span>
);

const StatCard = ({ icon, label, value, sub, accent }) => (
  <div style={{ background: "#0d1117", border: `1px solid ${accent}33`, borderRadius: 12, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
    <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 32, fontWeight: 800, color: accent, fontFamily: "monospace", letterSpacing: -1 }}>{value ?? "..."}</div>
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

const Loader = () => (
  <div style={{ color: "#4cc9f0", fontFamily: "monospace", fontSize: 13, padding: 20 }}>Loading live data...</div>
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

const TABS = ["Overview", "Investigations", "Wallets", "Transactions"];

export default function NFTDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  // Live data state
  const [stats, setStats] = useState(null);
  const [theftStatus, setTheftStatus] = useState([]);
  const [platformReports, setPlatformReports] = useState([]);
  const [walletRisks, setWalletRisks] = useState([]);
  const [resolutions, setResolutions] = useState([]);
  const [investigators, setInvestigators] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Fetch all data on mount
  useEffect(() => {
    fetch(`${API}/api/stats`).then(r => r.json()).then(setStats).catch(console.error);
    fetch(`${API}/api/theft-status`).then(r => r.json()).then(setTheftStatus).catch(console.error);
    fetch(`${API}/api/platform-reports`).then(r => r.json()).then(setPlatformReports).catch(console.error);
    fetch(`${API}/api/wallet-risks`).then(r => r.json()).then(setWalletRisks).catch(console.error);
    fetch(`${API}/api/resolutions`).then(r => r.json()).then(setResolutions).catch(console.error);
    fetch(`${API}/api/investigator-workload`).then(r => r.json()).then(setInvestigators).catch(console.error);
    fetch(`${API}/api/wallets`).then(r => r.json()).then(setWallets).catch(console.error);
    fetch(`${API}/api/transactions`).then(r => r.json()).then(setTransactions).catch(console.error);
  }, []);

  const theftStatusColored = theftStatus.map(d => ({ ...d, color: COLORS[d.name] || "#adb5bd" }));
  const walletRisksColored = walletRisks.map(d => ({ ...d, color: riskColor(d.name) }));
  const resolutionsColored = resolutions.map(d => ({ ...d, color: COLORS[d.outcome] || "#adb5bd" }));

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
          <span style={{ fontSize: 11, color: "#8b949e", marginLeft: 8 }}>{stats ? `${stats.totalReports} Active Cases` : "Loading..."}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #21262d", padding: "0 32px", display: "flex", gap: 0, background: "#0d1117" }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #4cc9f0" : "2px solid transparent", color: activeTab === tab ? "#4cc9f0" : "#8b949e", padding: "14px 20px", fontSize: 12, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1, cursor: "pointer" }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 32, maxWidth: 1400, margin: "0 auto" }}>

        {/* OVERVIEW */}
        {activeTab === "Overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <StatCard icon="📋" label="Total Theft Reports" value={stats?.totalReports} sub="All filed cases" accent="#ff4d6d" />
              <StatCard icon="🔎" label="Active Investigations" value={stats?.activeInvestigations} sub="Currently open" accent="#f4a261" />
              <StatCard icon="👛" label="Suspicious Wallets" value={stats?.totalWallets} sub="Flagged wallets" accent="#f72585" />
              <StatCard icon="✅" label="Cases Resolved" value={stats?.resolvedCases} sub="Successfully closed" accent="#52b788" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Card>
                <SectionTitle>Theft Reports by Status</SectionTitle>
                {theftStatus.length === 0 ? <Loader /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={theftStatusColored} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" paddingAngle={3}>
                        {theftStatusColored.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={(v) => <span style={{ color: "#8b949e", fontSize: 12 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card>
                <SectionTitle>Platform Theft Reports</SectionTitle>
                {platformReports.length === 0 ? <Loader /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={platformReports} barSize={22}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                      <XAxis dataKey="platform" tick={{ fill: "#8b949e", fontSize: 10 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={50} />
                      <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="reports" fill="#4cc9f0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Card>
                <SectionTitle>Case Resolution Outcomes</SectionTitle>
                {resolutions.length === 0 ? <Loader /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={resolutionsColored} layout="vertical" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="outcome" tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {resolutionsColored.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card>
                <SectionTitle>Wallet Risk Distribution</SectionTitle>
                {walletRisks.length === 0 ? <Loader /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={walletRisksColored} cx="50%" cy="50%" outerRadius={75} dataKey="value" paddingAngle={3}>
                        {walletRisksColored.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={(v) => <span style={{ color: "#8b949e", fontSize: 12 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* INVESTIGATIONS */}
        {activeTab === "Investigations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <StatCard icon="🔎" label="Active Investigations" value={stats?.activeInvestigations} sub="Currently open" accent="#ff073a" />
              <StatCard icon="✅" label="Cases Resolved" value={stats?.resolvedCases} sub="Successfully closed" accent="#52b788" />
              <StatCard icon="👥" label="Total Investigators" value={investigators.length} sub="Across all cases" accent="#4cc9f0" />
            </div>

            <Card>
              <SectionTitle>Investigator Workload</SectionTitle>
              {investigators.length === 0 ? <Loader /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={investigators} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="name" tick={{ fill: "#8b949e", fontSize: 10 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: "#8b949e", fontSize: 12 }}>{v}</span>} />
                    <Bar dataKey="cases" name="Total Cases" fill="#4cc9f0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="active" name="Active Cases" fill="#f72585" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card>
              <SectionTitle>Investigator Roster</SectionTitle>
              {investigators.length === 0 ? <Loader /> : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #21262d" }}>
                      {["Name", "Expertise", "Total Cases", "Active", "Load"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#8b949e", fontWeight: 600, fontSize: 11, letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {investigators.map((inv, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #161b22" }}>
                        <td style={{ padding: "12px", color: "#e6edf3", fontWeight: 600 }}>{inv.name}</td>
                        <td style={{ padding: "12px", color: "#8b949e", fontSize: 12 }}>{inv.expertise}</td>
                        <td style={{ padding: "12px" }}><Badge label={inv.cases} color="#4cc9f0" /></td>
                        <td style={{ padding: "12px" }}><Badge label={inv.active || 0} color={inv.active >= 2 ? "#f4a261" : "#52b788"} /></td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ width: 80, height: 6, background: "#21262d", borderRadius: 3 }}>
                            <div style={{ width: `${Math.min((inv.active / 5) * 100, 100)}%`, height: "100%", background: inv.active >= 3 ? "#f4a261" : "#52b788", borderRadius: 3 }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        )}

        {/* WALLETS */}
        {activeTab === "Wallets" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <StatCard icon="🔴" label="Critical Wallets" value={walletRisks.find(w => w.name === "Critical")?.value} sub="Immediate action" accent="#ff073a" />
              <StatCard icon="🟠" label="High Risk" value={walletRisks.find(w => w.name === "High")?.value} sub="Active monitoring" accent="#ff4d6d" />
              <StatCard icon="🟡" label="Medium Risk" value={walletRisks.find(w => w.name === "Medium")?.value} sub="Under watch" accent="#f4a261" />
              <StatCard icon="🟢" label="Low Risk" value={walletRisks.find(w => w.name === "Low")?.value} sub="Flagged wallets" accent="#52b788" />
            </div>

            <Card>
              <SectionTitle>Suspicious Wallet Registry</SectionTitle>
              {wallets.length === 0 ? <Loader /> : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #21262d" }}>
                      {["Wallet ID", "Address", "Risk Level", "Status", "First Flagged", "Last Activity"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#8b949e", fontWeight: 600, fontSize: 11, letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map((w, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #161b22" }}>
                        <td style={{ padding: "12px", color: "#4cc9f0", fontFamily: "monospace", fontSize: 12 }}>{w.id}</td>
                        <td style={{ padding: "12px", color: "#8b949e", fontFamily: "monospace", fontSize: 11 }}>{w.address}</td>
                        <td style={{ padding: "12px" }}><Badge label={w.risk} color={riskColor(w.risk)} /></td>
                        <td style={{ padding: "12px" }}><Badge label={w.status} color={statusColor(w.status)} /></td>
                        <td style={{ padding: "12px", color: "#8b949e", fontSize: 12 }}>{w.flagged ? new Date(w.flagged).toLocaleDateString() : "-"}</td>
                        <td style={{ padding: "12px", color: "#8b949e", fontSize: 12 }}>{w.lastActivity ? new Date(w.lastActivity).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card>
              <SectionTitle>Risk Level Breakdown</SectionTitle>
              {walletRisks.length === 0 ? <Loader /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={walletRisksColored} barSize={50}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="name" tick={{ fill: "#8b949e", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8b949e", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Wallets" radius={[6, 6, 0, 0]}>
                      {walletRisksColored.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        {/* TRANSACTIONS */}
        {activeTab === "Transactions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <StatCard icon="💸" label="Total Transactions" value={transactions.length > 0 ? "500+" : "..."} sub="Linked to suspicious wallets" accent="#4cc9f0" />
              <StatCard icon="📈" label="Highest Amount" value={transactions.length > 0 ? `${Math.max(...transactions.map(t => Number(t.amount))).toLocaleString()}` : "..."} sub="Max transaction value" accent="#f72585" />
              <StatCard icon="⚠️" label="High/Critical Linked" value={transactions.filter(t => t.risk === "High" || t.risk === "Critical").length} sub="Require forensic review" accent="#ff4d6d" />
            </div>

            <Card>
              <SectionTitle>Recent Suspicious Transactions</SectionTitle>
              {transactions.length === 0 ? <Loader /> : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #21262d" }}>
                      {["Tx ID", "Artwork", "Wallet", "Risk", "Amount (ETH)", "Date"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#8b949e", fontWeight: 600, fontSize: 11, letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #161b22" }}>
                        <td style={{ padding: "12px", color: "#4cc9f0", fontFamily: "monospace", fontSize: 12 }}>{tx.id}</td>
                        <td style={{ padding: "12px", color: "#e6edf3", fontSize: 12 }}>{tx.artwork}</td>
                        <td style={{ padding: "12px", color: "#8b949e", fontFamily: "monospace", fontSize: 11 }}>{tx.wallet?.substring(0, 15)}...</td>
                        <td style={{ padding: "12px" }}><Badge label={tx.risk} color={riskColor(tx.risk)} /></td>
                        <td style={{ padding: "12px", color: "#f4a261", fontFamily: "monospace", fontWeight: 700 }}>{Number(tx.amount).toLocaleString()}</td>
                        <td style={{ padding: "12px", color: "#8b949e", fontSize: 12 }}>{tx.time ? new Date(tx.time).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card>
              <SectionTitle>Transaction Amounts by Artwork</SectionTitle>
              {transactions.length === 0 ? <Loader /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={transactions.slice(0, 10)} barSize={30}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="artwork" tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
                      {transactions.slice(0, 10).map((e, i) => <Cell key={i} fill={riskColor(e.risk)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}