import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import config from '../config/index.js';
import fs from 'fs'; // For reading file streams if needed, or use Buffer directly
import path from 'path'; // For path manipulation if needed
import logger from '../utils/logger.js'; // Import shared logger

const { aws } = config;

// Ensure essential AWS S3 configurations are present
if (!aws.accessKeyId || !aws.secretAccessKey || !aws.s3BucketName || !aws.region) {
  logger.warn(
    'AWS S3 configuration is incomplete (accessKeyId, secretAccessKey, s3BucketName, region are required). S3Service may not function.'
  );
  // In a production scenario where S3 is critical, you might throw an error here:
  // throw new Error('AWS S3 configuration is incomplete.');
}

let s3Client;
if (aws.accessKeyId && aws.secretAccessKey && aws.region) {
  s3Client = new S3Client({
    region: aws.region,
    credentials: {
      accessKeyId: aws.accessKeyId,
      secretAccessKey: aws.secretAccessKey,
    },
  });
} else {
  // s3Client will be undefined, functions below will fail if called.
  logger.error("S3Client could not be initialized due to missing AWS credentials or region.");
}


/**
 * Uploads a file to AWS S3.
 * @param {Buffer|ReadableStream} fileBufferOrStream - The file content as a Buffer or a ReadableStream.
 * @param {string} bucketName - The S3 bucket name.
 * @param {string} key - The desired key (path/filename) for the object in S3.
 * @param {string} contentType - The MIME type of the file (e.g., 'image/jpeg', 'image/png').
 * @returns {Promise<object>} The response from S3's PutObjectCommand. Includes ETag and VersionId.
 * @throws {Error} If the S3 client is not initialized or upload fails.
 */
async function uploadFile(fileBufferOrStream, bucketName, key, contentType) {
  if (!s3Client) {
    throw new Error('S3 client is not initialized. Check AWS configuration.');
  }
  if (!bucketName) {
    throw new Error('S3 bucket name is not provided or configured.');
  }

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileBufferOrStream,
    ContentType: contentType,
    // ACL: 'public-read', // Uncomment if you want objects to be publicly readable by default
                           // It's often better to manage bucket policies or CloudFront for public access.
  };

  try {
    const command = new PutObjectCommand(params);
    const data = await s3Client.send(command);
    logger.info({ bucket: bucketName, key }, `File uploaded successfully to S3`);
    return data; // Contains ETag, VersionId etc.
  } catch (error) {
    logger.error({ err: error, bucket: bucketName, key }, `Error uploading file to S3`);
    throw error;
  }
}

/**
 * Generates a public URL for an S3 object, typically via CloudFront if configured,
 * or directly to S3 if CloudFront isn't used (less ideal for CDN purposes).
 * @param {string} key - The S3 object key.
 * @param {string} bucketName - The S3 bucket name.
 * @returns {string} The public URL.
 */
function getPublicUrl(key, bucketName) {
  if (config.aws.cloudfrontDistributionId) {
    // Assuming the CloudFront distribution points to the S3 bucket root or a specific path
    // You might need to adjust this if CloudFront has a path prefix for your S3 objects
    return `https://${config.aws.cloudfrontDistributionId}.cloudfront.net/${key}`;
  }
  // Fallback to S3 public URL (requires object ACL to be public-read or bucket policy allowing public access)
  // Note: S3 path-style URLs (bucket.s3.region.amazonaws.com/key) are being deprecated for new buckets.
  // Virtual-hosted style (bucket.s3-aws-region.amazonaws.com/key or bucket.s3.amazonaws.com/key for us-east-1) is preferred.
  // This URL construction might need adjustment based on your bucket region and settings.
  // It's generally better to use CloudFront.
  if (!aws.region || !bucketName) {
      logger.warn({ key, bucketName }, "Cannot generate S3 public URL without region and bucket name properly configured.");
      return `s3://${bucketName || 'unknown-bucket'}/${key}`; // Placeholder
  }

  // Example for virtual-hosted style (adjust if your region uses a different format)
  // For us-east-1, the region part is sometimes omitted: `https://${bucketName}.s3.amazonaws.com/${key}`
  // For other regions: `https://${bucketName}.s3.${aws.region}.amazonaws.com/${key}`
  const s3Hostname = aws.region === 'us-east-1' ? `s3.amazonaws.com` : `s3.${aws.region}.amazonaws.com`;
  return `https://${bucketName}.${s3Hostname}/${key}`;
}


export default {
  uploadFile,
  getPublicUrl,
  s3Client // Expose client if needed for more complex operations
};
