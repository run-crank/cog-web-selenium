import * as grpc from 'grpc';
// import { Cluster } from 'puppeteer-driver';
import { CogServiceService as CogService } from '../proto/cog_grpc_pb';
import { Cog } from './cog';
import { ClientWrapper } from '../client/client-wrapper';

const { DefaultAzureCredential } = require('@azure/identity');
const { BlobServiceClient } = require('@azure/storage-blob');

const server = new grpc.Server();
const port = process.env.PORT || 28866;
const host = process.env.HOST || '0.0.0.0';
const seleniumHubHost = process.env.SELENIUM_HUB_HOST || '0.0.0.0';
const azureTenantId = process.env.AZURE_TENANT_ID || null;
const azureClientId = process.env.AZURE_CLIENT_ID || null;
const azureClientSecret = process.env.AZURE_CLIENT_SECRET || null;
const azureStorageAccount = process.env.AZURE_BLOB_STORAGE_ACCOUNT || null;
const azureContainerName = process.env.AZURE_BLOB_STORAGE_CONTAINER || null;
let blobContainerClient;
let credentials: grpc.ServerCredentials;

if (process.env.USE_SSL) {
  credentials = grpc.ServerCredentials.createSsl(
    Buffer.from(process.env.SSL_ROOT_CRT, 'base64'), [{
      cert_chain: Buffer.from(process.env.SSL_CRT, 'base64'),
      private_key: Buffer.from(process.env.SSL_KEY, 'base64'),
    }],
    true,
  );
} else {
  credentials = grpc.ServerCredentials.createInsecure();
}

if (azureTenantId && azureClientId && azureClientSecret && azureStorageAccount && azureContainerName) {
  const defaultAzureCredential = new DefaultAzureCredential();

  const blobServiceClient = new BlobServiceClient(
    `https://${azureStorageAccount}.blob.core.windows.net`,
    defaultAzureCredential,
  );

  blobContainerClient = blobServiceClient.getContainerClient(azureContainerName);
}

server.addService(CogService, new Cog(ClientWrapper, {}, blobContainerClient, seleniumHubHost));
server.bind(`${host}:${port}`, credentials);
server.start();
console.log(`Server started, listening: ${host}:${port}`);

// Export server for testing.
export default server;
