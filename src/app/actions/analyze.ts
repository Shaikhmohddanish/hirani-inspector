"use server";

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYSIS_PROMPT = `As a civil engineer, I have some photos and would like to classify them into different categories before starting a project. Find if it contains any visible cracks, peeling paint, possible water damage, visual discoloration, honeycombing, spalling or any other possible damage. If nothing, then just mention one statement about the image. Sound it technical and to the point. Do not suggest any next steps, only one statement is suffice.`;

export type AnalysisResult = {
  success: boolean;
  comment?: string;
  error?: string;
  tokens?: { input: number; output: number };
  costUsd?: number;
};

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

    let comment = response.choices[0]?.message?.content?.trim() || "";
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
