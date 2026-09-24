import Link from "next/link";

import { readManifest } from "@/lib/photo/manifest";
import { recent, seriesList } from "@/lib/photo/queries";
import { buildSrcSet } from "@/lib/photo/srcset";
import { tierUrl } from "@/lib/photo/urls";
import DevelopImage from "@/components/photo/DevelopImage";
import EmptyDarkroom from "@/components/photo/EmptyDarkroom";
import PhotoSequence from "@/components/photo/PhotoSequence";
import SeriesTile from "@/components/photo/SeriesTile";

export default async function PhotoPage() {
  const entries = await readManifest();
  const photos = recent(entries, 7);

  if (photos.length === 0) {
    return <EmptyDarkroom />;
  }

  const [cover, ...sequence] = photos;
  const series = seriesList(entries).slice(0, 3);

  return (
    <main className="relative">
      <section className="relative flex min-h-screen items-end">
        <DevelopImage
          src={tierUrl(cover.id, "full")}
          srcSet={buildSrcSet(cover, ["grid", "full"])}
          sizes="100vw"
          alt={cover.alt}
          width={cover.width}
          height={cover.height}
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full"
        />
        <span
          className="absolute top-6 left-6 text-xs tracking-widest uppercase"
          style={{ color: "var(--dk-fg)" }}
        >
          Daniel Dominguez
        </span>
        {cover.series && (
          <span
            className="relative z-10 p-6 text-xs tracking-widest uppercase"
            style={{ color: "var(--dk-muted)" }}
          >
            {cover.series}
          </span>
        )}
      </section>

      <PhotoSequence photos={sequence} />

      {series.length > 0 && (
        <section className="mx-auto max-w-5xl p-6 py-24">
          <h2 className="sr-only">Series</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {series.map((s) => (
              <SeriesTile key={s.slug} series={s} />
            ))}
          </div>
          <p
            className="mt-16 max-w-prose text-sm"
            style={{ color: "var(--dk-muted)" }}
          >
            Daniel Dominguez is a software engineer who shoots a Nikon D850
            between projects, chasing quiet light.
          </p>
        </section>
      )}

      <footer className="mx-auto max-w-5xl px-6 pb-16 text-xs tracking-widest uppercase">
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
