import { S3Client } from "@aws-sdk/client-s3";

export const s3client = new S3Client({
    endpoint: "http://localhost:4566", 
    region: "us-east-1",              
    forcePathStyle: true,
});


