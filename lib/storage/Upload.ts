import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3client as client } from "./client";

export async function uploadToStorage(key: string, body: any) {
    const bucketName = 'intui-bucket';
    const region = 'us-east-1';  // Replace with your actual region, e.g., 'us-east-1'

    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: body
        });

        const response = await client.send(command);
        
        if (response.$metadata.httpStatusCode === 404) {
            return {
                status: 404,
                message: 'Bucket not found'
            };
        }

        const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
        console.log(response);

        return { response, url };
    } catch (error) {
        console.error("Upload error:", error);
        return {
            status: 500,
            message: 'Error uploading to storage',
            error
        };
    }
}
