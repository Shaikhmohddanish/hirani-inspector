import { NextRequest, NextResponse } from "next/server";
import { imageStore } from "../../analyze/route";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const imageBuffer = imageStore.get(id);

  if (!imageBuffer) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return new NextResponse(Uint8Array.from(imageBuffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contentType = request.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    // Store metadata
    const metadata = await request.json();
    imageStore.set(`${id}_metadata`, Buffer.from(JSON.stringify(metadata)));
    return NextResponse.json({ success: true, id });
  } else {
    // Store image buffer
    const buffer = Buffer.from(await request.arrayBuffer());
    imageStore.set(id, buffer);
    return NextResponse.json({ success: true, id });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  imageStore.delete(id);
  imageStore.delete(`${id}_metadata`);
  imageStore.delete(`${id}_annotated`);

  return NextResponse.json({ success: true });
}
