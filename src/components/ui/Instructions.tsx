"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dan1d-onboarding-dismissed";

const features = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    ),
    label: "Scroll to navigate",
    description: "Sections animate as you scroll through the page.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    label: "3D Scenes",
    description: "Interact with 3D elements by clicking and dragging.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    label: "Projects",
    description: "Explore featured and open source projects I have built.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
      </svg>
    ),
    label: "GitHub Skyline",
    description:
      "Your contribution history visualized as a 3D city skyline.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    label: "AR Experience",
    description:
      "Scan QR codes to view projects in augmented reality on your device.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M7 15h.01M11 15h2M15 15h.01" />
      </svg>
    ),
    label: "Business Card",
    description: "Share your digital business card at /card.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
    label: "Resume",
    description: "View and download the resume.",
  },
];

export default function Instructions() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructions-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
    >
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8">
        {/* Gradient decorations */}
        <div
          className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 rounded-full bg-green-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-emerald-600/20 blur-3xl"
          aria-hidden="true"
        />

        {/* Title */}
        <h2
          id="instructions-title"
          className="relative text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2"
        >
          Welcome to dan1d.dev
        </h2>
        <span className="block text-green-400/40 text-xs font-mono mt-1">There is no spoon.</span>

        {/* Intro */}
        <p className="relative text-white/60 text-sm mb-6">
          This is an interactive 3D portfolio. Here&apos;s what you can
          explore:
        </p>

        {/* Feature list */}
        <ul className="relative space-y-3 mb-8">
          {features.map(({ icon, label, description }) => (
            <li key={label} className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0 text-green-400">{icon}</span>
              <div>
                <span className="block text-sm font-semibold text-white">
                  {label}
                </span>
                <span className="text-xs text-white/50">{description}</span>
              </div>
            </li>
          ))}
        </ul>

        {/* Dismiss button */}
        <div className="relative flex justify-end">
          <button
            type="button"
            data-testid="dismiss-instructions"
            onClick={dismiss}
            className="px-6 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 transition-opacity duration-200 shadow-lg"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
