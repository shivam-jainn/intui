"use server";
import { getStorage } from "@/lib/storage";
import { Language, languageExtensions } from "../types/playground.types";

const storage = getStorage();

/**
 * Fetches the question description from storage.
 * @param question_name - The name of the question (used to construct the file path).
 * @returns An object containing the question description as a string.
 */
export async function getDesc(question_name: string) {
  const desc_key_path = `${question_name}/Question.md`;

  try {
    const fileBuffer = await storage.download(desc_key_path);

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
 * Fetches the driver code for a specific language from storage.
 * @param question_name - The name of the question (used to construct the file path).
 * @param language - The programming language (e.g., "javascript", "python").
 * @returns An object containing the driver code as a string.
 */
export async function getDriver(question_name: string, language: Language) {
  const driver_key_path = `${question_name}/drivers/${language}/signature.${languageExtensions[language]}`;

  try {
    const fileBuffer = await storage.download(driver_key_path);

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