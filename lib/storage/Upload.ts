import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3client as client } from "./client";
import { Readable } from "stream";

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

export async function getFileFromStorage(key: string) {
    const bucketName = 'intui-bucket';

    try {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key
        });

        const response = await client.send(command);

        // Convert the response Body (which is a ReadableStream) into a string
        const stream = response.Body as Readable;
        let data = "";

        for await (const chunk of stream) {
            data += chunk.toString();
        }

        return { status: 200, data };
    } catch (error) {
        console.error("Get file error:", error);
        return {
            status: 500,
            message: 'Error retrieving file from storage',
            error
        };
    }
}