import { NextResponse } from "next/server";
import React from "react";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

// Tag for cache invalidation from admin
export const revalidate = 86400; // 24 hours

export async function GET() {
  try {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { default: ResumePdfDocument } = await import(
      "@/lib/resumePdfDocument"
    );

    const buffer = await renderToBuffer(
      React.createElement(ResumePdfDocument)
    );
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="daniel-dominguez-resume.pdf"',
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  }
}
