import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set in environment variables");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }
): Promise<string> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: options?.model ?? DEFAULT_MODEL,
    max_tokens: options?.maxTokens ?? 4096,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  return textBlock.text;
}

export async function callClaudeJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number; model?: string }
): Promise<T> {
  const text = await callClaude(
    systemPrompt,
    userPrompt + "\n\nRespond with valid JSON only. No markdown code fences.",
    options
  );

  const cleaned = text
    .replace(/^```(?:json)?\n?/gm, "")
    .replace(/\n?```$/gm, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    throw new Error(
      `Failed to parse Claude JSON response: ${e instanceof Error ? e.message : "Unknown error"}`
    );
  }
}

/**
 * Streaming version of callClaudeJSON — uses the Anthropic streaming API
 * for faster time-to-first-token. Accumulates text and parses JSON when done.
 */
export async function callClaudeJSONStream<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number; model?: string }
): Promise<T> {
  const anthropic = getClient();

  let text = "";
  const stream = anthropic.messages.stream({
    model: options?.model ?? DEFAULT_MODEL,
    max_tokens: options?.maxTokens ?? 4096,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      text += event.delta.text;
    }
  }

  const cleaned = text
    .replace(/^```(?:json)?\n?/gm, "")
    .replace(/\n?```$/gm, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    throw new Error(
      `Failed to parse Claude JSON stream response: ${e instanceof Error ? e.message : "Unknown error"}`
    );
  }
}
