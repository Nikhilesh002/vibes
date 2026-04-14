/**
 * Upload a file to Azure Blob Storage using a SAS URL.
 *
 * Replaces the full @azure/storage-blob SDK (~340KB bundled) with a single
 * fetch PUT — the Azure Blob REST API accepts this natively with a SAS token.
 */
export async function uploadBlobWithSAS(
  sasUrl: string,
  file: File,
  metadata?: Record<string, string>,
): Promise<void> {
  const headers: Record<string, string> = {
    'x-ms-blob-type': 'BlockBlob',
    'Content-Type': file.type || 'application/octet-stream',
  };

  // Azure Blob metadata is passed as x-ms-meta-{key} headers
  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      headers[`x-ms-meta-${key}`] = value;
    }
  }

  const response = await fetch(sasUrl, {
    method: 'PUT',
    headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Blob upload failed: ${response.status} ${response.statusText}`);
  }
}
