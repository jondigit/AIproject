"use client";

import { useState } from "react";

export default function Home() {
  const [name, setName] = useState("Austin Auto Repair");
  const [website, setWebsite] = useState("https://example.com");
  const [city, setCity] = useState("Austin, TX");
  const [category, setCategory] = useState("Auto Repair");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function runScan() {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, website, city, category })
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <main style={{ padding: 32, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginTop: 0 }}>LocalBoost AI (Demo)</h1>

      <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <label>
          Business Name
          <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
        </label>

        <label>
          Website
          <input value={website} onChange={(e) => setWebsite(e.target.value)} style={input} />
        </label>

        <label>
          City
          <input value={city} onChange={(e) => setCity(e.target.value)} style={input} />
        </label>

        <label>
          Category
          <input value={category} onChange={(e) => setCategory(e.target.value)} style={input} />
        </label>

        <button onClick={runScan} disabled={loading} style={btn}>
          {loading ? "Running..." : "Run Scan"}
        </button>
      </div>

      {result && (
        <pre style={{ marginTop: 20, padding: 14, background: "#111", color: "#0f0", overflowX: "auto" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}

const input: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc"
};

const btn: React.CSSProperties = {
  marginTop: 10,
  padding: 12,
  borderRadius: 10,
  border: "none",
  background: "black",
  color: "white",
  fontWeight: 700,
  cursor: "pointer"
};
