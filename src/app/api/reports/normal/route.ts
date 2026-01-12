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
    let input: string[] | ImageRecord[];
    
    console.log('[Normal Report] Request received');
    
    if (body.imageIds) {
      // Format: just IDs (strings)
      console.log(`[Normal Report] Using imageIds format with ${body.imageIds.length} IDs`);
      input = body.imageIds;
    } else if (body.images) {
      // Format: ImageRecord[] (with or without dataUrl)
      console.log(`[Normal Report] Using images format with ${body.images.length} records`);
      input = body.images;
    } else {
      console.error('[Normal Report] No images or imageIds provided in request body');
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (!input || !input.length) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    // Validate reasonable limits
    if (input.length > 1000) {
      return NextResponse.json(
        { error: "Maximum 1000 images per report" },
        { status: 400 },
      );
    }

    console.log(`[Normal Report] Generating report for ${input.length} images...`);
    const reportBuffer = await generateNormalReport(input);
    console.log(`[Normal Report] Report generated successfully: ${reportBuffer.length} bytes`);

    return new NextResponse(Uint8Array.from(reportBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="inspection-report-${new Date().toISOString().split("T")[0]}.docx"`,
        "Cache-Control": "no-store",
        "Content-Length": reportBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[Normal Report] Error generating report:", error);
    if (error instanceof Error) {
      console.error('[Normal Report] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 },
    );
  }
}
