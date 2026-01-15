type Severity = "High" | "Medium" | "Low";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mockScore(website: string) {
  let s = 68;
  if (!website.startsWith("https://")) s -= 10;
  if (website.includes("example")) s -= 8;
  if (website.length < 10) s -= 5;
  return clamp(s, 35, 92);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body?.name ?? "Local Business");
  const website = String(body?.website ?? "https://example.com");
  const city = String(body?.city ?? "Your City");
  const category = String(body?.category ?? "Service");

  const score = mockScore(website);
  const cityShort = city.split(",")[0]?.trim() || city;

  const keywords = [
    `${category.toLowerCase()} ${cityShort.toLowerCase()}`,
    `${category.toLowerCase()} near me`,
    `best ${category.toLowerCase()} ${cityShort.toLowerCase()}`,
    `${category.toLowerCase()} open now`,
    `affordable ${category.toLowerCase()} ${cityShort.toLowerCase()}`
  ];

  const issues: { title: string; severity: Severity; why: string; fix: string }[] = [
    {
      title: "Weak or missing page titles",
      severity: "High",
      why: "Google relies on page titles to understand what you offer and where you serve customers.",
      fix: "Add service + location keywords to your homepage and main service pages."
    },
    {
      title: "Meta descriptions not optimized",
      severity: "Medium",
      why: "Better meta descriptions can increase clicks from Google even before rankings improve.",
      fix: "Write simple, local, benefit-focused meta descriptions under ~160 characters."
    },
    {
      title: "Low local content depth",
      severity: "Medium",
      why: "Competitors often outrank you by having more pages targeting local services and neighborhoods.",
      fix: "Add 2–4 local service pages and publish a short weekly post."
    },
    {
      title: "Not enough recent Google Business activity",
      severity: "Low",
      why: "Fresh posts/photos and review responses help visibility in the local map pack.",
      fix: "Post weekly and upload 3–5 photos monthly."
    }
  ];

  return Response.json({
    business: { name, website, city, category },
    summary: {
      score,
      headline: score >= 75 ? "Strong foundation — easy wins available" : "Needs quick optimization to compete locally",
      notes: [
        "Your site can rank higher with better titles, meta descriptions, and local keywords.",
        "Google Business Profile activity is a major lever for calls + directions.",
        "A monthly update cycle keeps you competitive without hiring an agency."
      ]
    },
    issues,
    seoFixes: [
      {
        page: "Homepage",
        title: `${name} | ${category} in ${cityShort}`,
        meta: `Trusted ${category.toLowerCase()} in ${cityShort}. Fast service, fair pricing, easy scheduling. Call today.`,
        h1: `${category} in ${cityShort} — ${name}`,
        keywords
      },
      {
        page: "Service Page (Suggested)",
        title: `${category} Near ${cityShort} | Fast & Reliable`,
        meta: `Need ${category.toLowerCase()} near ${cityShort}? Transparent pricing, quick turnaround, and friendly service.`,
        h1: `Local ${category} Near ${cityShort}`,
        keywords: keywords.slice(0, 3)
      }
    ],
    gmb: {
      actions: [
        "Add 10–15 photos (interior, exterior, team, work examples)",
        "Update services + business description with local keywords",
        "Enable messaging and add a quick auto-reply",
        "Ask for 2–3 reviews per week (text link makes it easy)"
      ],
      postDrafts: [
        {
          title: `This Week at ${name}`,
          body: `We’re serving ${cityShort} with reliable ${category.toLowerCase()} and fast turnaround. Message us for a quick quote.`
        },
        {
          title: `Quick Tip`,
          body: `If you're comparing options, ask about turnaround time and pricing upfront. We keep it simple and transparent — reach out anytime.`
        }
      ]
    },
    reviews: {
      responseTemplates: [
        {
          rating: 5,
          response: `Thank you for the support! We appreciate you choosing ${name}. If you need anything again, we’re here.`
        },
        {
          rating: 3,
          response: `Thanks for the feedback — we take it seriously. If you’re open to it, message us so we can learn what happened and improve.`
        },
        {
          rating: 1,
          response: `We’re sorry you had a bad experience. This isn’t the standard we aim for. Please contact us directly so we can resolve it quickly.`
        }
      ]
    },
    monthly: {
      wins: [
        "Improved local keyword targeting for titles and service pages",
        "Added a repeatable Google Business posting plan",
        "Created a simple monthly reporting workflow"
      ],
      nextSteps: [
        "Publish 2 local service pages (service + city keywords)",
        "Post weekly on Google Business Profile",
        "Request 8–12 reviews this month"
      ]
    }
  });
}
