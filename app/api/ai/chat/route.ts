import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createXai } from "@ai-sdk/xai";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "edge";

const GOOGLE_MODELS = new Set([
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-2.5-pro",
]);

const XAI_MODELS = new Set([
  "grok-3",
  "grok-3-mini",
  "grok-2",
]);

const GROQ_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
]);

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Failed to generate response.";
}

function getErrorStatus(error: unknown): number {
  if (error && typeof error === "object" && "statusCode" in error) {
    const statusCode = (error as { statusCode?: unknown }).statusCode;
    if (typeof statusCode === "number" && statusCode >= 400 && statusCode < 600) {
      return statusCode;
    }
  }

  return 500;
}

function isTextDeltaPart(part: unknown): part is { type: "text-delta"; text: string } {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    (part as { type?: unknown }).type === "text-delta" &&
    "text" in part &&
    typeof (part as { text?: unknown }).text === "string"
  );
}

function isErrorPart(part: unknown): part is { type: "error"; error: unknown } {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    (part as { type?: unknown }).type === "error" &&
    "error" in part
  );
}

export async function POST(req: NextRequest) {
  try {
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
    if (GOOGLE_MODELS.has(model)) {
      const google = createGoogleGenerativeAI({ apiKey: apiKey.trim() });
      aiModel = google(model);
    } else if (XAI_MODELS.has(model)) {
      const xai = createXai({ apiKey: apiKey.trim() });
      aiModel = xai(model);
    } else if (GROQ_MODELS.has(model)) {
      const groq = createGroq({ apiKey: apiKey.trim() });
      aiModel = groq(model);
    } else {
      // Default to gemini flash
      const google = createGoogleGenerativeAI({ apiKey: apiKey.trim() });
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

    const iterator = result.fullStream[Symbol.asyncIterator]();
    let firstPart: IteratorResult<unknown, void>;

    try {
      firstPart = await iterator.next();
    } catch (error) {
      const status = getErrorStatus(error);
      const message = getErrorMessage(error);
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!firstPart.done && isErrorPart(firstPart.value)) {
      const status = getErrorStatus(firstPart.value.error);
      const message = getErrorMessage(firstPart.value.error);
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          if (!firstPart.done) {
            if (isTextDeltaPart(firstPart.value) && firstPart.value.text) {
              controller.enqueue(encoder.encode(firstPart.value.text));
            }
          }

          while (true) {
            const part = await iterator.next();
            if (part.done) break;

            if (isErrorPart(part.value)) {
              const message = getErrorMessage(part.value.error);
              controller.enqueue(
                encoder.encode(`\n\n[Provider error: ${message}]`)
              );
              break;
            }

            if (isTextDeltaPart(part.value) && part.value.text) {
              controller.enqueue(encoder.encode(part.value.text));
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("AI chat request failed", error);
    return new Response(JSON.stringify({ error: "Failed to process chat request." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
