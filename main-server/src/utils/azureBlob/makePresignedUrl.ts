import {
  StorageSharedKeyCredential,
  ContainerSASPermissions,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import { extractConnectionStringParts } from './utils';
import { envs } from '../../configs/index';

export const getPresignedUrl = (url: string) => {
  const a = url.split('.blob.core.windows.net/');
  const containerAndBlob = a[1].split('/');
  const containerName = containerAndBlob[0];
  const blobName = containerAndBlob.slice(1).join('/');

  const { url: sameUrl, sasKey } = makePresignedUrl(containerName, blobName);

  return `${sameUrl}?${sasKey}`;
};

export const makePresignedUrl = (containerName: string, blobName: string) => {
  const { sasKey, url, accountName } = generateSasToken(
    envs.azureBlobConnStr,
    containerName,
    'r',
  );

  return {
    url: `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`,
    sasKey: `${sasKey}`,
  };
};

/*
permi   :  "c"
container: "images"
https://vidmuxtemp.blob.core.windows.net/tempbucket/rzp.csv
*/

function generateSasToken(
  connectionString: string,
  containerName: string,
  permissions: string,
) {
  const { accountKey, accountName, url } =
    extractConnectionStringParts(connectionString);

  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey,
  );

  const expiryDate = Date.now() + 20 * 60 * 1000;

  const sasKey = generateBlobSASQueryParameters(
    {
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
