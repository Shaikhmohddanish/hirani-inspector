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
import { imageStore } from "@/app/api/analyze/route";

export async function generateNormalReport(imageIds: string[]): Promise<Buffer> {
  // Fetch image metadata from store
  const images: any[] = [];
  for (const id of imageIds) {
    const metadataBuffer = imageStore.get(`${id}_metadata`);
    if (metadataBuffer) {
      images.push({ id, ...JSON.parse(metadataBuffer.toString()) });
    } else {
      // If no metadata, create minimal record
      images.push({ id, comment: "No assessment available" });
    }
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

export async function generateModifiedReport(imageIds: string[]): Promise<Buffer> {
  // Fetch image metadata from store
  const images: any[] = [];
  for (const id of imageIds) {
    const metadataBuffer = imageStore.get(`${id}_metadata`);
    if (metadataBuffer) {
      images.push({ id, ...JSON.parse(metadataBuffer.toString()) });
    } else {
      images.push({ id, comment: "No assessment available", annotations: [] });
    }
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

    // Image number
    content.push(
      new Paragraph({
        text: `Image No.: ${globalIndex + 1}`,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
      }),
    );

    // Original image
    try {
      const imageBuffer = await fetchImageBuffer(img.id);
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
          spacing: { after: 100 },
        }),
      );
    } catch (error) {
      content.push(
        new Paragraph({
          text: `[Error loading image: ${error instanceof Error ? error.message : "Unknown"}]`,
          alignment: AlignmentType.CENTER,
        }),
      );
    }

    // Assessment
    content.push(
      new Paragraph({
        text: `Assessment: ${img.comment || "No assessment available"}`,
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 200 },
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

    // Image number
    content.push(
      new Paragraph({
        text: `Image No.: ${globalIndex + 1}`,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
      }),
    );

    // Modified report: show only annotated image (or original if no annotation)
    try {
      // Check for pre-saved annotated image first
      const annotatedId = `${img.id}_annotated`;
      const savedAnnotated = imageStore.get(annotatedId);
      
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
        const originalBuffer = imageStore.get(img.id);
        if (!originalBuffer) throw new Error(`Image ${img.id} not found`);
        const annotated = await generateAnnotatedImage(originalBuffer, img.annotations);
        // Optimize annotated image
        const sharp = (await import("sharp")).default;
        imageBuffer = await sharp(annotated)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
      } else {
        // No annotations, use original image
        imageBuffer = await fetchImageBuffer(img.id);
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
          spacing: { after: 100 },
        }),
      );
    } catch (error) {
      content.push(
        new Paragraph({
          text: `[Error loading images: ${error instanceof Error ? error.message : "Unknown"}]`,
          alignment: AlignmentType.CENTER,
        }),
      );
    }

    // Assessment
    content.push(
      new Paragraph({
        text: `Assessment: ${img.comment || "No assessment available"}`,
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 200 },
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

async function fetchImageBuffer(imageId: string): Promise<Buffer> {
  // Fetch from imageStore (server-side storage)
  const buffer = imageStore.get(imageId);
  if (!buffer) throw new Error(`Image ${imageId} not found in store`);
  
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
