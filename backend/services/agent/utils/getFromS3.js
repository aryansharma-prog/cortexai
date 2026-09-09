import { isS3Configured } from "./fileStorage.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../config/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const getFromS3 = async (filename, expiresIn = 600) => {
  const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:8000";
  const localUrl = `${gatewayUrl}/api/agent/downloads/${encodeURIComponent(filename)}`;

  if (!isS3Configured()) {
    return localUrl;
  }

  try {
    return await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: filename
      }),
      { expiresIn }
    );
  } catch (error) {
    console.warn("[getFromS3 Warning] S3 presigned URL failed, using local URL:", error.message);
    return localUrl;
  }
};