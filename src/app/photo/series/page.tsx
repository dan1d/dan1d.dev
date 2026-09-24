import type { Metadata } from "next";
import Link from "next/link";

import { readManifest } from "@/lib/photo/manifest";
import { seriesList } from "@/lib/photo/queries";
import EmptyDarkroom from "@/components/photo/EmptyDarkroom";
import SeriesTile from "@/components/photo/SeriesTile";

export const metadata: Metadata = { title: "Series" };

export default async function SeriesIndexPage() {
  const entries = await readManifest();
  const series = seriesList(entries);

  if (series.length === 0) {
    return <EmptyDarkroom />;
  }

  return (
    <main className="mx-auto max-w-5xl p-6 pt-24 pb-16">
      <h1
        className="mb-10 text-2xl"
        style={{ fontFamily: "var(--font-fraunces)", color: "var(--dk-fg)" }}
      >
        Series
      </h1>
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((s) => (
          <SeriesTile key={s.slug} series={s} />
        ))}
      </div>

      <footer className="mt-16 text-xs tracking-widest uppercase">
        <Link href="/photo/series" style={{ color: "var(--dk-muted)" }}>
          All series
        </Link>
        {" · "}
        <Link href="/photo/about" style={{ color: "var(--dk-muted)" }}>
          About
        </Link>
      </footer>
    </main>
  );
}
