import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Badge, StatCard, SectionTitle, Card, Loader, CustomTooltip, useApi, th, td } from "./ui";

const CATEGORIES = ["Referential integrity", "Completeness", "Validity", "Consistency"];

export default function DataQualityTab() {
  const { data, error } = useApi("/api/data-quality");

  if (error) return <Card><div style={{ color: "#ff4d6d", fontSize: 13 }}>Could not run data-quality checks ({error}).</div></Card>;
  if (!data) return <Loader />;

  const { summary, results, checkedAt } = data;
  const byCategory = CATEGORIES.map(category => {
    const checks = results.filter(r => r.category === category);
    const passed = checks.filter(r => r.passed).length;
    return { category, passed, total: checks.length, rate: checks.length ? Math.round((passed / checks.length) * 100) : 100 };
  });
  // Failures first, then by category, so problems are at the top of the table.
  const sorted = [...results].sort((a, b) => a.passed - b.passed || CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category));
  const scoreColor = summary.score >= 90 ? "#52b788" : summary.score >= 70 ? "#f4a261" : "#ff4d6d";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard icon="🧪" label="Quality Score" value={`${summary.score}%`} sub="Share of checks passing" accent={scoreColor} />
        <StatCard icon="✅" label="Checks Passed" value={summary.passed} sub={`of ${summary.checks} automated checks`} accent="#52b788" />
        <StatCard icon="❌" label="Checks Failed" value={summary.failed} sub="Need a data fix" accent="#ff4d6d" />
        <StatCard icon="🔗" label="Foreign Keys Checked" value={results.filter(r => r.category === "Referential integrity").length} sub="Discovered from the schema" accent="#4cc9f0" />
      </div>

      <Card>
        <SectionTitle>Pass Rate by Category</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byCategory} layout="vertical" barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
            <YAxis type="category" dataKey="category" tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} width={150} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="rate" name="Pass rate %" radius={[0, 4, 4, 0]}>
              {byCategory.map((c, i) => <Cell key={i} fill={c.rate === 100 ? "#52b788" : c.rate >= 70 ? "#f4a261" : "#ff4d6d"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle>All Checks</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #21262d" }}>
              {["Status", "Category", "Rule", "Table", "Failing Rows"].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.id} style={{ borderBottom: "1px solid #161b22" }}>
                <td style={td}><Badge label={r.passed ? "PASS" : "FAIL"} color={r.passed ? "#52b788" : "#ff4d6d"} /></td>
                <td style={{ ...td, color: "#8b949e" }}>{r.category}</td>
                <td style={td}>{r.rule}</td>
                <td style={{ ...td, color: "#4cc9f0", fontFamily: "monospace" }}>{r.table}</td>
                <td style={{ ...td, fontFamily: "monospace", color: r.passed ? "#8b949e" : "#ff4d6d", fontWeight: 700 }}>
                  {r.failingRows} / {r.totalRows}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14, fontSize: 11, color: "#8b949e" }}>Last checked {new Date(checkedAt).toLocaleString()}</div>
      </Card>
    </div>
  );
}
