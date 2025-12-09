import { NextRequest, NextResponse } from "next/server";
import { imageStore } from "@/app/api/analyze/route";
import { generateAnnotatedImage } from "@/lib/annotations";
import { AnnotationBox } from "@/store/useAppStore";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { annotations } = body as { annotations: AnnotationBox[] };

    // Get original image
    const originalBuffer = imageStore.get(id);
    if (!originalBuffer) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Generate annotated image
    const annotatedBuffer = await generateAnnotatedImage(originalBuffer, annotations);

    // Store annotated image with suffix
    const annotatedId = `${id}_annotated`;
    imageStore.set(annotatedId, annotatedBuffer);

    return NextResponse.json({ success: true, annotatedId });
  } catch (error) {
    console.error("Error generating annotated image:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate annotated image" },
      { status: 500 },
    );
  }
}
