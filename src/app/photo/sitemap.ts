import type { MetadataRoute } from "next";

import { readManifest } from "@/lib/photo/manifest";
import { publicPhotos, seriesList } from "@/lib/photo/queries";

const BASE_URL = "https://dan1d.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await readManifest();
  const photos = publicPhotos(entries).filter((photo) => photo.seriesSlug !== null);
  const series = seriesList(entries);

  return [
    { url: `${BASE_URL}/photo`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/photo/series`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/photo/about`, changeFrequency: "monthly", priority: 0.5 },
    ...series.map((s) => ({
      url: `${BASE_URL}/photo/series/${s.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...photos.map((photo) => ({
      url: `${BASE_URL}/photo/series/${photo.seriesSlug}/${photo.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
