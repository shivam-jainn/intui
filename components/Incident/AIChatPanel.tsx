"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  PasswordInput,
  ScrollArea,
  Select,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { useAtom } from "jotai";
import {
  activeFilePathAtom,
  fileContentsAtom,
  incidentFilesAtom,
} from "@/contexts/IncidentContext";
import {
  IconBrandGoogleFilled,
  IconRobot,
  IconSend,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import React, { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@mantine/hooks";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

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
      { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
      { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
      { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B 32K" },
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
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: 4,
      }}
    >
      <Group gap={6} justify={isUser ? "flex-end" : "flex-start"}>
        <ThemeIcon
          size="xs"
          variant="light"
          color={isUser ? "blue" : "violet"}
          radius="xl"
        >
          {isUser ? <IconUser size={10} /> : <IconRobot size={10} />}
        </ThemeIcon>
        <Text size="xs" c="dimmed">
          {isUser ? "You" : "AI Interviewer"}
        </Text>
      </Group>
      <Paper
        p="sm"
        withBorder
        style={{
          maxWidth: "92%",
          backgroundColor: isUser
            ? "var(--mantine-color-blue-9)"
            : "var(--mantine-color-dark-6)",
          borderColor: isUser
            ? "var(--mantine-color-blue-7)"
            : "var(--mantine-color-dark-4)",
        }}
      >
        {isUser ? (
          <Text size="sm" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {message.content}
          </Text>
        ) : (
          <Box
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              wordBreak: "break-word",
            }}
            className="ai-response-markdown"
          >
            <Markdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {message.content}
            </Markdown>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

interface AIChatPanelProps {
  incidentName: string;
  incidentReport: string;
}

export default function AIChatPanel({ incidentName, incidentReport }: AIChatPanelProps) {
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

  const [showKeyInput, setShowKeyInput] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Switch key storage when model provider changes
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
      setShowKeyInput(true);
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

      const providerErrorMatch = streamedText.match(/\[Provider error:\s*([\s\S]+?)\]/);
      if (providerErrorMatch?.[1]) {
        const providerError = providerErrorMatch[1].trim();
        setError(providerError);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            const cleanedContent = last.content
              .replace(/\[Provider error:[\s\S]+?\]/g, "")
              .trim();

            if (!cleanedContent) {
              updated.pop();
            } else {
              updated[updated.length - 1] = {
                ...last,
                content: cleanedContent,
              };
            }
          }
          return updated;
        });
        return;
      }

      if (!streamedText.trim()) {
        setError("The model returned an empty response. Check API key/model and try again.");
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
    provider === "google" ? "AIza..." : provider === "xai" ? "xai-..." : "gsk_...";

  return (
    <Box
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--mantine-color-dark-8)",
      }}
    >
      {/* Header */}
      <Box
        p="sm"
        style={{ borderBottom: "1px solid var(--mantine-color-dark-5)" }}
      >
        <Group justify="space-between" mb="xs">
          <Group gap={6}>
            <Title order={6} style={{ fontSize: 13 }}>
              Rubber Duck
            </Title>
          </Group>
          <Group gap={4}>
            {isLoading && (
              <Tooltip label="Stop response">
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="red"
                  onClick={stopStreaming}
                >
                  <IconX size={12} />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label="Clear chat">
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                onClick={clearChat}
              >
                <IconX size={12} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Model selector */}
        <Select
          size="xs"
          data={MODEL_OPTIONS ?? []}
          value={model}
          onChange={(v: string | null) => v && setModel(v)}
          styles={{ input: { fontSize: 12 } }}
          mb="xs"
        />

        {/* API Key */}
        {showKeyInput ? (
          <Stack gap={4}>
            <PasswordInput
              size="xs"
              placeholder={keyPlaceholder}
              label={keyLabel}
              value={apiKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.currentTarget.value)}
              styles={{ label: { fontSize: 11 }, input: { fontSize: 12 } }}
            />
            <Group justify="space-between">
              <Text
                size="xs"
                c="blue"
                style={{ cursor: "pointer", textDecoration: "underline" }}
                component="a"
                href={PROVIDER_LINKS[model]}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get API key →
              </Text>
              <Button
                size="xs"
                variant="light"
                onClick={() => setShowKeyInput(false)}
              >
                Done
              </Button>
            </Group>
          </Stack>
        ) : (
          <Group gap={4}>
            <Badge
              size="xs"
              color={apiKey ? "green" : "red"}
              variant="dot"
              style={{ cursor: "pointer" }}
              onClick={() => setShowKeyInput(true)}
            >
              {apiKey ? "API Key set" : "Set API Key"}
            </Badge>
          </Group>
        )}
      </Box>

      {/* Messages */}
      <ScrollArea
        flex={1}
        p="sm"
        viewportRef={scrollRef}
        style={{ flex: 1 }}
      >
        {messages.length === 0 ? (
          <Stack gap="sm" align="center" pt="xl">
            <ThemeIcon size="xl" variant="light" color="violet" radius="xl">
              <IconRobot size={24} />
            </ThemeIcon>
            <Text size="sm" c="dimmed" ta="center" maw={200}>
              Ask the AI interviewer about the bug or request hints
            </Text>
            <Button
              size="xs"
              variant="light"
              color="violet"
              onClick={() =>
                setInput("Can you give me a hint about what the bug might be?")
              }
            >
              Get a hint
            </Button>
          </Stack>
        ) : (
          <Stack gap="md">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <Group gap={6}>
                <Loader size="xs" color="violet" />
                <Text size="xs" c="dimmed">
                  Thinking...
                </Text>
              </Group>
            )}
          </Stack>
        )}
        {error && (
          <Paper p="xs" mt="sm" withBorder style={{ borderColor: "var(--mantine-color-red-7)" }}>
            <Text size="xs" c="red">
              {error}
            </Text>
          </Paper>
        )}
      </ScrollArea>

      {/* Input area */}
      <Box p="sm" style={{ borderTop: "1px solid var(--mantine-color-dark-5)" }}>
        {activeFile && (
          <Button
            size="xs"
            variant="solid"
            color="blue"
            mb="xs"
            onClick={injectCode}
          >
            Attach current file
          </Button>
        )}
        <Group gap="xs" align="flex-end">
          <Textarea
            style={{ flex: 1 }}
            size="xs"
            placeholder="Ask about the bug, request hints..."
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.currentTarget.value)}
            autosize
            minRows={2}
            maxRows={6}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            styles={{ input: { fontSize: 12 } }}
          />
          <ActionIcon
            type="button"
            size="md"
            color="blue"
            variant="filled"
            onClick={() => void sendMessage()}
            loading={isLoading}
            disabled={!input.trim()}
          >
            <IconSend size={14} />
          </ActionIcon>
        </Group>
        <Text size="xs" c="dimmed" mt={4}>
          Shift+Enter for newline · Enter to send
        </Text>
      </Box>
    </Box>
  );
}
