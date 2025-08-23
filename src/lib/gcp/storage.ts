import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';

// Initialize GCP Storage
let storage: Storage;

try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    const credentials = JSON.parse(serviceAccountKey);
    storage = new Storage({
        credentials,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
} catch (error) {
    console.error('Failed to initialize GCP Storage:', error);
    throw new Error('Failed to initialize GCP Storage. Check your environment variables.');
}

const BUCKET_NAME = process.env.GCP_BUCKET_NAME ?? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-business-logos`;

export interface UploadResult {
    url: string;
    filename: string;
    size: number;
}

export interface DeleteResult {
    success: boolean;
    message: string;
}

/**
 * Upload a company logo to GCP bucket
 */
export async function uploadCompanyLogo(
    file: Buffer,
    originalName: string,
    businessId: string
): Promise<UploadResult> {
    try {
        const bucket = storage.bucket(BUCKET_NAME);

        // Generate unique filename
        const fileExtension = originalName.split('.').pop() ?? 'png';
        const filename = `business-logos/${businessId}/${randomUUID()}.${fileExtension}`;

        // Create file reference
        const fileRef = bucket.file(filename);

        // Upload file with metadata
        await fileRef.save(file, {
            metadata: {
                contentType: getContentType(fileExtension),
                metadata: {
                    businessId,
                    originalName,
                    uploadedAt: new Date().toISOString(),
                },
            },
        });

        // For uniform bucket-level access, we don't set individual file ACLs
        // Instead, we rely on bucket-level IAM policies for public access
        // The bucket should have a policy that allows public read access to all objects

        // Get public URL (assuming bucket is configured for public read access)
        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;

        return {
            url: publicUrl,
            filename,
            size: file.length,
        };
    } catch (error) {
        console.error('Error uploading company logo:', error);
        throw new Error('Failed to upload company logo');
    }
}

/**
 * Delete a company logo from GCP bucket
 */
export async function deleteCompanyLogo(filename: string): Promise<DeleteResult> {
    try {
        const bucket = storage.bucket(BUCKET_NAME);
        const fileRef = bucket.file(filename);

        // Check if file exists
        const [exists] = await fileRef.exists();
        if (!exists) {
            return {
                success: false,
                message: 'File not found',
            };
        }

        // Delete file
        await fileRef.delete();

        return {
            success: true,
            message: 'Logo deleted successfully',
        };
    } catch (error) {
        console.error('Error deleting company logo:', error);
        throw new Error('Failed to delete company logo');
    }
}

/**
 * Get content type based on file extension
 */
function getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
    };

    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * List all logos for a business
 */
export async function listBusinessLogos(businessId: string): Promise<string[]> {
    try {
        const bucket = storage.bucket(BUCKET_NAME);
        const [files] = await bucket.getFiles({
            prefix: `business-logos/${businessId}/`,
        });

        return files.map(file => file.name);
    } catch (error) {
        console.error('Error listing business logos:', error);
        throw new Error('Failed to list business logos');
    }
}

/**
 * Get logo metadata
 */
export async function getLogoMetadata(filename: string) {
    try {
        const bucket = storage.bucket(BUCKET_NAME);
        const fileRef = bucket.file(filename);

        const [metadata] = await fileRef.getMetadata();
        return metadata;
    } catch (error) {
        console.error('Error getting logo metadata:', error);
        throw new Error('Failed to get logo metadata');
    }
} 