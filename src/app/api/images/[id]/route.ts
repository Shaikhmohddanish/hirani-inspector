import { NextRequest, NextResponse } from "next/server";
import { getImage, storeImage, storeMetadata, deleteImage } from "@/lib/storage";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const imageBuffer = await getImage(id);

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
  try {
    const { id } = await params;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      // Store metadata
      const metadata = await request.json();
      console.log(`Storing metadata for ${id}:`, metadata);
      await storeMetadata(id, metadata);
      return NextResponse.json({ success: true, id });
    } else {
      // Store image buffer
      console.log(`Uploading image ${id} to Cloudinary...`);
      const buffer = Buffer.from(await request.arrayBuffer());
      console.log(`Buffer size: ${buffer.length} bytes`);
      await storeImage(id, buffer);
      console.log(`Successfully uploaded ${id}`);
      return NextResponse.json({ success: true, id });
    }
  } catch (error) {
    console.error('Error in POST /api/images/[id]:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteImage(id);
  return NextResponse.json({ success: true });
}
