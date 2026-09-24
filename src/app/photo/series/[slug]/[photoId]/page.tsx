import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { readManifest } from "@/lib/photo/manifest";
import { neighbours, photoById, publicPhotos } from "@/lib/photo/queries";
import Loupe from "@/components/photo/Loupe";
import PhotoDetail from "@/components/photo/PhotoDetail";

interface PhotoPageParams {
  params: Promise<{ slug: string; photoId: string }>;
}

export async function generateStaticParams() {
  const entries = await readManifest();
  return publicPhotos(entries)
    .filter((photo) => photo.seriesSlug !== null)
    .map((photo) => ({ slug: photo.seriesSlug as string, photoId: photo.id }));
}

export async function generateMetadata({ params }: PhotoPageParams): Promise<Metadata> {
  const { photoId } = await params;
  const entries = await readManifest();
  const photo = photoById(entries, photoId);
  return { title: photo?.title ?? "Photo" };
}

export default async function PhotoPage({ params }: PhotoPageParams) {
  const { slug, photoId } = await params;
  const entries = await readManifest();
  const photo = photoById(publicPhotos(entries), photoId);

  if (!photo || photo.seriesSlug !== slug) notFound();

  const { prev, next } = neighbours(entries, photoId);

  return (
    <main className="min-h-screen p-6 pt-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/photo/series/${slug}`}
            className="text-xs tracking-widest uppercase"
            style={{ color: "var(--dk-muted)" }}
          >
            Back to {photo.series ?? "series"}
          </Link>
          <Loupe photo={photo} />
        </div>

        <PhotoDetail photo={photo} />

        <nav
          className="mt-10 flex justify-between text-xs tracking-widest uppercase"
          style={{ color: "var(--dk-muted)" }}
        >
          {prev ? (
            <Link href={`/photo/series/${slug}/${prev.id}`}>&larr; Previous</Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/photo/series/${slug}/${next.id}`}>Next &rarr;</Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </main>
  );
}
