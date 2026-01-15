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

  const scoreLabel = useMemo(() => {
    if (score == null) return "";
    if (score >= 80) return "Strong";
    if (score >= 60) return "Decent — easy wins";
    return "Needs attention";
  }, [score]);

  const scoreColor = useMemo(() => {
    if (score == null) return "#9CA3AF";
    if (score >= 80) return "#22C55E";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
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
    <div style={styles.bg}>
      <div style={styles.wrap}>
        <Header />

        <div style={styles.grid}>
          {/* LEFT: INPUTS */}
          <div style={styles.card}>
            <div style={styles.cardTop}>
              <div>
                <div style={styles.cardTitle}>Business Info</div>
                <div style={styles.cardSub}>Enter client details, then run the scan.</div>
              </div>
              <span style={styles.pill}>MVP Demo</span>
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              <Field label="Business Name" value={name} onChange={setName} placeholder="e.g., Bright Smile Dental" />
              <Field label="Website" value={website} onChange={setWebsite} placeholder="https://..." />
              <Field label="City" value={city} onChange={setCity} placeholder="Austin, TX" />
              <Field label="Category" value={category} onChange={setCategory} placeholder="Plumber, Dentist, Restaurant..." />

              <button onClick={runScan} disabled={loading} style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <Spinner /> Scanning...
                  </span>
                ) : (
                  "Run Scan"
                )}
              </button>

              <button
                onClick={downloadReport}
                disabled={!result}
                style={{
                  ...styles.secondaryBtn,
                  opacity: result ? 1 : 0.5,
                  cursor: result ? "pointer" : "not-allowed",
                }}
              >
                Download Monthly Report (PDF)
              </button>

              {error && (
                <div style={styles.alert}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Something went wrong</div>
                  <div style={{ color: "#fecaca" }}>{error}</div>
                </div>
              )}

              <div style={styles.tip}>
                <b>Demo note:</b> Right now this returns a simulated analysis. Next step is connecting real crawling + keyword data.
              </div>
            </div>
          </div>

          {/* RIGHT: RESULTS */}
          <div style={styles.stack}>
            <div style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <div style={styles.cardTitle}>Scan Results</div>
                  <div style={styles.cardSub}>Client-ready summary with actionable next steps.</div>
                </div>
              </div>

              {!result ? (
                <EmptyState />
              ) : (
                <>
                  <div style={styles.scoreRow}>
                    <div style={styles.scoreCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
                        <div>
                          <div style={{ color: "#cbd5e1", fontSize: 12 }}>Overall Score</div>
                          <div style={{ fontSize: 30, fontWeight: 900, marginTop: 4, color: scoreColor }}>
                            {result.summary.score}/100
                          </div>
                          <div style={{ color: "#e5e7eb", fontWeight: 800, marginTop: 4 }}>{scoreLabel}</div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: "#cbd5e1", fontSize: 12 }}>Business</div>
                          <div style={{ fontWeight: 900 }}>{result.business.name}</div>
                          <div style={{ color: "#cbd5e1" }}>{result.business.city}</div>
                          <div style={{ color: "#cbd5e1" }}>{result.business.category}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontWeight: 900 }}>{result.summary.headline}</div>
                        <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#cbd5e1" }}>
                          {result.summary.notes.map((n, i) => (
                            <li key={i} style={{ marginBottom: 6 }}>
                              {n}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div style={styles.quickActions}>
                      <div style={styles.quickTitle}>Quick Actions</div>
                      <div style={styles.quickList}>
                        <QuickItem title="Fix Titles & H1s" desc="Big ranking impact in local search." />
                        <QuickItem title="Weekly Google Posts" desc="Improves map visibility and calls." />
                        <QuickItem title="Review Response Templates" desc="Build trust and conversion." />
                      </div>
                    </div>
                  </div>

                  <Section title="Issues Found" subtitle="Prioritized by impact">
                    <div style={{ display: "grid", gap: 10 }}>
                      {result.issues.map((x, i) => (
                        <div key={i} style={styles.rowCard}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <div style={{ fontWeight: 900 }}>{x.title}</div>
                            <span style={severityStyle(x.severity)}>{x.severity}</span>
                          </div>
                          <div style={{ marginTop: 8, color: "#cbd5e1" }}>
                            <b style={{ color: "#e5e7eb" }}>Why:</b> {x.why}
                          </div>
                          <div style={{ marginTop: 6, color: "#cbd5e1" }}>
                            <b style={{ color: "#e5e7eb" }}>Fix:</b> {x.fix}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="Recommended SEO Updates" subtitle="Copy/paste suggestions">
                    <div style={styles.twoCol}>
                      {result.seoFixes.map((x, i) => (
                        <div key={i} style={styles.rowCard}>
                          <div style={{ color: "#cbd5e1", fontSize: 12 }}>{x.page}</div>
                          <div style={{ marginTop: 10 }}>
                            <div style={styles.kv}>
                              <span style={styles.k}>Title</span>
                              <span style={styles.v}>{x.title}</span>
                            </div>
                            <div style={styles.kv}>
                              <span style={styles.k}>Meta</span>
                              <span style={styles.v}>{x.meta}</span>
                            </div>
                            <div style={styles.kv}>
                              <span style={styles.k}>H1</span>
                              <span style={styles.v}>{x.h1}</span>
                            </div>
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                            {x.keywords.map((kw, idx) => (
                              <span key={idx} style={styles.chip}>
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="Google Business Profile" subtitle="Map pack improvements">
                    <div style={styles.twoCol}>
                      <div style={styles.rowCard}>
                        <div style={{ fontWeight: 900, marginBottom: 10 }}>Checklist</div>
                        <div style={{ display: "grid", gap: 8 }}>
                          {result.gmb.actions.map((a, i) => (
                            <div key={i} style={styles.checkRow}>
                              <span style={styles.checkDot} />
                              <span style={{ color: "#e5e7eb" }}>{a}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={styles.rowCard}>
                        <div style={{ fontWeight: 900, marginBottom: 10 }}>Post Drafts</div>
                        <div style={{ display: "grid", gap: 10 }}>
                          {result.gmb.postDrafts.map((p, i) => (
                            <div key={i} style={styles.postCard}>
                              <div style={{ fontWeight: 900 }}>{p.title}</div>
                              <div style={{ color: "#cbd5e1", marginTop: 6 }}>{p.body}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Section>

                  <Section title="Review Replies" subtitle="Templates you can reuse">
                    <div style={styles.twoCol}>
                      {result.reviews.responseTemplates.map((t, i) => (
                        <div key={i} style={styles.rowCard}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontWeight: 900 }}>{t.rating}★ Reply</div>
                            <span style={styles.pillMuted}>Copy</span>
                          </div>
                          <div style={{ color: "#cbd5e1", marginTop: 10, lineHeight: 1.5 }}>{t.response}</div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="30-Day Plan" subtitle="What we’ll do this month">
                    <div style={styles.twoCol}>
                      <div style={styles.rowCard}>
                        <div style={{ fontWeight: 900, marginBottom: 10 }}>Wins</div>
                        <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
                          {result.monthly.wins.map((w, i) => (
                            <li key={i} style={{ marginBottom: 6 }}>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div style={styles.rowCard}>
                        <div style={{ fontWeight: 900, marginBottom: 10 }}>Next Steps</div>
                        <ol style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
                          {result.monthly.nextSteps.map((n, i) => (
                            <li key={i} style={{ marginBottom: 6 }}>
                              {n}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </Section>
                </>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

/* ---------------- UI Components ---------------- */

function Header() {
  return (
    <div style={styles.header}>
      <div style={styles.brand}>
        <div style={styles.logo}>⚡</div>
        <div>
          <div style={styles.hTitle}>LocalBoost AI</div>
          <div style={styles.hSub}>AI-driven automation + SEO for traditional local businesses</div>
        </div>
      </div>
      <div style={styles.headerRight}>
        <span style={styles.pillMuted}>Client Portal Preview</span>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div style={styles.footer}>
      <span>© {new Date().getFullYear()} LocalBoost AI</span>
      <span style={{ color: "#94a3b8" }}>Demo build • Next: real crawling + Stripe + client accounts</span>
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
      <span style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700 }}>{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />
    </label>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ fontWeight: 1000, fontSize: 15 }}>{title}</div>
        {subtitle && <div style={{ color: "#94a3b8", fontSize: 12 }}>{subtitle}</div>}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={styles.empty}>
      <div style={{ fontSize: 18, fontWeight: 1000 }}>Run a scan to generate a client report</div>
      <div style={{ color: "#94a3b8", marginTop: 8, lineHeight: 1.5 }}>
        You’ll get a score, priority issues, SEO copy/paste fixes, Google Business actions, and review reply templates.
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span style={styles.chip}>Local SEO</span>
        <span style={styles.chip}>Google Maps</span>
        <span style={styles.chip}>Admin Automation (next)</span>
      </div>
    </div>
  );
}

function QuickItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={styles.quickItem}>
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{desc}</div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: 999,
        border: "2px solid rgba(0,0,0,0.25)",
        borderTop: "2px solid rgba(0,0,0,0.9)",
        display: "inline-block",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

function severityStyle(sev: Severity): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(15,23,42,0.35)",
  };
  if (sev === "High") return { ...base, color: "#fecaca", borderColor: "rgba(239,68,68,0.45)" };
  if (sev === "Medium") return { ...base, color: "#fde68a", borderColor: "rgba(245,158,11,0.45)" };
  return { ...base, color: "#bbf7d0", borderColor: "rgba(34,197,94,0.45)" };
}

/* ---------------- Styles ---------------- */

const styles: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: "100vh",
    background: "radial-gradient(1200px 900px at 10% 0%, rgba(99,102,241,0.20), transparent 55%), #070A12",
    color: "#e5e7eb",
  },
  wrap: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: 22,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: "14px 14px",
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(15, 23, 42, 0.35)",
    backdropFilter: "blur(10px)",
  },
  brand: { display: "flex", gap: 12, alignItems: "center" },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(99,102,241,0.20)",
    border: "1px solid rgba(99,102,241,0.30)",
    fontSize: 18,
  },
  hTitle: { fontWeight: 1000, fontSize: 16, letterSpacing: 0.2 },
  hSub: { color: "#94a3b8", marginTop: 2, fontSize: 12 },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  grid: {
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    gap: 14,
    marginTop: 14,
  },
  stack: { display: "grid", gap: 14 },
  card: {
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(15, 23, 42, 0.35)",
    backdropFilter: "blur(10px)",
    padding: 16,
  },
  cardTop: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  cardTitle: { fontWeight: 1000, fontSize: 14 },
  cardSub: { color: "#94a3b8", fontSize: 12, marginTop: 4, lineHeight: 1.4 },
  pill: {
    fontSize: 12,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    color: "#e5e7eb",
    border: "1px solid rgba(99,102,241,0.35)",
    background: "rgba(99,102,241,0.16)",
    whiteSpace: "nowrap",
  },
  pillMuted: {
    fontSize: 12,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    color: "#cbd5e1",
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2, 6, 23, 0.25)",
    whiteSpace: "nowrap",
  },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2, 6, 23, 0.35)",
    color: "#e5e7eb",
    outline: "none",
  },
  primaryBtn: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "#ffffff",
    color: "#0b1220",
    fontWeight: 1000,
    cursor: "pointer",
  },
  secondaryBtn: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2, 6, 23, 0.35)",
    color: "#e5e7eb",
    fontWeight: 900,
  },
  alert: {
    marginTop: 6,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(239,68,68,0.30)",
    background: "rgba(239,68,68,0.10)",
  },
  tip: {
    marginTop: 4,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(2, 6, 23, 0.25)",
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 1.5,
  },
  empty: {
    marginTop: 10,
    padding: 18,
    borderRadius: 16,
    border: "1px dashed rgba(148,163,184,0.25)",
    background: "rgba(2, 6, 23, 0.18)",
  },
  scoreRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 12,
    marginTop: 12,
  },
  scoreCard: {
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(2, 6, 23, 0.25)",
    padding: 14,
  },
  quickActions: {
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(2, 6, 23, 0.25)",
    padding: 14,
  },
  quickTitle: { fontWeight: 1000, marginBottom: 10 },
  quickList: { display: "grid", gap: 10 },
  quickItem: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(15, 23, 42, 0.30)",
  },
  rowCard: {
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(2, 6, 23, 0.25)",
    padding: 14,
  },
  kv: {
    display: "grid",
    gridTemplateColumns: "90px 1fr",
    gap: 10,
    alignItems: "baseline",
    marginTop: 10,
  },
  k: { color: "#94a3b8", fontSize: 12, fontWeight: 900 },
  v: { color: "#e5e7eb", lineHeight: 1.4 },
  chip: {
    fontSize: 12,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    color: "#e5e7eb",
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(15, 23, 42, 0.35)",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  checkRow: { display: "flex", alignItems: "center", gap: 10 },
  checkDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(34,197,94,0.90)",
    boxShadow: "0 0 0 4px rgba(34,197,94,0.12)",
    flexShrink: 0,
  },
  postCard: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(15, 23, 42, 0.30)",
  },
  footer: {
    marginTop: 16,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: "#64748b",
    fontSize: 12,
    padding: "10px 2px",
  },
};
