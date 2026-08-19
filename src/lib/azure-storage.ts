import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
  SASProtocol,
} from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
export const AZURE_CONTAINER_NAME =
  process.env.AZURE_STORAGE_CONTAINER_NAME || "nutopass-uploads";

/**
 * Checks if Azure Blob Storage credentials are configured in environment variables.
 */
export function isAzureStorageConfigured(): boolean {
  return !!(
    process.env.AZURE_STORAGE_CONNECTION_STRING ||
    (process.env.AZURE_STORAGE_ACCOUNT_NAME &&
      process.env.AZURE_STORAGE_ACCOUNT_KEY)
  );
}

/**
 * Gets or creates a BlobServiceClient singleton instance.
 */
let blobServiceClientInstance: BlobServiceClient | null = null;

export function getBlobServiceClient(): BlobServiceClient {
  if (blobServiceClientInstance) {
    return blobServiceClientInstance;
  }

  if (connectionString) {
    blobServiceClientInstance =
      BlobServiceClient.fromConnectionString(connectionString);
    return blobServiceClientInstance;
  }

  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

  if (accountName && accountKey) {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );
    blobServiceClientInstance = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
    return blobServiceClientInstance;
  }

  throw new Error("Azure Blob Storage credentials are not configured.");
}

/**
 * Extracts storage account name and key from the connection string or env vars.
 */
function getAccountCredentials(): { accountName: string; accountKey: string } {
  if (connectionString) {
    const matchName = connectionString.match(/AccountName=([^;]+)/);
    const matchKey = connectionString.match(/AccountKey=([^;]+)/);
    if (matchName && matchKey) {
      return { accountName: matchName[1], accountKey: matchKey[1] };
    }
  }

  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

  if (accountName && accountKey) {
    return { accountName, accountKey };
  }

  throw new Error("Unable to parse Azure Storage account name and key.");
}

/**
 * Sanitizes a filename for storage.
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/__+/g, "_")
    .substring(0, 100);
}

/**
 * Generates a direct write SAS upload URL for the browser.
 * Valid for 15 minutes.
 */
export async function generateBlobUploadSas({
  fileName,
  category,
  orgId = "default",
  contentType,
}: {
  fileName: string;
  category: string;
  orgId?: string;
  contentType?: string;
}): Promise<{
  uploadUrl: string;
  blobPath: string;
  filePath: string;
  containerName: string;
}> {
  const { accountName, accountKey } = getAccountCredentials();
  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey
  );

  const safeFilename = `${uuidv4()}-${sanitizeFilename(fileName)}`;
  // Blob path within container: e.g. "org_123/materials/uuid-filename.pdf" or "default/materials/uuid-filename.pdf"
  const blobPath = `${orgId}/${category}/${safeFilename}`;

  const startsOn = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes clock skew tolerance
  const expiresOn = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

  const sasPermissions = new BlobSASPermissions();
  sasPermissions.write = true;
  sasPermissions.create = true;
  sasPermissions.add = true;

  const sasQueryParams = generateBlobSASQueryParameters(
    {
      containerName: AZURE_CONTAINER_NAME,
      blobName: blobPath,
      permissions: sasPermissions,
      startsOn,
      expiresOn,
      protocol: SASProtocol.HttpsAndHttp,
      contentType: contentType || undefined,
    },
    sharedKeyCredential
  );

  const uploadUrl = `https://${accountName}.blob.core.windows.net/${AZURE_CONTAINER_NAME}/${blobPath}?${sasQueryParams.toString()}`;

  // Internal route path that preserves your existing RBAC handling
  const filePath = `/api/files/${category}/${orgId}/${safeFilename}`;

  return {
    uploadUrl,
    blobPath,
    filePath,
    containerName: AZURE_CONTAINER_NAME,
  };
}

/**
 * Generates a temporary read SAS download URL for an authorized user.
 * Valid for 15 minutes.
 */
export async function generateBlobReadSas({
  blobPath,
  expiresInMinutes = 15,
  downloadName,
}: {
  blobPath: string;
  expiresInMinutes?: number;
  downloadName?: string;
}): Promise<string> {
  const { accountName, accountKey } = getAccountCredentials();
  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey
  );

  const startsOn = new Date(Date.now() - 2 * 60 * 1000);
  const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const sasPermissions = new BlobSASPermissions();
  sasPermissions.read = true;

  const sasQueryParams = generateBlobSASQueryParameters(
    {
      containerName: AZURE_CONTAINER_NAME,
      blobName: blobPath,
      permissions: sasPermissions,
      startsOn,
      expiresOn,
      protocol: SASProtocol.HttpsAndHttp,
      contentDisposition: downloadName
        ? `inline; filename="${encodeURIComponent(downloadName)}"`
        : undefined,
    },
    sharedKeyCredential
  );

  return `https://${accountName}.blob.core.windows.net/${AZURE_CONTAINER_NAME}/${blobPath}?${sasQueryParams.toString()}`;
}

/**
 * Deletes a blob from Azure Blob Storage if needed.
 */
export async function deleteBlobFromStorage(blobPath: string): Promise<boolean> {
  try {
    const serviceClient = getBlobServiceClient();
    const containerClient = serviceClient.getContainerClient(AZURE_CONTAINER_NAME);
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.deleteIfExists();
    return true;
  } catch (error) {
    console.error("Failed to delete blob from Azure Storage:", error);
    return false;
  }
}
