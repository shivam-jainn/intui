"use server";
import { Storage } from "@google-cloud/storage";
import { Language, languageExtensions } from "../types/playground.types";

// Initialize GCP Storage client
const storage = new Storage({
  credentials: {
    type: process.env.GCP_TYPE,
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    private_key_id: process.env.GCP_PRIVATE_KEY_ID,
    project_id: process.env.GCP_PROJECT_ID,
    client_id: process.env.GCP_CLIENT_ID,
    universe_domain: process.env.GCP_UNIVERSE_DOMAIN,    
  },
});

const bucketName = process.env.GCP_BUCKET_NAME as string;
const bucket = storage.bucket(bucketName);

/**
 * Fetches the question description from GCP storage.
 * @param question_name - The name of the question (used to construct the file path).
 * @returns An object containing the question description as a string.
 */
export async function getDesc(question_name: string) {
  const desc_key_path = `${question_name}/Question.md`;

  try {
    // Download data from GCP storage
    const [fileBuffer] = await bucket.file(desc_key_path).download();

    // Convert Buffer to string
    const question_description_str = fileBuffer.toString("utf8");

    return {
      question_description: question_description_str,
    };
  } catch (error) {
    console.error("Error in getDesc:", error);
    throw new Error(`Failed to retrieve question description for ${question_name}`);
  }
}

/**
 * Fetches the driver code for a specific language from GCP storage.
 * @param question_name - The name of the question (used to construct the file path).
 * @param language - The programming language (e.g., "javascript", "python").
 * @returns An object containing the driver code as a string.
 */
export async function getDriver(question_name: string, language: Language) {
  const driver_key_path = `${question_name}/drivers/${language}/signature.${languageExtensions[language]}`;

  try {
    // Download data from GCP storage
    const [fileBuffer] = await bucket.file(driver_key_path).download();

    // Convert Buffer to string
    const driver_code_str = fileBuffer.toString("utf8");

    return {
      driver_code: driver_code_str,
    };
  } catch (error) {
    console.error("Error in getDriver:", error);
    throw new Error(`Failed to retrieve driver code for ${question_name} in ${language}`);
  }
}