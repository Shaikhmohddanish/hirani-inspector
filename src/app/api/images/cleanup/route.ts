import { NextResponse } from "next/server";
import { deleteAllImages } from "@/lib/storage";

export async function DELETE() {
  try {
    console.log('Starting Cloudinary cleanup...');
    const result = await deleteAllImages();
    console.log(`Cleanup complete: ${result.deleted} deleted, ${result.errors} errors`);
    
    return NextResponse.json({ 
      success: true, 
      ...result,
      message: `Deleted ${result.deleted} images from Cloudinary`
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
