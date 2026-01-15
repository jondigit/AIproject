export const runtime = "nodejs";

function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]) {
  // Basic one-page PDF using built-in Helvetica (no external libs).
  const safeLines = lines.map((l) => escapePdfText(String(l ?? "")));

  const contentParts: string[] = [];
  contentParts.push("BT");
  contentParts.push("/F1 12 Tf");
  contentParts.push("14 TL"); // line spacing
  contentParts.push("72 740 Td"); // start position

  for (const line of safeLines) {
    contentParts.push(`(${line}) Tj`);
    contentParts.push("T*");
  }

  contentParts.push("ET");

  const contentStream = contentParts.join("\n") + "\n";
  const contentLength = Buffer.byteLength(contentStream, "utf8");

  const objects: string[] = [];

  // 1: Catalog
  objects.push(`1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
`);

  // 2: Pages
  objects.push(`2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
`);

  // 3: Page
  objects.push(`3 0 obj
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 612 792]
   /Contents 4 0 R
   /Resources << /Font << /F1 5 0 R >> >>
>>
endobj
`);

  // 4: Contents
  objects.push(`4 0 obj
<< /Length ${contentLength} >>
stream
${contentStream}endstream
endobj
`);

  // 5: Font
  objects.push(`5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
`);

  // Build PDF with xref offsets
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0]; // xref requires object 0

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += "xref\n";
  pdf += `0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= objects.length; i++) {
    const off = offsets[i];
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefStart}
%%EOF
`;

  return Buffer.from(pdf, "utf8");
}

export async function POST(req: Request) {
  const data = await req.json().catch(() => ({}));

  const b = data?.business ?? {};
  const s = data?.summary ?? {};
  const issues = Array.isArray(data?.issues) ? data.issues : [];
  const wins = Array.isArray(data?.monthly?.wins) ? data.monthly.wins : [];
  const nextSteps = Array.isArray(data?.monthly?.nextSteps) ? data.monthly.nextSteps : [];

  const name = String(b?.name ?? "LocalBoost Client");
  const city = String(b?.city ?? "");
  const website = String(b?.website ?? "");
  const category = String(b?.category ?? "");
  const score = String(s?.score ?? "");
  const headline = String(s?.headline ?? "Monthly Summary");

  const lines: string[] = [
    "LocalBoost Monthly Report",
    "------------------------",
    `Business: ${name}`,
    `Category: ${category}`,
    `City: ${city}`,
    `Website: ${website}`,
    "",
    `Score: ${score}/100`,
    `Summary: ${headline}`,
    "",
    "Top Issues:",
    ...issues.slice(0, 6).flatMap((x: any, i: number) => {
      const title = String(x?.title ?? `Issue ${i + 1}`);
      const severity = String(x?.severity ?? "Medium");
      const why = String(x?.why ?? "");
      const fix = String(x?.fix ?? "");
      return [
        `${i + 1}. ${title} (${severity})`,
        `   Why: ${why}`,
        `   Fix: ${fix}`,
        ""
      ];
    }),
    "Wins This Month:",
    ...(wins.length ? wins.map((w: string) => `- ${w}`) : ["- (none yet)"]),
    "",
    "Next Steps:",
    ...(nextSteps.length ? nextSteps.map((n: string) => `- ${n}`) : ["- (none yet)"])
  ];

  const pdfBuffer = buildSimplePdf(lines);

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="LocalBoost-Report-${name.replaceAll(" ", "_")}.pdf"`
    }
  });
}
