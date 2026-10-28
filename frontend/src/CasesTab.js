import { useState } from "react";
import { Badge, SectionTitle, Card, Loader, useApi, postJson, statusColor, riskColor, th, td,
  Field, Input, TextArea, Select, Button, FormError } from "./ui";

const STATUSES = ["Open", "Under Investigation", "Resolved", "Closed"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const toOptions = values => values.map(v => ({ value: v, label: v }));
const date = d => (d ? new Date(d).toLocaleDateString() : "-");

// Holds a form's values and submits them, keeping the API's error to show under the form.
function useForm(initial, submit) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const bind = name => ({ value: values[name], onChange: e => setValues(v => ({ ...v, [name]: e.target.value })) });
  const onSubmit = async e => {
    e.preventDefault();
    setBusy(true);
    const { ok, data } = await submit(values);
    setBusy(false);
    if (ok) { setValues(initial); setError(null); } else setError(data);
  };
  return { bind, onSubmit, error, busy, values };
}

const Form = ({ onSubmit, children }) => (
  <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</form>
);

function NewReportForm({ options, onCreated }) {
  const form = useForm({ artworkId: "", platformId: "", description: "", stolenUrl: "" }, async values => {
    const result = await postJson("/api/reports", values);
    if (result.ok) onCreated(result.data.id);
    return result;
  });
  return (
    <Form onSubmit={form.onSubmit}>
      <Field label="Artwork">
        <Input list="artworks" placeholder="Type to search, e.g. AWK100" {...form.bind("artworkId")} />
        <datalist id="artworks">
          {options.artworks.map(a => <option key={a.id} value={a.id}>{a.title} by {a.artist}</option>)}
        </datalist>
      </Field>
      <Field label="Platform">
        <Select placeholder="Choose a platform" options={options.platforms.map(p => ({ value: p.id, label: p.name }))} {...form.bind("platformId")} />
      </Field>
      <Field label="What happened"><TextArea placeholder="e.g. Unauthorized copy minted and listed" {...form.bind("description")} /></Field>
      <Field label="Link to stolen NFT (optional)"><Input type="url" placeholder="https://" {...form.bind("stolenUrl")} /></Field>
      <FormError error={form.error} />
      <Button type="submit" disabled={form.busy}>FILE REPORT</Button>
    </Form>
  );
}

function InvestigateForm({ report, options, onChanged }) {
  const form = useForm({ priority: "Medium", leadInvestigatorId: "", notes: "" },
    async values => { const r = await postJson(`/api/reports/${report.id}/investigation`, values); if (r.ok) onChanged(); return r; });
  return (
    <Form onSubmit={form.onSubmit}>
      <Field label="Priority"><Select options={toOptions(PRIORITIES)} {...form.bind("priority")} /></Field>
      <Field label="Lead investigator">
        <Select placeholder="Least busy first" {...form.bind("leadInvestigatorId")}
          options={options.investigators.map(i => ({ value: i.id, label: `${i.name} · ${i.expertise} · ${i.activeCases} active` }))} />
      </Field>
      <Field label="Notes (optional)"><TextArea {...form.bind("notes")} /></Field>
      <FormError error={form.error} />
      <Button type="submit" disabled={form.busy}>OPEN INVESTIGATION</Button>
    </Form>
  );
}

function EvidenceForm({ report, options, onChanged }) {
  const form = useForm({ type: options.evidenceTypes[0], description: "", url: "" },
    async values => { const r = await postJson(`/api/reports/${report.id}/evidence`, values); if (r.ok) onChanged(); return r; });
  return (
    <Form onSubmit={form.onSubmit}>
      <Field label="Evidence type"><Select options={toOptions(options.evidenceTypes)} {...form.bind("type")} /></Field>
      <Field label="Description"><TextArea {...form.bind("description")} /></Field>
      <Field label="Link (optional)"><Input type="url" placeholder="https://" {...form.bind("url")} /></Field>
      <FormError error={form.error} />
      <Button type="submit" disabled={form.busy}>ADD EVIDENCE</Button>
    </Form>
  );
}

function ResolveForm({ report, options, onChanged }) {
  const form = useForm({ outcome: options.outcomes[0], actionTaken: "", notes: "" },
    async values => { const r = await postJson(`/api/reports/${report.id}/resolution`, values); if (r.ok) onChanged(); return r; });
  return (
    <Form onSubmit={form.onSubmit}>
      <Field label="Outcome"><Select options={toOptions(options.outcomes)} {...form.bind("outcome")} /></Field>
      <Field label="Action taken"><Input placeholder="e.g. Fake NFT removed" {...form.bind("actionTaken")} /></Field>
      <Field label="Notes (optional)"><TextArea {...form.bind("notes")} /></Field>
      <FormError error={form.error} />
      <Button type="submit" disabled={form.busy}>RESOLVE CASE</Button>
    </Form>
  );
}

const Row = ({ label, children }) => (
  <div style={{ display: "flex", gap: 12, fontSize: 12, padding: "6px 0", borderBottom: "1px solid #161b22" }}>
    <div style={{ width: 120, color: "#8b949e", flexShrink: 0 }}>{label}</div>
    <div style={{ color: "#e6edf3" }}>{children}</div>
  </div>
);

function ReportDetail({ reportId, options, onChanged }) {
  const { data: report, reload } = useApi(`/api/reports/${reportId}`);
  if (!report) return <Loader />;
  const inv = report.investigation;
  const changed = () => { reload(); onChanged(); };
  const active = inv && inv.status !== "Completed";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionTitle>Case {report.id}</SectionTitle>
          <Badge label={report.status} color={statusColor(report.status)} />
        </div>
        <Row label="Artwork">{report.artwork} ({report.artworkId}) by {report.artist}</Row>
        <Row label="Platform">{report.platform}</Row>
        <Row label="Reported">{date(report.reportedAt)}</Row>
        <Row label="Description">{report.description}</Row>
        {report.stolenUrl && <Row label="Stolen NFT"><a href={report.stolenUrl} target="_blank" rel="noreferrer" style={{ color: "#4cc9f0" }}>{report.stolenUrl}</a></Row>}
        {inv && <>
          <Row label="Investigation">{inv.id} · <Badge label={inv.status} color={statusColor(inv.status === "Completed" ? "Resolved" : "Under Investigation")} /> · <Badge label={inv.priority} color={riskColor(inv.priority)} /></Row>
          <Row label="Team">{inv.team.map(m => `${m.name} (${m.role})`).join(", ") || "-"}</Row>
          <Row label="Evidence">
            {inv.evidence.length === 0 ? "None yet" : inv.evidence.map(e => (
              <div key={e.id}>{e.id} · {e.type}{e.description ? ` · ${e.description}` : ""}</div>
            ))}
          </Row>
        </>}
        {report.resolution && <Row label="Resolution">
          {report.resolution.outcome} on {date(report.resolution.resolvedOn)} by {report.resolution.resolvedBy}
          {report.resolution.actionTaken ? ` · ${report.resolution.actionTaken}` : ""}
        </Row>}
      </Card>

      {report.status === "Open" && !inv && (
        <Card><SectionTitle>Open an Investigation</SectionTitle><InvestigateForm report={report} options={options} onChanged={changed} /></Card>
      )}
      {active && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          <Card><SectionTitle>Add Evidence</SectionTitle><EvidenceForm report={report} options={options} onChanged={changed} /></Card>
          <Card><SectionTitle>Resolve Case</SectionTitle><ResolveForm report={report} options={options} onChanged={changed} /></Card>
        </div>
      )}
    </div>
  );
}

export default function CasesTab({ onDataChanged = () => {} }) {
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const { data: options } = useApi("/api/options");
  const { data: reports, reload } = useApi(`/api/reports?limit=25${status ? `&status=${encodeURIComponent(status)}` : ""}`);
  const changed = () => { reload(); onDataChanged(); };

  if (!options) return <Loader />;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card>
          <SectionTitle>File a Theft Report</SectionTitle>
          <NewReportForm options={options} onCreated={id => { setStatus(""); setSelected(id); changed(); }} />
        </Card>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <SectionTitle>Recent Cases</SectionTitle>
            <div style={{ width: 170 }}><Select placeholder="All statuses" options={toOptions(STATUSES)} value={status} onChange={e => setStatus(e.target.value)} /></div>
          </div>
          {!reports ? <Loader /> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid #21262d" }}>{["Case", "Artwork", "Status"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} onClick={() => setSelected(r.id)}
                    style={{ borderBottom: "1px solid #161b22", cursor: "pointer", background: r.id === selected ? "#161b22" : "transparent" }}>
                    <td style={{ ...td, color: "#4cc9f0", fontFamily: "monospace" }}>{r.id}</td>
                    <td style={td}>{r.artwork}<div style={{ color: "#8b949e", fontSize: 11 }}>{r.platform} · {date(r.reportedAt)}</div></td>
                    <td style={td}><Badge label={r.status} color={statusColor(r.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
      {selected
        ? <ReportDetail key={selected} reportId={selected} options={options} onChanged={changed} />
        : <Card><div style={{ color: "#8b949e", fontSize: 13 }}>Select a case to see its details and move it forward, or file a new report.</div></Card>}
    </div>
  );
}
