import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../config/s3.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const downloadsDir = path.join(__dirname, "../temp/downloads");

// Ensure local downloads directory exists
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

/**
 * Checks if real (non-placeholder) AWS S3 credentials are provided.
 */
export const isS3Configured = () => {
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;
  const bucket = process.env.AWS_BUCKET_NAME;

  if (!accessKey || !secretKey || !bucket) return false;

  const placeholderRegex = /add\s|placeholder|your\s/i;
  if (placeholderRegex.test(accessKey) || placeholderRegex.test(secretKey) || placeholderRegex.test(bucket)) {
    return false;
  }

  return true;
};

/**
 * Saves a binary buffer either to S3 (if configured) or local storage as a fallback,
 * returning a valid view/download URL.
 */
export const saveFileAndGetUrl = async (filename, buffer, contentType = "application/octet-stream") => {
  const safeFilename = path.basename(filename);

  // 1. Always write to local storage first to ensure offline/dev availability
  const localFilePath = path.join(downloadsDir, safeFilename);
  fs.writeFileSync(localFilePath, buffer);

  const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:8000";
  const localDownloadUrl = `${gatewayUrl}/api/agent/downloads/${encodeURIComponent(safeFilename)}`;

  // 2. If S3 is fully configured, attempt upload
  if (isS3Configured()) {
    try {
      const bucketName = process.env.AWS_BUCKET_NAME;
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: safeFilename,
          Body: buffer,
          ContentType: contentType
        })
      );

      const presignedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: bucketName,
          Key: safeFilename
        }),
        { expiresIn: 24 * 60 * 60 } // 24 hours
      );

      return presignedUrl;
    } catch (s3Error) {
      console.warn("[S3 Upload Warning] S3 upload failed, falling back to local download URL:", s3Error.message);
      return localDownloadUrl;
    }
  }

  return localDownloadUrl;
};
