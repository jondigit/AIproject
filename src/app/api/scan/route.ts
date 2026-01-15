export async function POST(req: Request) {
  const body = await req.json();
  const { name, website, city, category } = body;

  return Response.json({
    business: { name, website, city, category },
    summary: {
      score: 62,
      headline: "Needs optimization to compete locally",
      notes: [
        "Page titles are not optimized",
        "Low Google Business activity",
        "Missing local service pages"
      ]
    },
    issues: [
      {
        title: "Missing page titles",
        severity: "High",
        why: "Google uses titles to rank pages",
        fix: "Add location + service keywords"
      }
    ],
    seoFixes: [
      {
        page: "Homepage",
        title: `${name} | ${category} in ${city}`,
        meta: `Trusted ${category} in ${city}. Call today.`,
        h1: `${category} in ${city}`,
        keywords: [`${category} near me`, `${category} ${city}`]
      }
    ],
    gmb: {
      actions: ["Post weekly updates", "Upload photos", "Respond to reviews"],
      postDrafts: [
        { title: "Now Serving", body: `Serving ${city} with reliable ${category}.` }
      ]
    },
    reviews: {
      responseTemplates: [
        { rating: 5, response: `Thanks for choosing ${name}!` }
      ]
    },
    monthly: {
      wins: ["Improved keyword targeting"],
      nextSteps: ["Add service pages"]
    }
  });
}
