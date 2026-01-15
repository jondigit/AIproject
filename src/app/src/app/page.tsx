"use client";

import { useMemo, useState } from "react";

type ScanResult = {
  business: { name: string; website: string; city: string; category: string };
  summary: { score: number; headline: string; notes: string[] };
  issues: { title: string; severity: "High" | "Medium" | "Low"; why: string; fix: string }[];
  seoFixes: { page: string; title: string; meta: string; h1: string; keywords: string[] }[];
  gmb: { actions: string[]; postDrafts: { title: string; body: string }[] };
  reviews: { responseTemplates: { rating: number; response: string }[] };
  monthly: { wins: string[]; nextSteps: string[] };
};

export default function Page() {
  const [name, setName] = useState("Austin Auto Repair");
  const [website, setWebsite] = useState("https://example.com");
  const [city, setCity] = useState("Austin, TX");
  const [category, setCategory] = useState("Auto Repair");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scoreColor = useMemo(() => {
    const s = result?.summary.score ?? 0;
    if (s >= 80) return "#16a34a";
    if (s >= 55) return "#f59e0b";
    return "#ef4444";
  }, [result]);

  async function runScan() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, website, city, category })
      });

      if (!res.ok) throw new Error("Scan failed. Try again.");
      const data = (await res.json()) as ScanResult;
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function downloadReport() {
    if (!result) return;

    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    });

    if (!res.ok) return alert("Report failed");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `LocalBoost-Report-${result.business.name.replaceAll(" ", "_")}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0f", color: "white" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              height: 44,
              width: 44,
              borderRadius: 16,
              background: "#1c1c26",
              display: "grid",
              placeItems: "center",
              fontSize: 18
            }}
          >
            ⚡
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>LocalBoost AI (Demo)</h1>
            <p style={{ margin: "6px 0 0", color: "#c7c7d1" }}>
              Mock AI + SEO automation to show how the product will look.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr", marginTop: 24 }}>
          <div style={card}>
            <h2 style={{ marginTop: 0 }}>Business Info</h2>
            <div style={{ display: "grid", gap: 10 }}>
              <Field label="Business name" value={name} onChange={setName} />
              <Field label="Website" value={website} onChange={setWebsite} />
              <Field label="City" value={city} onChange={setCity} />
              <Field label="Category" value={category} onChange={setCategory} />

              <button
                onClick={runScan}
                disabled={loading}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "none",
                  fontWeight: 700,
                  background: "white",
                  color: "#0b0b0f",
                  cursor: "pointer",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Running scan..." : "Run Scan"}
              </button>

              {error && <p style={{ color: "#fb7185", margin: 0 }}>{error}</p>}
            </div>
          </div>

          <div style={card}>
            <h2 style={{ marginTop: 0 }}>Results</h2>

            {!result ? (
              <p style={{ color: "#c7c7d1" }}>Run a scan to see recommendations.</p>
            ) : (
              <>
                <div style={{ ...card, background: "#12121a", borderColor: "#2a2a38" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{result.summary.headline}</div>
                      <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "#c7c7d1" }}>
                        {result.summary.notes.map((n, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            {n}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#c7c7d1", fontSize: 12 }}>Score</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: scoreColor }}>
                        {result.summary.score}/100
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={downloadReport} style={secondaryBtn}>
                    Download Monthly Report (PDF)
                  </button>
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
                  <Section title="Issues Found">
                    {result.issues.map((x, i) => (
                      <div key={i} style={miniCard}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 800 }}>{x.title}</div>
                          <span style={badge(x.severity)}>{x.severity}</span>
                        </div>
                        <div style={{ color: "#c7c7d1", marginTop: 6 }}>
                          <b style={{ color: "white" }}>Why:</b> {x.why}
                        </div>
                        <div style={{ color: "#c7c7d1", marginTop: 6 }}>
                          <b style={{ color: "white" }}>Fix:</b> {x.fix}
                        </div>
                      </div>
                    ))}
                  </Section>

                  <Section title="Recommended SEO Updates">
                    {result.seoFixes.map((x, i) => (
                      <div key={i} style={miniCard}>
                        <div style={{ color: "#c7c7d1", fontSize: 12 }}>{x.page}</div>
                        <div style={{ marginTop: 8 }}>
                          <b>Title:</b> <span style={{ color: "#c7c7d1" }}>{x.title}</span>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <b>Meta:</b> <span style={{ color: "#c7c7d1" }}>{x.meta}</span>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <b>H1:</b> <span style={{ color: "#c7c7d1" }}>{x.h1}</span>
                        </div>
                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {x.keywords.map((k, idx) => (
                            <span key={idx} style={pill}>
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </Section>
                </div>
              </>
            )}
          </div>
        </div>

        <p style={{ marginTop: 26, fontSize: 12, color: "#8a8aa0" }}>
          Demo note: This is 100% free and uses mock outputs. Next step is connecting real AI + SEO data.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "#c7c7d1", fontSize: 13 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "#0f0f16",
          border: "1px solid #2a2a38",
          color: "white",
          borderRadius: 12,
          padding: "12px 12px",
          outline: "none"
        }}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gap: 10 }}>{children}</div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#0f0f16",
  border: "1px solid #232332",
  borderRadius: 16,
  padding: 18
};

const miniCard: React.CSSProperties = {
  background: "#12121a",
  border: "1px solid #2a2a38",
  borderRadius: 14,
  padding: 14
};

const secondaryBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #2a2a38",
  background: "transparent",
  color: "white",
  cursor: "pointer"
};

const pill: React.CSSProperties = {
  fontSize: 12,
  color: "#e7e7ef",
  background: "#1c1c26",
  border: "1px solid #2a2a38",
  padding: "6px 10px",
  borderRadius: 999
};

function badge(severity: "High" | "Medium" | "Low"): React.CSSProperties {
  const base: React.CSSProperties = {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #2a2a38",
    color: "white"
  };
  if (severity === "High") return { ...base, borderColor: "#ef4444", color: "#fecaca" };
  if (severity === "Medium") return { ...base, borderColor: "#f59e0b", color: "#fde68a" };
  return { ...base, borderColor: "#22c55e", color: "#bbf7d0" };
}
