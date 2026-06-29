"use client";

import {
  Loader,
  PasswordInput,
  ScrollArea,
  Select,
} from "@mantine/core";
import { useAtom } from "jotai";
import {
  IconRobot,
  IconSend,
  IconUser,
  IconX,
  IconPaperclip,
  IconSparkles,
  IconSettings,
  IconTrash,
  IconPlayerStop,
  IconKey,
} from "@tabler/icons-react";
import React, { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@mantine/hooks";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import {
  activeFilePathAtom,
  fileContentsAtom,
  incidentFilesAtom,
} from "@/contexts/IncidentContext";
import { t } from "@/lib/incident-theme";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const MODEL_OPTIONS = [
  {
    group: "Google",
    items: [
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    ],
  },
  {
    group: "xAI",
    items: [
      { value: "grok-3", label: "Grok 3" },
      { value: "grok-3-mini", label: "Grok 3 Mini" },
      { value: "grok-2", label: "Grok 2" },
    ],
  },
  {
    group: "Groq",
    items: [
      { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
      { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    ],
  },
];

const PROVIDER_LINKS: Record<string, string> = {
  "gemini-2.0-flash": "https://aistudio.google.com/apikey",
  "gemini-2.5-pro": "https://aistudio.google.com/apikey",
  "gemini-1.5-pro": "https://aistudio.google.com/apikey",
  "grok-3": "https://console.x.ai",
  "grok-3-mini": "https://console.x.ai",
  "grok-2": "https://console.x.ai",
  "llama-3.3-70b-versatile": "https://console.groq.com/keys",
  "llama-3.1-8b-instant": "https://console.groq.com/keys",
  "mixtral-8x7b-32768": "https://console.groq.com/keys",
};

function getProvider(model: string): "google" | "xai" | "groq" {
  if (model.includes("llama") || model.includes("mixtral")) return "groq";
  if (model.startsWith("grok")) return "xai";
  return "google";
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: 4,
        animation: "fade-in-up 0.2s ease-out",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          flexDirection: isUser ? "row-reverse" : "row",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: t.radius.sm,
            background: isUser ? "rgba(148,163,184,0.1)" : t.accentMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isUser ? (
            <IconUser size={10} color={t.textDim} />
          ) : (
            <IconRobot size={10} color={t.accent} />
          )}
        </div>
        <span
          style={{
            fontSize: t.size.xs,
            color: t.textDim,
            fontFamily: t.font.mono,
          }}
        >
          {isUser ? "You" : "AI"}
        </span>
      </div>
      <div
        style={{
          maxWidth: "88%",
          padding: "8px 12px",
          borderRadius: isUser
            ? `${t.radius.xl}px ${t.radius.xl}px ${t.radius.sm}px ${t.radius.xl}px`
            : `${t.radius.xl}px ${t.radius.xl}px ${t.radius.xl}px ${t.radius.sm}px`,
          background: isUser ? "rgba(15,23,42,0.9)" : "rgba(17,24,39,0.9)",
          border: `1px solid ${
            isUser ? "rgba(148,163,184,0.1)" : t.accentBorder
          }`,
        }}
      >
        {isUser ? (
          <div
            style={{
              fontSize: t.size.base,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.6,
              color: t.textSecondary,
            }}
          >
            {message.content}
          </div>
        ) : (
          <div
            style={{
              fontSize: t.size.base,
              lineHeight: 1.65,
              wordBreak: "break-word",
              color: t.textSecondary,
            }}
            className="ai-response-markdown"
          >
            <Markdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {message.content}
            </Markdown>
          </div>
        )}
      </div>
    </div>
  );
}

interface AIChatPanelProps {
  incidentName: string;
  incidentReport: string;
}

export default function AIChatPanel({
  incidentName,
  incidentReport,
}: AIChatPanelProps) {
  const [files] = useAtom(incidentFilesAtom);
  const [activeFile] = useAtom(activeFilePathAtom);
  const [fileContents] = useAtom(fileContentsAtom);

  const [model, setModel] = useLocalStorage({
    key: "ai-chat-model",
    defaultValue: "gemini-2.0-flash",
  });
  const [apiKey, setApiKey] = useLocalStorage({
    key: `ai-api-key-${getProvider(model)}`,
    defaultValue: "",
  });

  function buildSystemPrompt() {
    return `You are an expert software engineer conducting a technical interview.
The candidate is debugging an incident called "${incidentName}".

Incident description:
${incidentReport}

Guide the candidate with probing questions. Give hints rather than direct answers unless they are stuck.
When they share code, analyze it carefully and point out specific issues.
Be concise and conversational.`;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const provider = getProvider(model);

  function getActiveCode(): string {
    if (!activeFile) return "";
    const fileData = files.find((f) => f.path === activeFile);
    return fileContents[activeFile] ?? fileData?.content ?? "";
  }

  function injectCode() {
    const code = getActiveCode();
    if (!code) return;
    const fileName = activeFile?.split("/").pop() ?? "code";
    setInput(
      (prev) =>
        `${prev ? prev + "\n\n" : ""}Here is my current \`${fileName}\`:\n\`\`\`\n${code}\n\`\`\``
    );
  }

  async function sendMessage() {
    if (!input.trim() || isLoading) return;
    if (!apiKey.trim()) {
      setShowSettings(true);
      setError("Please provide your API key first.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const chatMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: chatMessages,
          model,
          apiKey,
          systemPrompt: buildSystemPrompt(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      let streamedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamedText += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
          }
          return updated;
        });
      }

      const finalChunk = decoder.decode();
      if (finalChunk) {
        streamedText += finalChunk;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + finalChunk,
            };
          }
          return updated;
        });
      }

      const providerErrorMatch = streamedText.match(
        /\[Provider error:\s*([\s\S]+?)\]/
      );
      if (providerErrorMatch?.[1]) {
        setError(providerErrorMatch[1].trim());
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            const cleaned = last.content
              .replace(/\[Provider error:[\s\S]+?\]/g, "")
              .trim();
            if (!cleaned) updated.pop();
            else updated[updated.length - 1] = { ...last, content: cleaned };
          }
          return updated;
        });
        return;
      }

      if (!streamedText.trim()) {
        setError("Empty response. Check API key/model and try again.");
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setError("Request cancelled.");
      } else {
        setError(err.message || "Failed to get AI response.");
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }

  function stopStreaming() {
    abortControllerRef.current?.abort();
  }

  function clearChat() {
    setMessages([]);
    setError(null);
  }

  const keyLabel =
    provider === "google"
      ? "Google AI Studio API Key"
      : provider === "xai"
        ? "xAI API Key"
        : "Groq API Key";
  const keyPlaceholder =
    provider === "google"
      ? "google_xxxx"
      : provider === "xai"
        ? "xai_xxxx"
        : "groq_xxxx";

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "rgba(6,10,18,0.6)",
      }}
    >
      {/* Header */}
      <div className="incident-panel-header" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: t.radius.lg,
              background: t.accentMuted,
              border: `1px solid ${t.accentBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconSparkles size={12} color={t.accent} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: t.size.md,
                fontWeight: 600,
                color: t.textPrimary,
                lineHeight: 1,
              }}
            >
              AI Assistant
            </div>
            <div
              style={{
                fontSize: t.size.xs,
                color: t.textDim,
                fontFamily: t.font.mono,
                marginTop: 2,
              }}
            >
              Hints & guidance
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {isLoading && (
            <button
              type="button"
              onClick={stopStreaming}
              className="incident-btn incident-btn-ghost"
              style={{ padding: "4px 6px", color: "#f87171" }}
              title="Stop"
            >
              <IconPlayerStop size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={clearChat}
            className="incident-btn incident-btn-ghost"
            style={{ padding: "4px 6px" }}
            title="Clear chat"
          >
            <IconTrash size={12} />
          </button>
          <button
            type="button"
            onClick={() => setShowSettings((p) => !p)}
            className="incident-btn incident-btn-ghost"
            style={{
              padding: "4px 6px",
              background: showSettings ? t.accentMuted : "transparent",
              color: showSettings ? t.accent : t.textMuted,
            }}
            title="Settings"
          >
            <IconSettings size={12} />
          </button>
        </div>
      </div>

      {/* Settings panel (collapsible) */}
      {showSettings && (
        <div
          style={{
            padding: "8px 12px",
            borderBottom: `1px solid ${t.border}`,
            background: "rgba(10,15,30,0.5)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            animation: "fade-in 0.15s ease-out",
          }}
        >
          <Select
            size="xs"
            data={MODEL_OPTIONS ?? []}
            value={model}
            onChange={(v: string | null) => v && setModel(v)}
            styles={{
              input: {
                fontSize: t.size.sm,
                fontFamily: t.font.mono,
                background: "rgba(255,255,255,0.03)",
                borderColor: t.border,
              },
            }}
          />
          <PasswordInput
            size="xs"
            placeholder={keyPlaceholder}
            value={apiKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setApiKey(e.currentTarget.value)
            }
            styles={{
              label: { fontSize: t.size.xs, color: t.textDim },
              input: {
                fontSize: t.size.sm,
                fontFamily: t.font.mono,
                background: "rgba(255,255,255,0.03)",
                borderColor: t.border,
              },
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a
              href={PROVIDER_LINKS[model]}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: t.size.xs,
                color: t.accent,
                fontFamily: t.font.mono,
                textDecoration: "underline",
              }}
            >
              Get API key
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: apiKey ? t.success : t.error,
                }}
              />
              <span style={{ fontSize: t.size.xs, color: t.textDim, fontFamily: t.font.mono }}>
                {apiKey ? "Configured" : "Not set"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea
        flex={1}
        p="sm"
        viewportRef={scrollRef}
        style={{ flex: 1 }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
              padding: 20,
            }}
          >
            {!apiKey ? (
              <>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: t.radius.xl,
                    background: t.errorMuted,
                    border: `1px solid ${t.errorBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconKey size={22} color={t.error} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: t.size.base,
                      color: t.textSecondary,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    API Key Required
                  </div>
                  <div style={{ fontSize: t.size.sm, color: t.textDim, maxWidth: 200, lineHeight: 1.5 }}>
                    Add your {getProvider(model)} API key to use AI hints
                  </div>
                </div>
                <div style={{ width: "100%", maxWidth: 240, marginTop: 4 }}>
                  <PasswordInput
                    size="sm"
                    placeholder={keyPlaceholder}
                    value={apiKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setApiKey(e.currentTarget.value)
                    }
                    styles={{
                      input: {
                        fontSize: t.size.sm,
                        fontFamily: t.font.mono,
                        background: "rgba(255,255,255,0.03)",
                        borderColor: t.border,
                      },
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <a
                      href={PROVIDER_LINKS[model]}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: t.size.xs,
                        color: t.accent,
                        fontFamily: t.font.mono,
                        textDecoration: "underline",
                      }}
                    >
                      Get API key
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowSettings(true)}
                      style={{
                        fontSize: t.size.xs,
                        color: t.textDim,
                        fontFamily: t.font.mono,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline",
                      }}
                    >
                      More settings
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: t.radius.xl,
                    background: t.accentMuted,
                    border: `1px solid ${t.accentBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconRobot size={22} color={t.accent} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: t.size.base,
                      color: t.textSecondary,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Stuck on the bug?
                  </div>
                  <div style={{ fontSize: t.size.sm, color: t.textDim, maxWidth: 180, lineHeight: 1.5 }}>
                    Ask the AI for hints or attach your code for analysis
                  </div>
                </div>
                <button
                  type="button"
                  className="incident-btn incident-btn-primary"
                  onClick={() =>
                    setInput("Can you give me a hint about what the bug might be?")
                  }
                  style={{ marginTop: 4 }}
                >
                  Get a hint
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 0",
                  }}
                >
                  <Loader size={10} color="orange" />
                  <span
                    style={{
                      fontSize: t.size.sm,
                      color: t.textDim,
                      fontFamily: t.font.mono,
                    }}
                  >
                    Thinking...
                  </span>
                </div>
              )}
          </div>
        )}
        {error && (
          <div
            style={{
              marginTop: 8,
              padding: "6px 10px",
              borderRadius: t.radius.md,
              background: t.errorMuted,
              border: `1px solid ${t.errorBorder}`,
            }}
          >
            <span style={{ fontSize: t.size.xs, color: t.error, fontFamily: t.font.mono }}>
              {error}
            </span>
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div
        style={{
          padding: "8px 10px",
          borderTop: `1px solid ${t.border}`,
        }}
      >
        {activeFile && (
          <button
            type="button"
            className="incident-btn incident-btn-ghost"
            onClick={injectCode}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              marginBottom: 6,
              fontSize: t.size.xs,
              color: t.accent,
            }}
          >
            <IconPaperclip size={10} />
            Attach {activeFile.split("/").pop()}
          </button>
        )}
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the bug, request hints..."
            rows={2}
            style={{
              flex: 1,
              resize: "none",
              padding: "6px 10px",
              borderRadius: t.radius.md,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${t.border}`,
              color: t.textSecondary,
              fontSize: t.size.base,
              fontFamily: t.font.mono,
              outline: "none",
              lineHeight: 1.5,
              transition: `border-color ${t.transition.fast}`,
            }}
            onFocus={(e) => (e.target.style.borderColor = t.accentBorder)}
            onBlur={(e) => (e.target.style.borderColor = t.border)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!input.trim()}
            style={{
              width: 32,
              height: 32,
              borderRadius: t.radius.lg,
              background: input.trim() ? t.accentMuted : "rgba(255,255,255,0.03)",
              border: `1px solid ${input.trim() ? t.accentBorder : t.border}`,
              color: input.trim() ? t.accent : t.textDim,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() ? "pointer" : "not-allowed",
              flexShrink: 0,
              transition: `all ${t.transition.fast}`,
            }}
          >
            {isLoading ? (
              <Loader size={12} color="orange" />
            ) : (
              <IconSend size={12} />
            )}
          </button>
        </div>
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 9, color: t.textFaint, fontFamily: t.font.mono }}>
            Shift+Enter for newline
          </span>
        </div>
      </div>
    </div>
  );
}
