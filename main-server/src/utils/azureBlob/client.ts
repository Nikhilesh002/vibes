import { BlobServiceClient } from "@azure/storage-blob";
import { envs } from "../../configs";

// Create the BlobServiceClient object with connection string
export const blobServiceClient = BlobServiceClient.fromConnectionString(
  envs.azureBlobConnStr
);
