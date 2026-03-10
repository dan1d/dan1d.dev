import { NextRequest, NextResponse } from "next/server";
import React from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("x-admin-secret");
  return auth === secret;
}

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  const auth = req.headers.get("x-admin-secret");
  if (!secret || auth !== secret) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        debug: {
          envSet: !!secret,
          headerSent: !!auth,
        },
      },
      { status: 401 }
    );
  }

  try {
    // Dynamic import to avoid bundling issues
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
        "Content-Disposition": 'attachment; filename="resume.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      {
        error: "PDF generation failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
