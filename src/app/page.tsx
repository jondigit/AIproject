"use client";

import { useMemo, useState } from "react";

type Severity = "High" | "Medium" | "Low";

type ScanResult = {
  business: { name: string; website: string; city: string; category: string };
  summary: { score: number; headline: string; notes: string[] };
  issues: { title: string; severity: Severity; why: string; fix: string }[];
  seoFixes: { page: string; title: string; meta: string; h1: string; keywords: string[] }[];
  gmb: { actions: string[]; postDrafts: { title: string; body: string }[] };
  reviews: { responseTemplates: { rating: number; response: string }[] };
  monthly: { wins: string[]; nextSteps: string[] };
};

export default function Home() {
  const [name, setName] = useState("Texas Roadhouse");
  const [website, setWebsite] = useState("https://www.texasroadhouse.com");
  const [city, setCity] = useState("Austin, TX");
  const [category, setCategory] = useState("Restaurant");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const score = result?.summary?.score ?? null;

  const scoreBand = useMemo(() => {
    if (score == null) return { label: "", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
    if (score >= 80) return { label: "Strong", color: "#16a34a", bg: "rgba(34,197,94,0.14)" };
    if (score >= 60) return { label: "Good", color: "#d97706", bg: "rgba(245,158,11,0.14)" };
    return { label: "Needs Attention", color: "#dc2626", bg: "rgba(239,68,68,0.12)" };
  }, [score]);

  async function runScan() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, website, city, category }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`Scan failed (${res.status}). ${text.slice(0, 200)}`);

      const data = JSON.parse(text) as ScanResult;
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function downloadReport() {
    if (!result) return;

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Report failed (${res.status}). ${t.slice(0, 200)}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `LocalBoost-Report-${(result.business.name || "Business").replaceAll(" ", "_")}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message ?? "PDF download failed");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <Topbar />

        <div style={styles.layout}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <div style={styles.panelTitle}>Client Details</div>
                <div style={styles.panelSub}>Run a scan to generate a structured action plan.</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              <Field label="Business Name" value={name} onChange={setName} placeholder="Example: Bright Smile Dental" />
              <Field label="Website" value={website} onChange={setWebsite} placeholder="https://..." />
              <Field label="City" value={city} onChange={setCity} placeholder="Austin, TX" />
              <Field label="Category" value={category} onChange={setCategory} placeholder="Dentist, Plumber, Restaurant..." />

              <button
                onClick={runScan}
                disabled={loading}
                style={{ ...styles.primary, opacity: loading ? 0.75 : 1 }}
              >
                {loading ? "Running Scan..." : "Run Scan"}
              </button>

              <button
                onClick={downloadReport}
                disabled={!result}
                style={{
                  ...styles.secondary,
                  opacity: result ? 1 : 0.55,
                  cursor: result ? "pointer" : "not-allowed",
                }}
              >
                Download Monthly Report (PDF)
              </button>

              {error && (
                <div style={styles.alert}>
                  <div style={styles.alertTitle}>Request failed</div>
                  <div style={styles.alertBody}>{error}</div>
                </div>
              )}

              <div style={styles.note}>
                This demo returns a simulated analysis. The production version will connect real crawling, local keyword
                data, and approval-based changes.
              </div>
            </div>
          </div>

          <div style={styles.main}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardTitle}>Overview</div>
                  <div style={styles.cardSub}>A concise summary with clear next actions.</div>
                </div>

                {result && score != null ? (
                  <div style={{ ...styles.scorePill, color: scoreBand.color, background: scoreBand.bg }}>
                    {score}/100 • {scoreBand.label}
                  </div>
                ) : (
                  <div style={styles.scorePillMuted}>No scan yet</div>
                )}
              </div>

              {!result ? (
                <div style={styles.empty}>
                  <div style={styles.emptyTitle}>Run a scan to generate results</div>
                  <div style={styles.emptySub}>
                    You will receive prioritized issues, copy-ready SEO updates, Google Business actions, and review
                    reply templates.
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.summaryGrid}>
                    <div style={styles.summaryCard}>
                      <div style={styles.kicker}>Business</div>
                      <div style={styles.bigText}>{result.business.name}</div>
                      <div style={styles.muted}>{result.business.city}</div>
                      <div style={styles.muted}>{result.business.category}</div>
                      <div style={{ marginTop: 10, ...styles.muted }}>{result.business.website}</div>
                    </div>

                    <div style={styles.summaryCard}>
                      <div style={styles.kicker}>Summary</div>
                      <div style={styles.bigText}>{result.summary.headline}</div>
                      <ul style={styles.list}>
                        {result.summary.notes.map((n, i) => (
                          <li key={i} style={styles.listItem}>
                            {n}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={styles.summaryCard}>
                      <div style={styles.kicker}>Next 30 Days</div>
                      <div style={styles.bigText}>Recommended focus</div>
                      <ol style={styles.list}>
                        {result.monthly.nextSteps.map((n, i) => (
                          <li key={i} style={styles.listItem}>
                            {n}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <Section title="Issues Found" subtitle="Prioritized by impact">
                    <div style={{ display: "grid", gap: 10 }}>
                      {result.issues.map((x, i) => (
                        <div key={i} style={styles.row}>
                          <div style={styles.rowTop}>
                            <div style={styles.rowTitle}>{x.title}</div>
                            <span style={badgeStyle(x.severity)}>{x.severity}</span>
                          </div>
                          <div style={styles.rowBody}>
                            <div>
                              <span style={styles.rowLabel}>Why:</span> {x.why}
                            </div>
                            <div style={{ marginTop: 6 }}>
                              <span style={styles.rowLabel}>Fix:</span> {x.fix}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="Recommended SEO Updates" subtitle="Copy-ready suggestions">
                    <div style={styles.twoCol}>
                      {result.seoFixes.map((x, i) => (
                        <div key={i} style={styles.row}>
                          <div style={styles.kicker}>{x.page}</div>

                          <div style={styles.kv}>
                            <div style={styles.k}>Title</div>
                            <div style={styles.v}>{x.title}</div>
                          </div>

                          <div style={styles.kv}>
                            <div style={styles.k}>Meta</div>
                            <div style={styles.v}>{x.meta}</div>
                          </div>

                          <div style={styles.kv}>
                            <div style={styles.k}>H1</div>
                            <div style={styles.v}>{x.h1}</div>
                          </div>

                          <div style={styles.tags}>
                            {x.keywords.map((kw, idx) => (
                              <span key={idx} style={styles.tag}>
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="Google Business Profile" subtitle="Local visibility actions">
                    <div style={styles.twoCol}>
                      <div style={styles.row}>
                        <div style={styles.rowTitle}>Checklist</div>
                        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                          {result.gmb.actions.map((a, i) => (
                            <div key={i} style={styles.check}>
                              <span style={styles.dot} />
                              <span>{a}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={styles.row}>
                        <div style={styles.rowTitle}>Post Drafts</div>
                        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                          {result.gmb.postDrafts.map((p, i) => (
                            <div key={i} style={styles.post}>
                              <div style={{ fontWeight: 800 }}>{p.title}</div>
                              <div style={{ marginTop: 6, color: "#475569", lineHeight: 1.5 }}>{p.body}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Section>

                  <Section title="Review Replies" subtitle="Templates for consistency">
                    <div style={styles.twoCol}>
                      {result.reviews.responseTemplates.map((t, i) => (
                        <div key={i} style={styles.row}>
                          <div style={styles.rowTop}>
                            <div style={styles.rowTitle}>{t.rating} Star Reply</div>
                            <span style={styles.smallPill}>Template</span>
                          </div>
                          <div style={{ marginTop: 10, color: "#334155", lineHeight: 1.6 }}>{t.response}</div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </>
              )}
            </div>

            <div style={styles.footer}>
              <span>LocalBoost AI • Demo</span>
              <span style={{ color: "#64748b" }}>Next: accounts, saved clients, approvals, billing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Topbar() {
  return (
    <div style={styles.topbar}>
      <div style={styles.brand}>
        <div style={styles.brandName}>LocalBoost AI</div>
        <div style={styles.brandSub}>Automation and SEO for local businesses</div>
      </div>
      <div style={styles.topbarRight}>
        <span style={styles.smallPill}>Client Portal</span>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={styles.label}>{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={styles.input} />
    </label>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitle}>{title}</div>
        {subtitle && <div style={styles.sectionSub}>{subtitle}</div>}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

function badgeStyle(sev: Severity): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid rgba(15,23,42,0.12)",
    background: "rgba(15,23,42,0.06)",
    color: "#0f172a",
    whiteSpace: "nowrap",
  };
  if (sev === "High") return { ...base, background: "rgba(220,38,38,0.08)", color: "#991b1b", borderColor: "rgba(220,38,38,0.18)" };
  if (sev === "Medium") return { ...base, background: "rgba(217,119,6,0.10)", color: "#92400e", borderColor: "rgba(217,119,6,0.20)" };
  return { ...base, background: "rgba(22,163,74,0.10)", color: "#166534", borderColor: "rgba(22,163,74,0.20)" };
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0b1220",
    color: "#0f172a",
  },
  shell: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 18,
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(148,163,184,0.18)",
    backdropFilter: "blur(10px)",
    color: "#e2e8f0",
  },
  brand: { display: "grid", gap: 2 },
  brandName: { fontWeight: 900, fontSize: 14, letterSpacing: 0.2 },
  brandSub: { fontSize: 12, color: "#94a3b8" },
  topbarRight: { display: "flex", alignItems: "center", gap: 10 },
  smallPill: {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(148,163,184,0.18)",
    color: "#e2e8f0",
    whiteSpace: "nowrap",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    gap: 14,
    marginTop: 14,
  },

  panel: {
    borderRadius: 14,
    padding: 16,
    background: "#0f172a",
    border: "1px solid rgba(148,163,184,0.18)",
    color: "#e2e8f0",
  },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  panelTitle: { fontWeight: 900, fontSize: 14 },
  panelSub: { fontSize: 12, color: "#94a3b8", marginTop: 4, lineHeight: 1.4 },

  label: { fontSize: 12, fontWeight: 800, color: "#cbd5e1" },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "#e2e8f0",
    outline: "none",
  },
  primary: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#ffffff",
    color: "#0b1220",
    fontWeight: 900,
    cursor: "pointer",
  },
  secondary: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "#e2e8f0",
    fontWeight: 900,
  },

  alert: {
    padding: 12,
    borderRadius: 12,
    background: "rgba(220,38,38,0.10)",
    border: "1px solid rgba(220,38,38,0.22)",
  },
  alertTitle: { fontWeight: 900, marginBottom: 6, color: "#fecaca" },
  alertBody: { color: "#fecaca", fontSize: 12, lineHeight: 1.5 },

  note: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 1.5,
  },

  main: { display: "grid", gap: 14 },
  card: {
    borderRadius: 14,
    padding: 16,
    background: "#f8fafc",
    border: "1px solid rgba(15,23,42,0.10)",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  cardTitle: { fontWeight: 900, fontSize: 14, color: "#0f172a" },
  cardSub: { fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.4 },

  scorePill: {
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    border: "1px solid rgba(15,23,42,0.10)",
    whiteSpace: "nowrap",
  },
  scorePillMuted: {
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    background: "rgba(15,23,42,0.06)",
    border: "1px solid rgba(15,23,42,0.10)",
    color: "#475569",
    whiteSpace: "nowrap",
  },

  empty: {
    marginTop: 14,
    borderRadius: 14,
    padding: 18,
    border: "1px dashed rgba(15,23,42,0.18)",
    background: "rgba(15,23,42,0.02)",
  },
  emptyTitle: { fontWeight: 900, color: "#0f172a" },
  emptySub: { marginTop: 8, color: "#64748b", lineHeight: 1.5, fontSize: 12 },

  summaryGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
  },
  summaryCard: {
    borderRadius: 14,
    padding: 14,
    border: "1px solid rgba(15,23,42,0.10)",
    background: "#ffffff",
  },
  kicker: { fontSize: 12, fontWeight: 900, color: "#64748b" },
  bigText: { marginTop: 6, fontWeight: 900, color: "#0f172a" },
  muted: { marginTop: 4, color: "#64748b", fontSize: 12 },

  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 },
  sectionTitle: { fontWeight: 900, fontSize: 13, color: "#0f172a" },
  sectionSub: { fontSize: 12, color: "#64748b" },

  row: {
    borderRadius: 14,
    padding: 14,
    border: "1px solid rgba(15,23,42,0.10)",
    background: "#ffffff",
  },
  rowTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  rowTitle: { fontWeight: 900, color: "#0f172a" },
  rowBody: { marginTop: 8, color: "#334155", fontSize: 12, lineHeight: 1.6 },
  rowLabel: { fontWeight: 900, color: "#0f172a" },

  kv: { marginTop: 10, display: "grid", gridTemplateColumns: "70px 1fr", gap: 10, alignItems: "baseline" },
  k: { fontSize: 12, fontWeight: 900, color: "#64748b" },
  v: { color: "#0f172a", fontSize: 12, lineHeight: 1.5 },

  tags: { marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 },
  tag: {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    background: "rgba(15,23,42,0.06)",
    border: "1px solid rgba(15,23,42,0.10)",
    color: "#0f172a",
  },

  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },

  check: { display: "flex", alignItems: "center", gap: 10, color: "#0f172a", fontSize: 12 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(22,163,74,0.9)",
    boxShadow: "0 0 0 4px rgba(22,163,74,0.16)",
  },

  post: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(15,23,42,0.10)",
    background: "rgba(15,23,42,0.02)",
  },

  list: { margin: "10px 0 0", paddingLeft: 18, color: "#334155", fontSize: 12, lineHeight: 1.6 },
  listItem: { marginBottom: 6 },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "0 2px",
    fontSize: 12,
    color: "#94a3b8",
  },
};
