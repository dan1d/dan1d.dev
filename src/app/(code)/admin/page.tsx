"use client";

import { useState, useCallback } from "react";
import { resumeData, formatDateRange } from "@/data/resume";

type Tab = "overview" | "generate" | "linkedin";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [linkedinData, setLinkedinData] = useState<Record<string, unknown> | null>(null);
  const [loadingLinkedin, setLoadingLinkedin] = useState(false);

  const headers = useCallback(
    () => ({ "x-admin-secret": secret }),
    [secret]
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (secret.trim()) setAuthenticated(true);
  };

  const handleGeneratePdf = async () => {
    setGenerating(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/generate-pdf", {
        method: "POST",
        headers: headers(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("PDF regenerated successfully. The live /api/resume endpoint cache has been purged — visitors will now get the updated version.");
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleFetchLinkedin = async () => {
    setLoadingLinkedin(true);
    try {
      const res = await fetch("/api/admin/linkedin-sync", {
        headers: headers(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setLinkedinData(data);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingLinkedin(false);
    }
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <form onSubmit={handleLogin} className="border border-green-400/30 p-8 max-w-sm w-full">
          <h1 className="text-green-400 text-lg mb-6" style={{ textShadow: "0 0 10px #00ff41" }}>
            {">"} ADMIN_ACCESS
          </h1>
          <label className="block text-xs text-green-400/50 mb-2 tracking-widest uppercase">
            // ADMIN_SECRET
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full bg-black border border-green-400/30 text-green-400 px-3 py-2 text-sm font-mono focus:outline-none focus:border-green-400"
            placeholder="Enter admin secret..."
            autoFocus
          />
          <button
            type="submit"
            className="mt-4 w-full border border-green-400/50 text-green-400 py-2 text-xs tracking-widest hover:bg-green-400/10 transition-colors"
          >
            [AUTHENTICATE]
          </button>
        </form>
      </div>
    );
  }

  const d = resumeData;

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <header className="border-b border-green-400/20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg tracking-wider" style={{ textShadow: "0 0 10px #00ff41" }}>
            {">"} ADMIN_DASHBOARD
          </h1>
          <span className="text-xs text-green-400/40">dan1d.dev</span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-green-400/10 px-6">
        <div className="max-w-6xl mx-auto flex gap-0">
          {(["overview", "generate", "linkedin"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs tracking-widest uppercase transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-green-400 text-green-400"
                  : "border-transparent text-green-400/40 hover:text-green-400/70"
              }`}
            >
              [{tab}]
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {status && (
          <div
            className={`mb-6 p-3 border text-xs ${
              status.startsWith("Error")
                ? "border-red-400/50 text-red-400 bg-red-400/5"
                : "border-green-400/50 text-green-400 bg-green-400/5"
            }`}
          >
            {status}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Personal Info */}
            <Section title="PERSONAL_INFO">
              <DataRow label="Name" value={d.personal.fullName} />
              <DataRow label="Title" value={d.personal.title} />
              <DataRow label="Email" value={d.personal.email} />
              <DataRow label="Location" value={d.personal.location} />
              <DataRow label="Website" value={d.personal.website} />
              <DataRow label="GitHub" value={d.personal.github} />
              <DataRow label="LinkedIn" value={d.personal.linkedin} />
            </Section>

            {/* Experience */}
            <Section title="EXPERIENCE">
              {d.experience.map((exp, i) => (
                <div key={i} className="mb-4 pl-4 border-l border-green-400/15">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm text-green-300 font-bold">{exp.company}</span>
                      <span className="text-green-400/40 mx-2">·</span>
                      <span className="text-xs text-green-400/70">{exp.title}</span>
                    </div>
                    <span className="text-xs text-green-400/30">
                      {formatDateRange(exp.startDate, exp.endDate)}
                    </span>
                  </div>
                  <p className="text-xs text-green-400/30 mt-0.5">{exp.location}</p>
                  <ul className="mt-1 space-y-0.5">
                    {exp.highlights.map((h, j) => (
                      <li key={j} className="text-xs text-green-400/50 flex gap-2">
                        <span className="text-green-400/30">▸</span> {h}
                      </li>
                    ))}
                  </ul>
                  {exp.technologies && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {exp.technologies.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 border border-green-400/10 text-green-400/40">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Section>

            {/* Skills */}
            <Section title="SKILLS">
              <div className="flex flex-wrap gap-2">
                {d.skills.map((skill) => (
                  <span key={skill} className="text-xs px-2 py-1 border border-green-400/20 text-green-400/60">
                    {skill}
                  </span>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Generate Tab */}
        {activeTab === "generate" && (
          <div className="space-y-6">
            <Section title="GENERATE_PDF">
              <p className="text-xs text-green-400/50 mb-4 leading-relaxed">
                Generate a new resume PDF from the centralized data in{" "}
                <code className="text-green-400/80">src/data/resume.ts</code>.
                The PDF uses a professional layout with Matrix-inspired accents,
                following Harvard resume best practices.
              </p>
              <p className="text-xs text-green-400/50 mb-6 leading-relaxed">
                Clicking generate will regenerate the PDF and purge the cache.
                Visitors will automatically get the updated version from <code className="text-green-400/80">/api/resume</code>.
              </p>
              <button
                onClick={handleGeneratePdf}
                disabled={generating}
                className="inline-flex items-center gap-2 px-6 py-3 border border-green-400/50 text-green-400 text-xs tracking-widest hover:bg-green-400/10 hover:border-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <span className="animate-pulse">■</span> GENERATING...
                  </>
                ) : (
                  <>[ GENERATE_PDF ]</>
                )}
              </button>
            </Section>

            <Section title="DATA_SOURCE">
              <p className="text-xs text-green-400/50 leading-relaxed">
                Edit <code className="text-green-400/80">src/data/resume.ts</code> to update resume content.
                All sections (experience, skills, profile) are read from this single file.
                After editing, regenerate the PDF from this dashboard.
              </p>
              <div className="mt-4 p-3 border border-green-400/10 bg-green-400/5">
                <p className="text-[10px] text-green-400/40 tracking-widest mb-2">// FILE_STRUCTURE</p>
                <pre className="text-xs text-green-400/60 leading-relaxed">{`src/data/resume.ts      ← Single source of truth
src/lib/resumePdfDocument.tsx  ← PDF template & layout
src/app/api/admin/      ← Admin API endpoints
src/app/admin/          ← This dashboard`}</pre>
              </div>
            </Section>
          </div>
        )}

        {/* LinkedIn Tab */}
        {activeTab === "linkedin" && (
          <div className="space-y-6">
            <Section title="LINKEDIN_SYNC">
              <p className="text-xs text-green-400/50 mb-4 leading-relaxed">
                Fetch your current resume data formatted for LinkedIn.
                Use this to manually update your LinkedIn profile to match dan1d.dev.
              </p>
              <button
                onClick={handleFetchLinkedin}
                disabled={loadingLinkedin}
                className="inline-flex items-center gap-2 px-6 py-3 border border-green-400/50 text-green-400 text-xs tracking-widest hover:bg-green-400/10 hover:border-green-400 transition-colors disabled:opacity-40"
              >
                {loadingLinkedin ? (
                  <>
                    <span className="animate-pulse">■</span> LOADING...
                  </>
                ) : (
                  <>[ FETCH_LINKEDIN_DATA ]</>
                )}
              </button>
            </Section>

            {linkedinData && (
              <>
                <Section title="INSTRUCTIONS">
                  <ol className="space-y-1">
                    {(linkedinData.instructions as string[])?.map((step, i) => (
                      <li key={i} className="text-xs text-green-400/60 flex gap-2">
                        <span className="text-green-400/30 w-4 text-right shrink-0">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </Section>

                <Section title="HEADLINE">
                  <CopyBlock text={linkedinData.headline as string} />
                </Section>

                <Section title="ABOUT">
                  <CopyBlock text={linkedinData.about as string} />
                </Section>

                <Section title="EXPERIENCE_ENTRIES">
                  {(linkedinData.experience as Array<{
                    title: string;
                    company: string;
                    dateRange: string;
                    location: string;
                    description: string;
                  }>)?.map((exp, i) => (
                    <div key={i} className="mb-4 p-3 border border-green-400/10">
                      <div className="flex justify-between mb-2">
                        <div>
                          <span className="text-xs text-green-300 font-bold">{exp.company}</span>
                          <span className="text-green-400/30 mx-2">·</span>
                          <span className="text-xs text-green-400/60">{exp.title}</span>
                        </div>
                        <span className="text-[10px] text-green-400/30">{exp.dateRange}</span>
                      </div>
                      <p className="text-[10px] text-green-400/30 mb-2">{exp.location}</p>
                      <CopyBlock text={exp.description} />
                    </div>
                  ))}
                </Section>

                <Section title="SKILLS">
                  <CopyBlock text={(linkedinData.skills as string[])?.join(" · ")} />
                </Section>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs text-green-400/40 tracking-widest uppercase mb-4 pb-2 border-b border-green-400/10">
        // {title}
      </h2>
      {children}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-1">
      <span className="text-xs text-green-400/30 w-20 text-right">{label}:</span>
      <span className="text-xs text-green-400/70">{value}</span>
    </div>
  );
}

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="text-xs text-green-400/50 whitespace-pre-wrap leading-relaxed bg-green-400/5 p-3 border border-green-400/10 overflow-x-auto">
        {text}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 text-[10px] px-2 py-1 border border-green-400/20 text-green-400/40 hover:text-green-400 hover:border-green-400/50 transition-colors opacity-0 group-hover:opacity-100"
      >
        {copied ? "COPIED" : "COPY"}
      </button>
    </div>
  );
}
