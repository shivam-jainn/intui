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
  } catch (error: any) {
    console.error("Error in getDesc:", error);
    if (error.code === 'ENOENT' || error.status === 404) {
      throw new Error(`Question "${question_slug}" not found. Please check the question URL.`);
    } else if (error.code === 'EACCES' || error.status === 403) {
      throw new Error(`Access denied to question "${question_slug}". Please contact support.`);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error("Unable to connect to storage service. Please check your internet connection.");
    } else {
      throw new Error(`Failed to load question description for "${question_slug}". Please try again later.`);
    }
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
  } catch (error: any) {
    console.error("Error in getDriver:", error);
    if (error.code === 'ENOENT' || error.status === 404) {
      throw new Error(`Starter code for ${language} not found for question "${question_slug}".`);
    } else if (error.code === 'EACCES' || error.status === 403) {
      throw new Error(`Access denied to starter code for ${language}. Please contact support.`);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error("Unable to connect to storage service. Please check your internet connection.");
    } else {
      throw new Error(`Failed to load starter code for ${language}. Please try again later.`);
    }
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
  } catch (error: any) {
    console.error("Error in getTestCases:", error);
    if (error.code === 'ENOENT' || error.status === 404) {
      console.warn(`Test cases not found for question "${question_slug}". Using empty test cases.`);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.warn("Unable to connect to storage service for test cases.");
    } else {
      console.warn(`Failed to load test cases for "${question_slug}".`);
    }
    return [];
  }
}
