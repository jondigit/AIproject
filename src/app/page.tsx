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
    if (score == null) return "No scan yet";
    if (score >= 80) return "Strong";
    if (score >= 60) return "Good";
    return "Needs work";
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

      setResult(JSON.parse(text) as ScanResult);
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
    <div style={s.page}>
      <div style={s.container}>
        <TopNav />

        <header style={s.hero}>
          <div>
            <div style={s.kicker}>Local SEO + operations assistant</div>
            <h1 style={s.h1}>LocalBoost</h1>
            <p style={s.sub}>
              Run a scan to generate a client-ready action plan: priority issues, copy-ready SEO updates,
              Google Business actions, review replies, and a downloadable monthly PDF report.
            </p>
          </div>

          <div style={s.heroRight}>
            <div style={s.heroCard}>
              <div style={s.heroCardLabel}>Overall Score</div>
              <div style={s.heroScore}>{score == null ? "—" : `${score}/100`}</div>
              <div style={s.heroScoreSub}>{scoreLabel}</div>
              <div style={s.heroHint}>Use the form below to run a scan.</div>
            </div>

            <div style={s.heroCard}>
              <div style={s.heroCardLabel}>What clients get</div>
              <ul style={s.cleanList}>
                <li>Prioritized issues and fixes</li>
                <li>SEO titles, meta descriptions, H1 suggestions</li>
                <li>Google Business checklist and post drafts</li>
                <li>Review reply templates</li>
                <li>Monthly PDF report</li>
              </ul>
            </div>
          </div>
        </header>

        <main style={s.grid}>
          <section style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <div style={s.cardTitle}>Run Scan</div>
                <div style={s.cardSub}>Enter business details and generate a report.</div>
              </div>
            </div>

            <div style={s.form}>
              <Field label="Business Name" value={name} onChange={setName} placeholder="Example: Bright Smile Dental" />
              <Field label="Website" value={website} onChange={setWebsite} placeholder="https://..." />
              <Field label="City" value={city} onChange={setCity} placeholder="Austin, TX" />
              <Field label="Category" value={category} onChange={setCategory} placeholder="Dentist, Plumber, Restaurant..." />

              <button onClick={runScan} disabled={loading} style={{ ...s.primaryBtn, opacity: loading ? 0.75 : 1 }}>
                {loading ? "Running…" : "Run Scan"}
              </button>

              <button
                onClick={downloadReport}
                disabled={!result}
                style={{ ...s.secondaryBtn, opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}
              >
                Download Monthly Report (PDF)
              </button>

              {error && (
                <div style={s.alert}>
                  <div style={s.alertTitle}>Request failed</div>
                  <div style={s.alertBody}>{error}</div>
                </div>
              )}

              <div style={s.note}>
                Demo note: this MVP currently returns simulated recommendations. The production version will connect real
                crawling and live local keyword data.
              </div>
            </div>
          </section>

          <section style={s.rightCol}>
            <div style={s.card}>
              <div style={s.cardHeaderRow}>
                <div>
                  <div style={s.cardTitle}>Results</div>
                  <div style={s.cardSub}>Clear, client-readable output.</div>
                </div>
                <div style={s.scoreChip}>
                  <div style={s.scoreChipTop}>Overall</div>
                  <div style={s.scoreChipVal}>{score == null ? "—" : `${score}/100`}</div>
                </div>
              </div>

              {!result ? (
                <Empty />
              ) : (
                <>
                  <div style={s.summaryRow}>
                    <Mini title="Business" value={result.business.name} />
                    <Mini title="Location" value={result.business.city} />
                    <Mini title="Category" value={result.business.category} />
                  </div>

                  <Section title="Executive Summary">
                    <div style={s.execBox}>
                      <div style={s.execHeadline}>{result.summary.headline}</div>
                      <ul style={s.notes}>
                        {result.summary.notes.map((n, i) => (
                          <li key={i} style={s.noteItem}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  </Section>

                  <Section title="Issues Found" subtitle="Prioritized by impact">
                    <div style={{ display: "grid", gap: 12 }}>
                      {result.issues.map((x, i) => (
                        <div key={i} style={s.row}>
                          <div style={s.rowTop}>
                            <div style={s.rowTitle}>{x.title}</div>
                            <span style={severityBadge(x.severity)}>{x.severity}</span>
                          </div>
                          <div style={s.rowText}><b>Why:</b> {x.why}</div>
                          <div style={s.rowText}><b>Fix:</b> {x.fix}</div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="SEO Updates" subtitle="Copy-ready suggestions">
                    <div style={s.twoCol}>
                      {result.seoFixes.map((x, i) => (
                        <div key={i} style={s.row}>
                          <div style={s.smallKicker}>{x.page}</div>
                          <KV k="Title" v={x.title} />
                          <KV k="Meta" v={x.meta} />
                          <KV k="H1" v={x.h1} />
                          <div style={s.tags}>
                            {x.keywords.map((kw, idx) => (
                              <span key={idx} style={s.tag}>{kw}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="Google Business Profile" subtitle="Local visibility actions">
                    <div style={s.twoCol}>
                      <div style={s.row}>
                        <div style={s.rowTitle}>Checklist</div>
                        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                          {result.gmb.actions.map((a, i) => (
                            <div key={i} style={s.checkRow}>
                              <span style={s.dot} />
                              <span style={s.checkText}>{a}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={s.row}>
                        <div style={s.rowTitle}>Post Drafts</div>
                        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                          {result.gmb.postDrafts.map((p, i) => (
                            <div key={i} style={s.post}>
                              <div style={s.postTitle}>{p.title}</div>
                              <div style={s.postBody}>{p.body}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Section>

                  <Section title="Review Replies" subtitle="Templates for consistency">
                    <div style={s.twoCol}>
                      {result.reviews.responseTemplates.map((t, i) => (
                        <div key={i} style={s.row}>
                          <div style={s.rowTop}>
                            <div style={s.rowTitle}>{t.rating} Star Reply</div>
                            <span style={s.pill}>Template</span>
                          </div>
                          <div style={s.reply}>{t.response}</div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="30-Day Plan" subtitle="Next actions">
                    <div style={s.twoCol}>
                      <div style={s.row}>
                        <div style={s.rowTitle}>Wins</div>
                        <ul style={s.cleanListDark}>
                          {result.monthly.wins.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                      <div style={s.row}>
                        <div style={s.rowTitle}>Next Steps</div>
                        <ol style={s.cleanListDark}>
                          {result.monthly.nextSteps.map((n, i) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </Section>
                </>
              )}
            </div>

            <div style={s.about}>
              <div style={s.aboutHeader}>
                <div style={s.aboutTitle}>About</div>
                <div style={s.aboutSub}>
                  LocalBoost is designed for traditional local businesses that want more customers without adding
                  marketing headcount. The goal is to automate the repetitive work while keeping owners in control.
                </div>
              </div>

              <div style={s.aboutGrid}>
                <AboutBlock
                  title="Who it is for"
                  text="Service businesses, restaurants, clinics, and local operators who want more calls, bookings, and walk-ins."
                />
                <AboutBlock
                  title="What it does"
                  text="Generates an action plan with SEO updates, Google Business steps, and review response templates. Exports a PDF report."
                />
                <AboutBlock
                  title="How it makes money"
                  text="Subscription pricing tiers (reporting, growth, and automation). Add-ons: setup, review management, landing pages."
                />
                <AboutBlock
                  title="What is next"
                  text="Saved clients, scan history, real crawling, live keyword feeds, approvals, multi-user access, billing."
                />
              </div>
            </div>

            <div style={s.footer}>
              <span>LocalBoost</span>
              <span style={{ color: "#6b7280" }}>White background, black/gray palette</span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

/* ---------- UI ---------- */

function TopNav() {
  return (
    <div style={s.nav}>
      <div style={s.navBrand}>LocalBoost</div>
      <div style={s.navRight}>
        <span style={s.navTag}>Client Portal</span>
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
    <label style={s.field}>
      <span style={s.label}>{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={s.input} />
    </label>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={s.sectionHeader}>
        <div style={s.sectionTitle}>{title}</div>
        {subtitle && <div style={s.sectionSub}>{subtitle}</div>}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

function Empty() {
  return (
    <div style={s.empty}>
      <div style={s.emptyTitle}>No results yet</div>
      <div style={s.emptyText}>
        Enter details and run a scan to generate a client-ready report with clear next steps.
      </div>
    </div>
  );
}

function Mini({ title, value }: { title: string; value: string }) {
  return (
    <div style={s.mini}>
      <div style={s.miniTitle}>{title}</div>
      <div style={s.miniVal}>{value}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div style={s.kv}>
      <div style={s.k}>{k}</div>
      <div style={s.v}>{v}</div>
    </div>
  );
}

function AboutBlock({ title, text }: { title: string; text: string }) {
  return (
    <div style={s.aboutBlock}>
      <div style={s.aboutBlockTitle}>{title}</div>
      <div style={s.aboutBlockText}>{text}</div>
    </div>
  );
}

function severityBadge(sev: Severity): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 650,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(0,0,0,0.02)",
    color: "#111827",
  };
  if (sev === "High") return { ...base, background: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.14)" };
  if (sev === "Medium") return { ...base, background: "rgba(0,0,0,0.03)", borderColor: "rgba(0,0,0,0.12)" };
  return base;
}

/* ---------- Styles (pure white, black/gray) ---------- */

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#111827",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial',
  },
  container: { maxWidth: 1180, margin: "0 auto", padding: 22 },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  navBrand: { fontSize: 14, fontWeight: 750, letterSpacing: 0.2 },
  navRight: { display: "flex", gap: 10, alignItems: "center" },
  navTag: {
    fontSize: 12,
    fontWeight: 650,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#ffffff",
  },

  hero: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 18,
    padding: "22px 0 10px",
  },
  kicker: { fontSize: 12, color: "#6b7280", fontWeight: 650, letterSpacing: 0.2 },
  h1: { margin: "8px 0 0", fontSize: 44, lineHeight: 1.06, fontWeight: 780, letterSpacing: -0.8 },
  sub: { marginTop: 12, color: "#374151", fontSize: 14, lineHeight: 1.65, maxWidth: 680 },

  heroRight: { display: "grid", gap: 12 },
  heroCard: {
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#ffffff",
    padding: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  heroCardLabel: { fontSize: 12, color: "#6b7280", fontWeight: 650 },
  heroScore: { fontSize: 28, fontWeight: 780, marginTop: 6, letterSpacing: -0.4 },
  heroScoreSub: { marginTop: 8, fontSize: 12, color: "#374151", fontWeight: 650 },
  heroHint: { marginTop: 10, fontSize: 12, color: "#6b7280", lineHeight: 1.5 },
  cleanList: { margin: "10px 0 0", paddingLeft: 18, color: "#374151", fontSize: 12, lineHeight: 1.75 },

  grid: { display: "grid", gridTemplateColumns: "380px 1fr", gap: 18, paddingTop: 16, alignItems: "start" },

  card: {
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#ffffff",
    padding: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  cardHeader: {},
  cardHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  cardTitle: { fontSize: 13, fontWeight: 750 },
  cardSub: { marginTop: 6, fontSize: 12, color: "#6b7280", lineHeight: 1.55 },

  form: { display: "grid", gap: 12, marginTop: 14 },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 12, fontWeight: 650, color: "#374151" },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#ffffff",
    outline: "none",
    color: "#111827",
  },

  primaryBtn: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#111827",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 700,
  },

  alert: {
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(0,0,0,0.02)",
    padding: 12,
  },
  alertTitle: { fontSize: 12, fontWeight: 750, color: "#111827" },
  alertBody: { marginTop: 6, fontSize: 12, color: "#374151", lineHeight: 1.5 },

  note: {
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.06)",
    background: "rgba(0,0,0,0.02)",
    padding: 12,
    fontSize: 12,
    color: "#374151",
    lineHeight: 1.55,
  },

  rightCol: { display: "grid", gap: 14 },

  scoreChip: {
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    padding: "10px 12px",
    minWidth: 110,
    textAlign: "right",
    background: "rgba(0,0,0,0.02)",
  },
  scoreChipTop: { fontSize: 11, color: "#6b7280", fontWeight: 650 },
  scoreChipVal: { fontSize: 16, fontWeight: 780, marginTop: 4 },

  empty: {
    marginTop: 14,
    borderRadius: 16,
    border: "1px dashed rgba(0,0,0,0.14)",
    background: "rgba(0,0,0,0.02)",
    padding: 18,
  },
  emptyTitle: { fontWeight: 750, fontSize: 13 },
  emptyText: { marginTop: 8, fontSize: 12, color: "#6b7280", lineHeight: 1.6 },

  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: 750 },
  sectionSub: { fontSize: 12, color: "#6b7280" },

  summaryRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 },
  mini: {
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#ffffff",
    padding: 14,
  },
  miniTitle: { fontSize: 12, color: "#6b7280", fontWeight: 650 },
  miniVal: { marginTop: 8, fontSize: 13, fontWeight: 750, lineHeight: 1.35 },

  execBox: {
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(0,0,0,0.02)",
    padding: 14,
  },
  execHeadline: { fontSize: 13, fontWeight: 780, lineHeight: 1.35 },
  notes: { margin: "10px 0 0", paddingLeft: 18, color: "#374151", fontSize: 12, lineHeight: 1.75 },
  noteItem: { marginBottom: 6 },

  row: {
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#ffffff",
    padding: 14,
  },
  rowTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  rowTitle: { fontWeight: 750, fontSize: 13 },
  rowText: { marginTop: 8, fontSize: 12, color: "#374151", lineHeight: 1.65 },

  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  smallKicker: { fontSize: 12, fontWeight: 650, color: "#6b7280" },
  kv: { marginTop: 10, display: "grid", gridTemplateColumns: "60px 1fr", gap: 10, alignItems: "baseline" },
  k: { fontSize: 12, fontWeight: 750, color: "#6b7280" },
  v: { fontSize: 12, color: "#111827", lineHeight: 1.55 },
  tags: { marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" },
  tag: {
    fontSize: 12,
    fontWeight: 650,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(0,0,0,0.02)",
    color: "#111827",
  },

  checkRow: { display: "flex", gap: 10, alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 999, background: "#111827" },
  checkText: { fontSize: 12, color: "#111827" },

  post: {
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(0,0,0,0.02)",
    padding: 12,
  },
  postTitle: { fontSize: 12, fontWeight: 750, color: "#111827" },
  postBody: { marginTop: 6, fontSize: 12, color: "#374151", lineHeight: 1.65 },

  pill: {
    fontSize: 12,
    fontWeight: 650,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(0,0,0,0.02)",
  },
  reply: { marginTop: 10, fontSize: 12, color: "#374151", lineHeight: 1.75 },

  cleanListDark: { margin: "10px 0 0", paddingLeft: 18, color: "#374151", fontSize: 12, lineHeight: 1.75 },

  about: {
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#ffffff",
    padding: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  aboutHeader: { display: "grid", gap: 6 },
  aboutTitle: { fontSize: 13, fontWeight: 750 },
  aboutSub: { fontSize: 12, color: "#6b7280", lineHeight: 1.6, maxWidth: 900 },
  aboutGrid: { marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  aboutBlock: {
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(0,0,0,0.02)",
    padding: 14,
  },
  aboutBlockTitle: { fontSize: 12, fontWeight: 750, color: "#111827" },
  aboutBlockText: { marginTop: 8, fontSize: 12, color: "#374151", lineHeight: 1.75 },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "8px 2px",
    fontSize: 12,
    color: "#9ca3af",
  },
};
