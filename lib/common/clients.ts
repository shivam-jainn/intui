import { Storage } from "@/lib/storage";

export const storage = new Storage({provider:"gcp",bucketName:process.env.GCP_BUCKET_NAME as string});
