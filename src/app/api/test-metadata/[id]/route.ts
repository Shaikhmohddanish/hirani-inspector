import { NextRequest, NextResponse } from "next/server";
import { getMetadata } from "@/lib/storage";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log(`\n=== TESTING METADATA RETRIEVAL FOR ${id} ===`);
  
  const metadata = await getMetadata(id);
  
  console.log(`Retrieved metadata:`, JSON.stringify(metadata, null, 2));
  
  return NextResponse.json({
    id,
    metadata,
    hasMetadata: !!metadata,
    hasComment: !!metadata?.comment,
    commentLength: metadata?.comment?.length || 0,
  });
}
