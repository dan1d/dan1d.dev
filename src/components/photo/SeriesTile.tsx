import Link from "next/link";

import type { SeriesSummary } from "@/lib/photo/queries";
import { buildSrcSet } from "@/lib/photo/srcset";
import { tierUrl } from "@/lib/photo/urls";

import DevelopImage from "./DevelopImage";

interface SeriesTileProps {
  series: SeriesSummary;
}

export default function SeriesTile({ series }: SeriesTileProps) {
  return (
    <Link href={`/photo/series/${series.slug}`} className="group block">
      <DevelopImage
        src={tierUrl(series.cover.id, "grid")}
        srcSet={buildSrcSet(series.cover, ["thumb", "grid"])}
        sizes="(min-width: 768px) 33vw, 100vw"
        alt={series.cover.alt}
        width={series.cover.width}
        height={series.cover.height}
      />
      <div className="mt-3 flex items-baseline justify-between">
        <h3
          className="text-base"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--dk-fg)" }}
        >
          {series.title}
        </h3>
        <span className="text-xs" style={{ color: "var(--dk-muted)" }}>
          {series.count}
        </span>
      </div>
    </Link>
  );
}
