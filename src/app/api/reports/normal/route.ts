import { NextRequest, NextResponse } from "next/server";
import { generateNormalReport } from "@/lib/reports";
import { ImageRecord } from "@/store/useAppStore";

// Increase timeout for large reports (500 images can take time)
export const maxDuration = 300; // 5 minutes for production
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { images } = (await request.json()) as { images: ImageRecord[] };

    if (!images || !images.length) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    // Validate reasonable limits
    if (images.length > 1000) {
      return NextResponse.json(
        { error: "Maximum 1000 images per report" },
        { status: 400 },
      );
    }

    const reportBuffer = await generateNormalReport(images);

    return new NextResponse(Uint8Array.from(reportBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="inspection-report-${new Date().toISOString().split("T")[0]}.docx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating normal report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 },
    );
  }
}
