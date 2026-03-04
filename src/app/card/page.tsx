"use client";

import dynamic from "next/dynamic";
import { QRCodeSVG } from "qrcode.react";
import { siteConfig, socialLinks, skills } from "@/data/projects";

// ─── 3D Background (SSR-off) ─────────────────────────────────────────────────
const CardScene = dynamic(() => import("@/components/three/CardScene"), {
  ssr: false,
  loading: () => <div data-testid="card-canvas" className="absolute inset-0" />,
});

// ─── vCard download ───────────────────────────────────────────────────────────
function downloadVCard() {
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${siteConfig.name}`,
    `N:Dominguez Diaz;Daniel Alejandro;;;`,
    `TITLE:${siteConfig.title}`,
    "EMAIL;TYPE=INTERNET:danielfromarg@gmail.com",
    `URL;TYPE=Portfolio:${siteConfig.url}`,
    "URL;TYPE=Project:https://codeprism.dev",
    "END:VCARD",
  ].join("\r\n");

  const blob = new Blob([vcard], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dan1d.vcf";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
function GitHubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="w-5 h-5"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="w-5 h-5"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-5 h-5"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

// ─── Top 8 skills to display ──────────────────────────────────────────────────
const displaySkills = skills.slice(0, 8);

// ─── Card URL ─────────────────────────────────────────────────────────────────
const CARD_URL = "https://dan1d.dev/card";

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CardPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden">
      {/* 3D animated background */}
      <CardScene />

      {/* Dark overlay so card content reads clearly */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70 pointer-events-none" />

      {/* Business card */}
      <main
        className="relative z-10 w-full max-w-md mx-auto px-4 py-8"
        style={{ animation: "fadeInUp 0.6s ease forwards" }}
      >
        <div
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 flex flex-col items-center gap-6 shadow-2xl shadow-black/60"
        >
          {/* Avatar / initials circle */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)",
            }}
          >
            DD
          </div>

          {/* Name */}
          <div className="text-center">
            <h1
              className="text-2xl font-extrabold tracking-tight mb-1"
              style={{
                background: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {siteConfig.name}
            </h1>
            <p className="text-slate-300 font-semibold text-sm tracking-wide">
              {siteConfig.title}
            </p>
            <p className="text-slate-500 text-xs mt-1">Creator of CodePrism</p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Social links */}
          <div className="flex items-center gap-4">
            {/* GitHub */}
            {(() => {
              const gh = socialLinks.find((l) => l.name === "GitHub");
              return gh ? (
                <a
                  href={gh.url}
                  aria-label="GitHub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-400 transition-all duration-200"
                >
                  <GitHubIcon />
                </a>
              ) : null;
            })()}

            {/* LinkedIn */}
            {(() => {
              const li = socialLinks.find((l) => l.name === "LinkedIn");
              return li ? (
                <a
                  href={li.url}
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-400 transition-all duration-200"
                >
                  <LinkedInIcon />
                </a>
              ) : null;
            })()}

            {/* Email */}
            {(() => {
              const em = socialLinks.find((l) => l.name === "Email");
              return em ? (
                <a
                  href={em.url}
                  aria-label="Email"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-400 transition-all duration-200"
                >
                  <MailIcon />
                </a>
              ) : null;
            })()}
          </div>

          {/* Skills */}
          <div className="flex flex-wrap justify-center gap-2">
            {displaySkills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-300 border border-white/10"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* QR code + actions */}
          <div className="flex flex-col items-center gap-4 w-full">
            {/* QR code */}
            <div className="p-3 rounded-xl bg-white/10 border border-white/10">
              <QRCodeSVG
                value={CARD_URL}
                size={120}
                data-testid="card-qr"
                bgColor="transparent"
                fgColor="#06b6d4"
                level="M"
              />
            </div>
            <p className="text-xs text-slate-500">{CARD_URL}</p>

            {/* Buttons row */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Save Contact */}
              <button
                type="button"
                data-testid="save-contact-btn"
                onClick={downloadVCard}
                aria-label="Save Contact"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-black bg-cyan-400 hover:bg-cyan-300 transition-colors duration-200 shadow-lg shadow-cyan-500/20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="w-4 h-4"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Save Contact
              </button>

              {/* View Portfolio */}
              <a
                href="/"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-cyan-400 border border-cyan-400/50 hover:border-cyan-400 hover:bg-cyan-400/10 transition-all duration-200"
              >
                View Portfolio
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Entrance animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
