import { Storage } from "./Storage";
export { Storage };
export { AwsStorage } from "./providers/aws";
export { GcpStorage } from "./providers/gcp";
export { FsStorage } from "./providers/fs";

let storageInstance: Storage | null = null;

export function getStorage(): Storage {
  if (storageInstance) return storageInstance;

  const mode = (process.env.ENV_MODE || process.env.NODE_ENV || "").toLowerCase();
  const isDev = mode === "development";
  const provider = isDev ? "fs" : ((process.env.STORAGE_PROVIDER as "aws" | "gcp") || "gcp");

  if (provider === "fs") {
    storageInstance = new Storage({
      provider: "fs",
      baseDir: process.env.FS_DATA_PATH || process.cwd(),
    });
  } else if (provider === "gcp") {
    const bucketName = process.env.GCP_BUCKET_NAME || "";
    storageInstance = new Storage({
      provider: "gcp",
      bucketName,
      credentials: {
        type: process.env.GCP_TYPE || "",
        project_id: process.env.GCP_PROJECT_ID || "",
        private_key_id: process.env.GCP_PRIVATE_KEY_ID || "",
        private_key: (process.env.GCP_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
        client_email: process.env.GCP_CLIENT_EMAIL || "",
        client_id: process.env.GCP_CLIENT_ID || "",
        auth_uri: process.env.GCP_AUTH_URI || "",
        token_uri: process.env.GCP_TOKEN_URI || "",
        auth_provider_x509_cert_url: process.env.GCP_AUTH_PROVIDER_X509_CERT_URL || "",
        client_x509_cert_url: process.env.GCP_CLIENT_X509_CERT_URL || "",
        universe_domain: process.env.GCP_UNIVERSE_DOMAIN || "",
      },
    });
  } else {
    // Basic AWS setup if needed, or throw if not configured
    storageInstance = new Storage({
      provider: "aws",
      bucketName: process.env.AWS_BUCKET_NAME || "",
    });
  }

  return storageInstance;
}


