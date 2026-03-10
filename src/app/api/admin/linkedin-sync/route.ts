import { NextRequest, NextResponse } from "next/server";
import { resumeData, formatDateRange } from "@/data/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("x-admin-secret");
  return auth === secret;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const d = resumeData;

  // Format data for LinkedIn profile update
  const linkedinData = {
    headline: `${d.personal.title} | ${d.skills.slice(0, 5).join(" · ")} | ${d.personal.website}`,

    about: d.profile,

    experience: d.experience.map((exp) => ({
      title: exp.title,
      company: exp.company,
      companyUrl: exp.companyUrl,
      dateRange: formatDateRange(exp.startDate, exp.endDate),
      startDate: exp.startDate,
      endDate: exp.endDate,
      location: exp.location,
      description: [
        exp.companyOverview ? `${exp.companyOverview}\n` : "",
        exp.summary ? `${exp.summary}\n` : "",
        ...exp.highlights.map((h) => `• ${h}`),
        "",
        exp.technologies
          ? `Technologies: ${exp.technologies.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    })),

    skills: d.skills,

    volunteering: d.volunteering.map((v) => ({
      organization: v.organization,
      role: v.role,
      dateRange: formatDateRange(v.startDate, v.endDate),
      description: [
        v.description,
        "",
        ...v.highlights.map((h) => `• ${h}`),
        "",
        v.technologies
          ? `Technologies: ${v.technologies.join(", ")}`
          : "",
        ...(v.links?.map((l) => `${l.label}: ${l.url}`) ?? []),
      ]
        .filter(Boolean)
        .join("\n"),
    })),

    languages: d.languages,

    websiteData: {
      name: d.personal.fullName,
      title: d.personal.title,
      email: d.personal.email,
      github: d.personal.github,
      linkedin: d.personal.linkedin,
      website: d.personal.website,
    },

    instructions: [
      "Go to linkedin.com/in/dan1d/edit/",
      "Update each section below to match the data from dan1d.dev",
      "Copy the 'headline' to your LinkedIn headline",
      "Copy the 'about' to your LinkedIn About section",
      "For each experience entry, verify title, company, dates, and description match",
      "Add any missing experience entries",
      "Remove any entries not in this data (unless intentionally LinkedIn-only)",
      "Update skills to match the skills list",
    ],
  };

  return NextResponse.json(linkedinData);
}
