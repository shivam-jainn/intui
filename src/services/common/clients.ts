import { Storage } from "../storage";

export const storage = new Storage
    (
        {
            provider: "gcp",
            bucketName: process.env.GCP_BUCKET_NAME as string,
            credentials: {
                type: process.env.GCP_TYPE as string,
                project_id: process.env.GCP_PROJECT_ID as string,
                private_key_id: process.env.GCP_PRIVATE_KEY_ID as string,
                private_key: (process.env.GCP_PRIVATE_KEY as string)?.replace(/\\n/g, "\n"),
                client_email: process.env.GCP_CLIENT_EMAIL as string,
                client_id: process.env.GCP_CLIENT_ID as string,
                auth_uri: process.env.GCP_AUTH_URI as string,
                token_uri: process.env.GCP_TOKEN_URI as string,
                auth_provider_x509_cert_url: process.env.GCP_AUTH_PROVIDER_X509_CERT_URL as string,
                client_x509_cert_url: process.env.GCP_CLIENT_X509_CERT_URL as string,
                universe_domain: process.env.GCP_UNIVERSE_DOMAIN as string
            }
        }
    );
