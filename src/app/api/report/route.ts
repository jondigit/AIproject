export const runtime = "nodejs";

import PDFDocument from "pdfkit";

function toBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export async function POST(req: Request) {
  const data = await req.json();

  const b = data?.business ?? {};
  const s = data?.summary ?? {};
  const issues = Array.isArray(data?.issues) ? data.issues : [];
  const wins = Array.isArray(data?.monthly?.wins) ? data.monthly.wins : [];
  const nextSteps = Array.isArray(data?.monthly?.nextSteps) ? data.monthly.nextSteps : [];

  const name = String(b?.name ?? "LocalBoost Client");
  const city = String(b?.city ?? "");
  const website = String(b?.website ?? "");
  const category = String(b?.category ?? "");
  const score = Number(s?.score ?? 0);
  const headline = String(s?.headline ?? "Monthly Summary");

  // Build PDF
  const doc = new PDFDocument({ size: "LETTER", margin: 54 });

  // Header
  doc.fontSize(20).text("LocalBoost Monthly Report", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor("#444").text(`${name} • ${category}`, { align: "left" });
  doc.text(`${city}`, { align: "left" });
  doc.text(`${website}`, { align: "left" });
  doc.fillColor("#000");
  doc.moveDown();

  // Score box
  doc.fontSize(14).text("Overall Score");
  doc.moveDown(0.3);
  doc.fontSize(12).text(`Score: ${score}/100`);
  doc.text(headline);
  doc.moveDown();

  // Issues
  doc.fontSize(14).text("Top Issues");
  doc.moveDown(0.4);

  issues.slice(0, 6).forEach((x: any, idx: number) => {
    const title = String(x?.title ?? `Issue ${idx + 1}`);
    const severity = String(x?.severity ?? "Medium");
    const why = String(x?.why ?? "");
    const fix = String(x?.fix ?? "");

    doc.fontSize(12).text(`${idx + 1}. ${title} (${severity})`);
    if (why) doc.fillColor("#444").text(`Why: ${why}`);
    if (fix) doc.fillColor("#444").text(`Fix: ${fix}`);
    doc.fillColor("#000").moveDown(0.6);
  });

  // Wins
  doc.addPage();
  doc.fontSize(14).text("Wins This Month");
  doc.moveDown(0.4);
  if (wins.length === 0) {
    doc.fontSize(12).fillColor("#444").text("No wins recorded yet.");
    doc.fillColor("#000");
  } else {
    wins.forEach((w: string) => {
      doc.fontSize(12).text(`• ${w}`);
    });
  }

  doc.moveDown(1.2);

  // Next steps
  doc.fontSize(14).text("Next Steps");
  doc.moveDown(0.4);
  if (nextSteps.length === 0) {
    doc.fontSize(12).fillColor("#444").text("No next steps recorded yet.");
    doc.fillColor("#000");
  } else {
    nextSteps.forEach((n: string) => {
      doc.fontSize(12).text(`• ${n}`);
    });
  }

  const pdfBuffer = await toBuffer(doc);

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="LocalBoost-Report-${name.replaceAll(" ", "_")}.pdf"`
    }
  });
}
