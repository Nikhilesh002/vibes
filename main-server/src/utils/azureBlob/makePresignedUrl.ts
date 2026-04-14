import {
  StorageSharedKeyCredential,
  ContainerSASPermissions,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { extractConnectionStringParts } from "./utils";
import { envs } from "../../configs/index";

export const getPresignedUrl = (url: string, permissions: string) => {
  const a = url.split(".blob.core.windows.net/");
  const containerAndBlob = a[1].split("/");
  const containerName = containerAndBlob[0];
  const blobName = containerAndBlob.slice(1).join("/");

  const { url: sameUrl, sasKey } = makePresignedUrl(
    containerName,
    blobName,
    permissions,
  );

  return `${sameUrl}?${sasKey}`;
};

export const makePresignedUrl = (
  containerName: string,
  blobName: string,
  permissions: string,
) => {
  const { sasKey, url, accountName } = generateSasToken(
    blobName,
    envs.azureBlobConnStr,
    containerName,
    permissions,
  );

  return {
    url: `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`,
    sasKey: `${sasKey}`,
  };
};

/**
 * Generate a read-only SAS token for streaming HLS video.
 * Returns just the query string (without '?') so the client can append it
 * to every HLS sub-request (playlists + segments).
 *
 * Expiry: 4 hours — long enough for a movie session, short enough that
 * shared tokens die quickly.
 */
export const getStreamingSasToken = (
  containerName: string,
  blobName: string,
): string => {
  const videoName =
    blobName.lastIndexOf(".") > -1
      ? blobName.substring(0, blobName.lastIndexOf("."))
      : blobName;
  const { sasKey } = generateSasToken(
    videoName + "/*",
    envs.azureBlobConnStr,
    containerName,
    "r",
    4 * 60 * 60 * 1000, // 4 hours
  );
  return sasKey;
};

function generateSasToken(
  blobName: string,
  connectionString: string,
  containerName: string,
  permissions: string,
  expiryMs: number = 20 * 60 * 1000,
) {
  const { accountKey, accountName, url } =
    extractConnectionStringParts(connectionString);

  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey,
  );

  const expiryDate = Date.now() + expiryMs;

  const sasKey = generateBlobSASQueryParameters(
    {
      blobName,
      containerName,
      permissions: ContainerSASPermissions.parse(permissions),
      expiresOn: new Date(expiryDate),
    },
    sharedKeyCredential,
  );

  return {
    sasKey: sasKey.toString(),
    url: url,
    accountName,
  };
}
