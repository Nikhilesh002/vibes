import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "./client";

export const makePreSignedUrl = async (bucketName: string, key: string) => {
  const command = new PutObjectCommand({ Bucket: bucketName, Key: key });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 20 * 60 });

  return url;
};
