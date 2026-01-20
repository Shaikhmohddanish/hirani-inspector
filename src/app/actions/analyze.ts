"use server";

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYSIS_PROMPT = `As a civil engineer, review the image and provide one concise technical sentence about visible condition. Mention issues like cracks, peeling paint, water damage, discoloration, honeycombing, or spalling if present. If no issues, state that clearly. Do not suggest next steps.

Also classify the scene as indoor or outdoor if possible.

Return ONLY valid JSON with keys:
- comment (string, one sentence)
- environment ("indoor" | "outdoor" | "unknown").`;

export type AnalysisResult = {
  success: boolean;
  comment?: string;
  environment?: "indoor" | "outdoor" | "unknown";
  error?: string;
  tokens?: { input: number; output: number };
  costUsd?: number;
};

function normalizeEnvironment(value: string | undefined): "indoor" | "outdoor" | "unknown" {
  if (!value) return "unknown";
  const lowered = value.toLowerCase();
  if (lowered === "indoor") return "indoor";
  if (lowered === "outdoor") return "outdoor";
  return "unknown";
}

function extractJson(content: string): { comment: string; environment: "indoor" | "outdoor" | "unknown" } {
  const trimmed = content.trim();
  const jsonMatch = trimmed
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/i, "")
    .trim();

  const parsed = JSON.parse(jsonMatch) as { comment?: string; environment?: string };
  return {
    comment: parsed.comment?.trim() || "",
    environment: normalizeEnvironment(parsed.environment),
  };
}

export async function analyzeImage(base64Image: string): Promise<AnalysisResult> {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: ANALYSIS_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";

    let comment = "";
    let environment: "indoor" | "outdoor" | "unknown" = "unknown";

    try {
      const parsed = extractJson(content);
      comment = parsed.comment;
      environment = parsed.environment;
    } catch {
      comment = content;
      const lowered = content.toLowerCase();
      if (lowered.includes("indoor")) environment = "indoor";
      if (lowered.includes("outdoor")) environment = "outdoor";
    }

    if (comment && !comment.endsWith(".")) {
      comment += ".";
    }

    const usage = response.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;

    // GPT-4o pricing: $0.005/1K input, $0.015/1K output
    const costUsd = (inputTokens * 0.005) / 1000 + (outputTokens * 0.015) / 1000;

    return {
      success: true,
      comment,
      environment,
      tokens: { input: inputTokens, output: outputTokens },
      costUsd: parseFloat(costUsd.toFixed(6)),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during analysis",
    };
  }
}

export async function analyzeBatch(
  images: Array<{ id: string; base64: string }>,
  rateSeconds: number = 1.0,
  onProgress?: (current: number, total: number, imageId: string, result: AnalysisResult) => void,
): Promise<Map<string, AnalysisResult>> {
  const results = new Map<string, AnalysisResult>();
  const total = images.length;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const result = await analyzeImage(img.base64);
    results.set(img.id, result);

    onProgress?.(i + 1, total, img.id, result);

    // Rate limiting
    if (i < images.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, rateSeconds * 1000));
    }
  }

  return results;
}
