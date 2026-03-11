"use server";
import { getStorage } from "@/lib/storage";
import { Language, languageExtensions } from "../types/playground.types";

const storage = getStorage();
console.log("Storage instance created in desc_and_driver.ts:", storage);
/**
 * Fetches the question description from storage.
 * @param question_slug - The slug of the question (used to construct the file path).
 * @returns An object containing the question description as a string.
 */
export async function getDesc(question_slug: string) {
  const desc_key_path = `questions/${question_slug}/Question.md`;

  try {
    const fileBuffer = await storage.download(desc_key_path);

    // Convert Buffer to string
    const question_description_str = fileBuffer.toString("utf8");

    return {
      question_description: question_description_str,
    };
  } catch (error) {
    console.error("Error in getDesc:", error);
    throw new Error(`Failed to retrieve question description for ${question_slug}`);
  }
}

/**
 * Fetches the driver code for a specific language from storage.
 * @param question_slug - The slug of the question (used to construct the file path).
 * @param language - The programming language (e.g., "javascript", "python").
 * @returns An object containing the driver code as a string.
 */
export async function getDriver(question_slug: string, language: Language) {
  const driver_key_path = `questions/${question_slug}/drivers/${language}/signature.${languageExtensions[language]}`;

  try {
    const fileBuffer = await storage.download(driver_key_path);

    // Convert Buffer to string
    const driver_code_str = fileBuffer.toString("utf8");

    return {
      driver_code: driver_code_str,
    };
  } catch (error) {
    console.error("Error in getDriver:", error);
    throw new Error(`Failed to retrieve driver code for ${question_slug} in ${language}`);
  }
}
/**
 * Fetches the test cases for a specific question from storage.
 * @param question_slug - The slug of the question.
 * @returns An array of test case strings.
 */
export async function getTestCases(question_slug: string) {
  const testcases_path = `questions/${question_slug}/testcases.txt`;

  try {
    const fileBuffer = await storage.download(testcases_path);
    const content = fileBuffer.toString("utf8");
    
    // Split by lines and remove empty ones
    return content.split("\n").filter(line => line.trim() !== "");
  } catch (error) {
    console.error("Error in getTestCases:", error);
    return [];
  }
}
