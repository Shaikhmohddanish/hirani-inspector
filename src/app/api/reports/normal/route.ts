import { NextRequest, NextResponse } from "next/server";
import { generateNormalReport } from "@/lib/reports";
import { ImageRecord } from "@/store/useAppStore";

// Increase timeout for large reports (500 images can take time)
export const maxDuration = 300; // 5 minutes for production
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Accept both formats for backward compatibility
    const body = await request.json();
    let imageIds: string[];
    
    if (body.imageIds) {
      // New format: just IDs
      imageIds = body.imageIds;
    } else if (body.images) {
      // Old format: extract IDs from ImageRecord[]
      imageIds = body.images.map((img: ImageRecord) => img.id);
    } else {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (!imageIds || !imageIds.length) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    // Validate reasonable limits
    if (imageIds.length > 1000) {
      return NextResponse.json(
        { error: "Maximum 1000 images per report" },
        { status: 400 },
      );
    }

    const reportBuffer = await generateNormalReport(imageIds);

    return new NextResponse(Uint8Array.from(reportBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="inspection-report-${new Date().toISOString().split("T")[0]}.docx"`,
        "Cache-Control": "no-store",
        "Content-Length": reportBuffer.length.toString(),
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
