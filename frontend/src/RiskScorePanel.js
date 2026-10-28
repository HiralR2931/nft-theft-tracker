import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Badge, StatCard, SectionTitle, Card, Loader, CustomTooltip, useApi, riskColor, th, td } from "./ui";

const LEVELS = ["Low", "Medium", "High", "Critical"];
const FACTOR_COLORS = { stolenLinks: "#f72585", totalValue: "#4cc9f0", largestValue: "#7209b7", txCount: "#f4a261", recency: "#52b788" };
const eth = v => `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 })} ETH`;

function AgreementMatrix({ agreement }) {
  const max = Math.max(1, ...agreement.flatMap(row => LEVELS.map(l => row[l])));
  return (
    <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
      <thead>
        <tr>
          <th style={th}>Assigned ↓ / Behavior →</th>
          {LEVELS.map(l => <th key={l} style={{ ...th, textAlign: "center" }}>{l}</th>)}
        </tr>
      </thead>
      <tbody>
        {agreement.map(row => (
          <tr key={row.assigned}>
            <td style={td}><Badge label={row.assigned} color={riskColor(row.assigned)} /></td>
            {LEVELS.map(level => {
              const n = row[level];
              const match = level === row.assigned;
              return (
                <td key={level} title={`${n} wallets assigned ${row.assigned}, behave like ${level}`}
                  style={{ ...td, textAlign: "center", fontFamily: "monospace", fontWeight: 700,
                    color: match ? "#52b788" : "#e6edf3", border: match ? "1px solid #52b78866" : "1px solid #161b22",
                    background: `rgba(76, 201, 240, ${(n / max) * 0.35})` }}>
                  {n}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function RiskScorePanel() {
  const { data, error } = useApi("/api/wallets/risk-scores");
  if (error) return <Card><div style={{ color: "#ff4d6d", fontSize: 13 }}>Could not load risk scores ({error}).</div></Card>;
  if (!data) return <Loader />;

  const { summary, factors, wallets, agreement, levels } = data;
  const top = wallets.slice(0, 12).map(w => ({ id: w.id, ...w.contributions }));
  const reviewQueue = wallets.filter(w => w.gap >= 2).slice(0, 10);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard icon="🧮" label="Wallets Scored" value={summary.wallets} sub="From transaction behavior" accent="#4cc9f0" />
        <StatCard icon="🎯" label="Level Agreement" value={`${summary.agreementRate}%`} sub="Assigned level matches behavior" accent="#f4a261" />
        <StatCard icon="⬆️" label="Under-rated" value={summary.underRated} sub="Behave 2+ levels riskier" accent="#ff073a" />
        <StatCard icon="⬇️" label="Over-rated" value={summary.overRated} sub="Behave 2+ levels safer" accent="#52b788" />
      </div>

      <Card>
        <SectionTitle>Highest Behavioral Risk Scores</SectionTitle>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={top} layout="vertical" barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="id" tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={v => <span style={{ color: "#8b949e", fontSize: 11 }}>{v}</span>} />
            {factors.map(f => <Bar key={f.key} dataKey={f.key} name={f.label} stackId="score" fill={FACTOR_COLORS[f.key]} />)}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20, alignItems: "start" }}>
        <Card>
          <SectionTitle>Review Queue: Under-rated Wallets</SectionTitle>
          {reviewQueue.length === 0 ? <div style={{ color: "#8b949e", fontSize: 13 }}>No wallets need escalation.</div> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid #21262d" }}>{["Wallet", "Assigned → Behavior", "Score", "Why"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {reviewQueue.map(w => (
                  <tr key={w.id} style={{ borderBottom: "1px solid #161b22" }}>
                    <td style={{ ...td, color: "#4cc9f0", fontFamily: "monospace" }}>{w.id}</td>
                    <td style={td}><Badge label={w.assignedLevel} color={riskColor(w.assignedLevel)} /> → <Badge label={w.computedLevel} color={riskColor(w.computedLevel)} /></td>
                    <td style={{ ...td, fontFamily: "monospace", fontWeight: 700 }}>{w.score}</td>
                    <td style={{ ...td, color: "#8b949e", fontSize: 11 }}>
                      {w.factors.stolenLinks} stolen artworks · {eth(w.factors.totalValue)} moved · {w.factors.txCount} txns
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <SectionTitle>Assigned vs Behavioral Level</SectionTitle>
          <AgreementMatrix agreement={agreement} />
          <div style={{ marginTop: 16, fontSize: 11, color: "#8b949e", lineHeight: 1.7 }}>
            <div style={{ color: "#e6edf3", marginBottom: 4 }}>How the score works</div>
            Each factor is ranked as a percentile across all wallets, weighted, and summed to 0–100:
            {factors.map(f => <div key={f.key}>· {f.label} ({Math.round(f.weight * 100)}%): {f.describe}</div>)}
            Levels: {LEVELS.slice().reverse().map(l => `${l} ${levels[l]}`).join(" · ")}
          </div>
        </Card>
      </div>
    </>
  );
}
