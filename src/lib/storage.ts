"use server";

import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Use /tmp directory for Vercel serverless functions
const STORAGE_DIR = "/tmp/image-storage";

// Ensure storage directory exists
async function ensureStorageDir() {
  if (!existsSync(STORAGE_DIR)) {
    await mkdir(STORAGE_DIR, { recursive: true });
  }
}

export async function storeImage(id: string, buffer: Buffer): Promise<void> {
  await ensureStorageDir();
  const filePath = path.join(STORAGE_DIR, `${id}.bin`);
  await writeFile(filePath, buffer);
}

export async function getImage(id: string): Promise<Buffer | null> {
  const filePath = path.join(STORAGE_DIR, `${id}.bin`);
  if (!existsSync(filePath)) {
    return null;
  }
  return await readFile(filePath);
}

export async function storeMetadata(id: string, metadata: any): Promise<void> {
  await ensureStorageDir();
  const filePath = path.join(STORAGE_DIR, `${id}_metadata.json`);
  await writeFile(filePath, JSON.stringify(metadata));
}

export async function getMetadata(id: string): Promise<any | null> {
  const filePath = path.join(STORAGE_DIR, `${id}_metadata.json`);
  if (!existsSync(filePath)) {
    return null;
  }
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content);
}

export async function deleteImage(id: string): Promise<void> {
  const imagePath = path.join(STORAGE_DIR, `${id}.bin`);
  const metadataPath = path.join(STORAGE_DIR, `${id}_metadata.json`);
  const annotatedPath = path.join(STORAGE_DIR, `${id}_annotated.bin`);
  
  try {
    if (existsSync(imagePath)) await unlink(imagePath);
    if (existsSync(metadataPath)) await unlink(metadataPath);
    if (existsSync(annotatedPath)) await unlink(annotatedPath);
  } catch (error) {
    console.error("Error deleting image:", error);
  }
}

export async function storeAnnotatedImage(id: string, buffer: Buffer): Promise<void> {
  await ensureStorageDir();
  const filePath = path.join(STORAGE_DIR, `${id}_annotated.bin`);
  await writeFile(filePath, buffer);
}

export async function getAnnotatedImage(id: string): Promise<Buffer | null> {
  const filePath = path.join(STORAGE_DIR, `${id}_annotated.bin`);
  if (!existsSync(filePath)) {
    return null;
  }
  return await readFile(filePath);
}
