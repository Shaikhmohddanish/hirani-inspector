"use server";

import { 
  uploadToCloudinary, 
  getFromCloudinary, 
  deleteFromCloudinary,
  deleteAllFromCloudinary,
  storeMetadataCloudinary,
  getMetadataCloudinary
} from './cloudinary';

export async function storeImage(id: string, buffer: Buffer): Promise<void> {
  await uploadToCloudinary(id, buffer);
}

export async function getImage(id: string): Promise<Buffer | null> {
  try {
    return await getFromCloudinary(id);
  } catch (error) {
    console.error(`Error fetching image ${id}:`, error);
    return null;
  }
}

export async function storeMetadata(id: string, metadata: any): Promise<void> {
  await storeMetadataCloudinary(id, metadata);
}

export async function getMetadata(id: string): Promise<any | null> {
  return await getMetadataCloudinary(id);
}

export async function deleteImage(id: string): Promise<void> {
  await deleteFromCloudinary(id);
  await deleteFromCloudinary(`${id}_annotated`);
}

export async function storeAnnotatedImage(id: string, buffer: Buffer): Promise<void> {
  await uploadToCloudinary(`${id}_annotated`, buffer);
}

export async function getAnnotatedImage(id: string): Promise<Buffer | null> {
  try {
    return await getFromCloudinary(`${id}_annotated`);
  } catch (error) {
    return null;
  }
}

export async function deleteAllImages(): Promise<{ deleted: number; errors: number }> {
  return await deleteAllFromCloudinary();
}
