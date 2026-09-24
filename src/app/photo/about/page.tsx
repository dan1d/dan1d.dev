import type { Metadata } from "next";
import Link from "next/link";

import DevelopImage from "@/components/photo/DevelopImage";

const LENSES: string[] = [];
const PORTRAIT: string | null = null;

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl p-6 pt-24 pb-24">
      {PORTRAIT && (
        <DevelopImage
          src={PORTRAIT}
          alt="Portrait of Daniel Dominguez"
          width={1200}
          height={1600}
          className="mb-10 max-w-[16rem]"
        />
      )}

      <p
        className="mb-8 text-lg"
        style={{ fontFamily: "var(--font-fraunces)", color: "var(--dk-fg)" }}
      >
        I’m Daniel, a software engineer who picked up a Nikon D850 a few
        years ago and never quite put it down. Most weekends I’m out chasing
        quiet light — empty streets at night, the hour before a city wakes
        up — and this is where that work lives. I shoot for the same reason
        I write code: slowly, deliberately, and because I can’t help it.
      </p>

      <dl className="mb-10 space-y-1 text-sm" style={{ color: "var(--dk-muted)" }}>
        <div>
          <dt className="inline font-semibold">Camera</dt>
          <dd className="inline"> — Nikon D850</dd>
        </div>
        {LENSES.length > 0 && (
          <div>
            <dt className="inline font-semibold">Lenses</dt>
            <dd className="inline"> — {LENSES.join(", ")}</dd>
          </div>
        )}
      </dl>

      <p className="mb-2 text-sm" style={{ color: "var(--dk-muted)" }}>
        For prints or commissions:{" "}
        <a href="mailto:danielfromarg@gmail.com" style={{ color: "var(--dk-safelight)" }}>
          danielfromarg@gmail.com
        </a>{" "}
        ·{" "}
        <a
          href="https://www.linkedin.com/in/dan1d"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--dk-safelight)" }}
        >
          LinkedIn
        </a>
      </p>

      <p className="text-sm" style={{ color: "var(--dk-muted)" }}>
        I also build software:{" "}
        <Link href="/" style={{ color: "var(--dk-safelight)" }}>
          dan1d.dev
        </Link>
      </p>
    </main>
  );
}
