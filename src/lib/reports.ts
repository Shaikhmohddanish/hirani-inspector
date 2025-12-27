"use server";

import {
  Document,
  Packer,
  Paragraph,
  ImageRun,
  AlignmentType,
} from "docx";
import { ImageRecord } from "@/store/useAppStore";
import { generateAnnotatedImage } from "@/lib/annotations";
import { getImage, getMetadata, getAnnotatedImage } from "@/lib/storage";

export async function generateNormalReport(imageIds: string[] | ImageRecord[]): Promise<Buffer> {
  let images: any[] = [];
  
  if (imageIds.length > 0 && typeof imageIds[0] === 'object' && imageIds[0] !== null && 'dataUrl' in imageIds[0]) {
    console.log('Using ImageRecord[] format with dataUrl');
    images = imageIds as ImageRecord[];
  } else if (imageIds.length > 0 && typeof imageIds[0] === 'string') {
    // New format: array of image IDs - fetch from storage
    console.log('Using string[] format - fetching from storage');
    for (const id of imageIds as string[]) {
      const metadata = await getMetadata(id);
      console.log(`Fetched metadata for ${id}:`, JSON.stringify(metadata, null, 2));
      if (metadata) {
        // Metadata structure: { comment, annotations, name }
        images.push({ 
          id, 
          comment: metadata.comment || "No assessment available",
          annotations: metadata.annotations || [],
          name: metadata.name || id
        });
        console.log(`Added image: ${id}, comment length: ${metadata.comment?.length || 0}`);
      } else {
        // If no metadata, create minimal record
        console.warn(`⚠️ No metadata found for ${id}`);
        images.push({ id, comment: "No assessment available", annotations: [], name: id });
      }
    }
    console.log(`Total images processed: ${images.length}`);
  } else {
    throw new Error(`Invalid input format: expected ImageRecord[] or string[], got ${typeof imageIds[0]}`);
  }

  // Process images in batches to avoid memory issues
  const BATCH_SIZE = 20; // Reduced for faster processing
  const sections = [];
  
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    const children = await buildNormalReportContent(batch, i);
    sections.push({ children });
  }

  const doc = new Document({ sections });
  return await Packer.toBuffer(doc);
}

export async function generateModifiedReport(imageIds: string[] | ImageRecord[]): Promise<Buffer> {
  // Handle both old format (ImageRecord[]) and new format (string[])
  let images: any[] = [];
  
  if (imageIds.length > 0 && typeof imageIds[0] === 'object' && imageIds[0] !== null && 'dataUrl' in imageIds[0]) {
    // Old format: array of ImageRecord objects with dataUrl
    console.log('Using ImageRecord[] format with dataUrl');
    images = imageIds as ImageRecord[];
  } else if (imageIds.length > 0 && typeof imageIds[0] === 'string') {
    // New format: array of image IDs - fetch from storage
    console.log('Using string[] format - fetching from storage');
    for (const id of imageIds as string[]) {
      const metadata = await getMetadata(id);
      console.log(`Metadata for ${id}:`, metadata);
      if (metadata) {
        // Metadata structure: { comment, annotations, name }
        images.push({ 
          id, 
          comment: metadata.comment || "No assessment available",
          annotations: metadata.annotations || [],
          name: metadata.name || id
        });
      } else {
        console.warn(`No metadata found for ${id}`);
        images.push({ id, comment: "No assessment available", annotations: [], name: id });
      }
    }
  } else {
    throw new Error(`Invalid input format: expected ImageRecord[] or string[], got ${typeof imageIds[0]}`);
  }

  // Process images in batches to avoid memory issues
  const BATCH_SIZE = 20; // Reduced for faster processing
  const sections = [];
  
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    const children = await buildModifiedReportContent(batch, i);
    sections.push({ children });
  }

  const doc = new Document({ sections });
  return await Packer.toBuffer(doc);
}

async function buildNormalReportContent(images: ImageRecord[], startIndex: number = 0): Promise<Paragraph[]> {
  const content: Paragraph[] = [];
  const imagesPerPage = 2;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const globalIndex = startIndex + i;

    // Original image
    try {
      const imageBuffer = await fetchImageBuffer(img.id, img.dataUrl);
      const { width, height } = await getImageDimensions(imageBuffer);
      const scaled = scaleToFit(width, height, 15);

      content.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: "jpg", // Changed to jpg for better compression
              data: imageBuffer,
              transformation: {
                width: scaled.width,
                height: scaled.height,
              },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),
      );
    } catch (error) {
      content.push(
        new Paragraph({
          text: `[Error loading image: ${error instanceof Error ? error.message : "Unknown"}]`,
          alignment: AlignmentType.LEFT,
          spacing: { after: 50 },
        }),
      );
    }

    // Image label on the left (e.g., Image 01)
    content.push(
      new Paragraph({
        text: `Image ${String(globalIndex + 1).padStart(2, "0")}`,
        alignment: AlignmentType.LEFT,
        spacing: { before: 50, after: 25 },
      }),
    );

    // Comment below
    content.push(
      new Paragraph({
        text: `Comment: ${img.comment || "No assessment available"}`,
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 },
      }),
    );

    // Page break (except for last image or every 2 images)
    if ((i + 1) % imagesPerPage === 0 && i + 1 !== images.length) {
      content.push(
        new Paragraph({
          pageBreakBefore: true,
        }),
      );
    }
  }

  return content;
}

async function buildModifiedReportContent(images: ImageRecord[], startIndex: number = 0): Promise<Paragraph[]> {
  const content: Paragraph[] = [];
  const imagesPerPage = 2;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const globalIndex = startIndex + i;

    // Modified report: show only annotated image (or original if no annotation)
    try {
      // Check for pre-saved annotated image first
      const savedAnnotated = await getAnnotatedImage(img.id);
      
      let imageBuffer: Buffer;
      
      if (savedAnnotated) {
        // Use pre-saved annotated image
        const sharp = (await import("sharp")).default;
        imageBuffer = await sharp(savedAnnotated)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
      } else if (img.annotations && img.annotations.length > 0) {
        // Generate annotated image on the fly
        let originalBuffer: Buffer;
        if (img.dataUrl) {
          // From dataUrl (old format)
          const base64Data = img.dataUrl.split(',')[1];
          originalBuffer = Buffer.from(base64Data, 'base64');
        } else {
          // From storage (new format)
          const storedBuffer = await getImage(img.id);
          if (!storedBuffer) throw new Error(`Image ${img.id} not found`);
          originalBuffer = storedBuffer;
        }
        const annotated = await generateAnnotatedImage(originalBuffer, img.annotations);
        // Optimize annotated image
        const sharp = (await import("sharp")).default;
        imageBuffer = await sharp(annotated)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
      } else {
        // No annotations, use original image
        imageBuffer = await fetchImageBuffer(img.id, img.dataUrl);
      }

      const { width, height } = await getImageDimensions(imageBuffer);
      const scaled = scaleToFit(width, height, 15);

      content.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: "jpg", // Changed to jpg
              data: imageBuffer,
              transformation: {
                width: scaled.width,
                height: scaled.height,
              },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),
      );
    } catch (error) {
      content.push(
        new Paragraph({
          text: `[Error loading images: ${error instanceof Error ? error.message : "Unknown"}]`,
          alignment: AlignmentType.LEFT,
          spacing: { after: 50 },
        }),
      );
    }

    // Image label on the left (e.g., Image 01)
    content.push(
      new Paragraph({
        text: `Image ${String(globalIndex + 1).padStart(2, "0")}`,
        alignment: AlignmentType.LEFT,
        spacing: { before: 50, after: 25 },
      }),
    );

    // Comment below
    content.push(
      new Paragraph({
        text: `Comment: ${img.comment || "No assessment available"}`,
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 },
      }),
    );

    // Page break
    if ((i + 1) % imagesPerPage === 0 && i + 1 !== images.length) {
      content.push(
        new Paragraph({
          pageBreakBefore: true,
        }),
      );
    }
  }

  return content;
}

async function fetchImageBuffer(imageId: string, dataUrl?: string): Promise<Buffer> {
  let buffer: Buffer;
  
  // Try dataUrl first (old format)
  if (dataUrl) {
    const base64Data = dataUrl.split(',')[1];
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    // Fetch from storage (new format)
    const storedBuffer = await getImage(imageId);
    if (!storedBuffer) throw new Error(`Image ${imageId} not found in store`);
    buffer = storedBuffer;
  }
  
  // Optimize image for Word document: resize and compress
  const sharp = (await import("sharp")).default;
  return await sharp(buffer)
    .resize(1200, 1200, { // Limit max dimensions for faster processing
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ // Use JPEG for better compression (Word supports it)
      quality: 85,
      progressive: true,
    })
    .toBuffer();
}

async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  const sharp = (await import("sharp")).default;
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 800,
    height: metadata.height || 600,
  };
}

function scaleToFit(
  widthPx: number,
  heightPx: number,
  maxWidthCm: number,
): { width: number; height: number } {
  // docx library expects dimensions in pixels, not EMU
  const DPI = 96;
  const CM_PER_INCH = 2.54;
  const maxWidthPx = (maxWidthCm / CM_PER_INCH) * DPI;
  const scale = Math.min(1, maxWidthPx / widthPx);
  const scaledWidth = widthPx * scale;
  const scaledHeight = heightPx * scale;
  return {
    width: Math.round(scaledWidth),
    height: Math.round(scaledHeight),
  };
}
