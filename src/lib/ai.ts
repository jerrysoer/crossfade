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

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
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
  options?: { maxTokens?: number; temperature?: number }
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
