import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { readManifest } from "@/lib/photo/manifest";
import { photosInSeries, seriesList } from "@/lib/photo/queries";
import PhotoGrid from "@/components/photo/PhotoGrid";

interface SeriesPageParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const entries = await readManifest();
  return seriesList(entries).map((series) => ({ slug: series.slug }));
}

export async function generateMetadata({ params }: SeriesPageParams): Promise<Metadata> {
  const { slug } = await params;
  const entries = await readManifest();
  const series = seriesList(entries).find((s) => s.slug === slug);
  return { title: series?.title ?? "Series" };
}

export default async function SeriesPage({ params }: SeriesPageParams) {
  const { slug } = await params;
  const entries = await readManifest();
  const series = seriesList(entries).find((s) => s.slug === slug);
  const photos = photosInSeries(entries, slug);

  if (!series || photos.length === 0) notFound();

  return (
    <main className="p-6 pt-24">
      <div className="mx-auto mb-10 flex max-w-6xl items-baseline justify-between">
        <h1
          className="text-2xl"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--dk-fg)" }}
        >
          {series.title}
        </h1>
        <Link
          href="/photo/series"
          className="text-xs tracking-widest uppercase"
          style={{ color: "var(--dk-muted)" }}
        >
          All series
        </Link>
      </div>
      <div className="mx-auto max-w-6xl">
        <PhotoGrid photos={photos} />
      </div>
    </main>
  );
}
