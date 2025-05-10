import { S3Client } from "@aws-sdk/client-s3";
import { envs } from "../../configs";

export const s3Client = new S3Client({
  region: envs.awsRegion,
  endpoint: envs.awsEndpointUrl,
  credentials: {
    accessKeyId: envs.accessKeyId,
    secretAccessKey: envs.secretAccessKey,
  },
});
