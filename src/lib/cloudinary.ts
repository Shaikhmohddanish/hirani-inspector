"use server";

import { v2 as cloudinary } from 'cloudinary';
import { getCldImageUrl } from 'next-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FOLDER = 'hirani-inspector';

export async function uploadToCloudinary(imageId: string, buffer: Buffer): Promise<string> {
  console.log(`Cloudinary config:`, {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    has_api_key: !!process.env.CLOUDINARY_API_KEY,
    has_api_secret: !!process.env.CLOUDINARY_API_SECRET,
  });
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: `${FOLDER}/${imageId}`,
        resource_type: 'image',
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          console.log('Cloudinary upload success:', result?.secure_url);
          resolve(result!.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export async function getFromCloudinary(imageId: string): Promise<Buffer> {
  // Use next-cloudinary to get optimized URL
  const publicId = `${FOLDER}/${imageId}`;
  console.log(`Fetching from Cloudinary with public_id: ${publicId}`);
  
  const url = getCldImageUrl({
    src: publicId,
    width: 1200,
    height: 1200,
    crop: 'limit',
    quality: 'auto',
    format: 'auto',
  });
  
  console.log(`Generated Cloudinary URL: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch ${publicId}: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to fetch image from Cloudinary: ${response.statusText}`);
  }
  
  console.log(`Successfully fetched ${publicId}`);
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteFromCloudinary(imageId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(`${FOLDER}/${imageId}`);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
}

export async function deleteAllFromCloudinary(): Promise<{ deleted: number; errors: number }> {
  try {
    console.log(`Deleting all images from folder: ${FOLDER}`);
    
    // Delete all resources in the folder
    const result = await cloudinary.api.delete_resources_by_prefix(FOLDER, {
      resource_type: 'image',
    });
    
    const deleted = Object.keys(result.deleted || {}).length;
    const errors = Object.keys(result.deleted_counts || {}).filter(
      key => result.deleted[key] !== 'deleted'
    ).length;
    
    console.log(`Deleted ${deleted} images, ${errors} errors`);
    
    // Also try to delete the folder itself (might be empty now)
    try {
      await cloudinary.api.delete_folder(FOLDER);
      console.log(`Deleted folder: ${FOLDER}`);
    } catch (folderError) {
      // Folder might not be empty or already deleted, ignore
    }
    
    return { deleted, errors };
  } catch (error) {
    console.error('Error deleting all from Cloudinary:', error);
    throw error;
  }
}

// Store metadata as base64-encoded context (persists with the image)
export async function storeMetadataCloudinary(imageId: string, metadata: any): Promise<void> {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Encode metadata as base64 to avoid special character issues
      const metadataStr = Buffer.from(JSON.stringify(metadata)).toString('base64');
      
      await cloudinary.uploader.explicit(`${FOLDER}/${imageId}`, {
        type: 'upload',
        context: `metadata=${metadataStr}`,
      });
      
      console.log(`Stored metadata for ${imageId}`);
      return; // Success!
    } catch (error: any) {
      const isNotFound = error?.http_code === 404 || error?.message?.includes('not found');
      
      if (isNotFound && attempt < maxRetries) {
        // Image might still be uploading, wait and retry
        console.log(`Image ${imageId} not found yet, waiting... (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        continue;
      }
      
      console.error('Error storing metadata:', error);
      throw error;
    }
  }
}

export async function getMetadataCloudinary(imageId: string): Promise<any | null> {
  try {
    const result = await cloudinary.api.resource(`${FOLDER}/${imageId}`, {
      context: true,
    });
    
    if (result.context?.metadata) {
      // Decode base64 metadata
      const metadataStr = Buffer.from(result.context.metadata, 'base64').toString('utf-8');
      const metadata = JSON.parse(metadataStr);
      console.log(`Retrieved metadata for ${imageId}`);
      return metadata;
    }
    
    console.log(`No metadata found for ${imageId}`);
    return null;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}
