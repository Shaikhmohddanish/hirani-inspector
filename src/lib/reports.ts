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

export async function generateNormalReport(images: ImageRecord[]): Promise<Buffer> {
  // Process images in batches to avoid memory issues with large datasets
  const BATCH_SIZE = 50;
  const sections = [];
  
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    const children = await buildNormalReportContent(batch, i);
    sections.push({ children });
  }

  const doc = new Document({ sections });
  return await Packer.toBuffer(doc);
}

export async function generateModifiedReport(images: ImageRecord[]): Promise<Buffer> {
  // Process images in batches to avoid memory issues with large datasets
  const BATCH_SIZE = 50;
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
      
      // Free up memory by releasing the buffer reference after conversion
      const base64Data = imageBuffer.toString("base64");

      content.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: "png",
              data: base64Data,
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
        imageBuffer = await sharp(savedAnnotated).png().toBuffer();
      } else if (img.annotations.length > 0) {
        // Generate annotated image on the fly
        const originalBuffer = await fetchImageBuffer(img.id);
        imageBuffer = await generateAnnotatedImage(originalBuffer, img.annotations);
      } else {
        // No annotations, use original image
        imageBuffer = await fetchImageBuffer(img.id);
      }

      const { width, height } = await getImageDimensions(imageBuffer);
      const scaled = scaleToFit(width, height, 15);
      
      // Convert to base64 and free buffer reference
      const base64Data = imageBuffer.toString("base64");

      content.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: "png",
              data: base64Data,
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
  const buffer = imageStore.get(imageId);
  if (!buffer) throw new Error(`Image ${imageId} not found in store`);
  
  // Convert to PNG for Word compatibility with optimized settings
  const sharp = (await import("sharp")).default;
  return await sharp(buffer)
    .png({
      compressionLevel: 6, // Balance between size and speed
      adaptiveFiltering: false, // Faster encoding
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
