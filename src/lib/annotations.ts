"use server";

import sharp from "sharp";
import { AnnotationBox } from "@/store/useAppStore";

export async function generateAnnotatedImage(
  originalImageBuffer: Buffer,
  boxes: AnnotationBox[],
): Promise<Buffer> {
  // Load original image
  const image = sharp(originalImageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Create SVG overlay with yellow boxes
  const svgBoxes = boxes
    .map((box) => {
      const [x1, y1, x2, y2] = box.coords;
      const w = x2 - x1;
      const h = y2 - y1;
      return `<rect x="${x1}" y="${y1}" width="${w}" height="${h}" fill="none" stroke="yellow" stroke-width="6"/>`;
    })
    .join("\n");

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${svgBoxes}
    </svg>
  `;

  // Composite SVG overlay on original image
  const annotatedBuffer = await image
    .composite([
      {
        input: Buffer.from(svg),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  return annotatedBuffer;
}
