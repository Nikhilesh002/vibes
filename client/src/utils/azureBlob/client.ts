import { BlockBlobClient, AnonymousCredential } from "@azure/storage-blob";

export const getBlobSASClient = (url: string) => {
  return new BlockBlobClient(url, new AnonymousCredential());
};
