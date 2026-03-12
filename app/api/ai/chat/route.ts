import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages, model, apiKey, systemPrompt } = await req.json();

  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
    return new Response(JSON.stringify({ error: "A valid API key is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Messages array is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let aiModel;
  if (model === "gemini-2.0-flash" || model === "gemini-1.5-pro" || model === "gemini-2.5-pro") {
    const google = createGoogleGenerativeAI({ apiKey });
    aiModel = google(model);
  } else if (model === "grok-3" || model === "grok-3-mini" || model === "grok-2") {
    const xai = createXai({ apiKey });
    aiModel = xai(model);
  } else {
    // Default to gemini flash
    const google = createGoogleGenerativeAI({ apiKey });
    aiModel = google("gemini-2.0-flash");
  }

  const result = streamText({
    model: aiModel,
    system: systemPrompt ?? `You are an expert software engineer and technical interviewer.
You are helping a candidate debug and fix an incident (production bug). 
Be concise, ask probing questions to guide them towards the solution, and give hints rather than full answers unless they are stuck.
When code is shared, analyze it carefully and provide specific actionable feedback.`,
    messages,
  });

  return result.toTextStreamResponse();
}
