import { NextRequest, NextResponse } from "next/server";

// Shared in-memory storage
const imageStore = new Map<string, Buffer>();

// Export for use in image route
export { imageStore };

const DEFAULT_PROMPT = `As a civil engineer, review the image and provide one concise technical sentence about visible condition. Mention issues like cracks, peeling paint, water damage, discoloration, honeycombing, or spalling if present. If no issues, state that clearly. Do not suggest next steps. Keep your response under 270 characters.

Return ONLY valid JSON with key:
- comment (string, one sentence, max 270 characters).`;

const GPT_PROMPT = `You are a civil engineering inspector. Analyze the image and produce one short, technical sentence describing visible condition. If no defects, say so. Do not suggest next steps. Keep your response under 270 characters.

Return ONLY valid JSON with key:
- comment (string, one sentence, max 270 characters).`;

function extractJson(content: string): { comment: string } {
  const trimmed = content.trim();
  const jsonMatch = trimmed
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/i, "")
    .trim();

  const parsed = JSON.parse(jsonMatch) as { comment?: string };
  return {
    comment: parsed.comment?.trim() || "",
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const base64 = formData.get("imageBase64") as string;
    const promptVariant = formData.get("promptVariant") as string | null;
    const promptOverride = formData.get("promptOverride") as string | null;

    if (!base64) {
      return NextResponse.json({ error: "Image base64 data required" }, { status: 400 });
    }

    const prompt =
      promptVariant === "gpt"
        ? (promptOverride?.trim() || GPT_PROMPT)
        : DEFAULT_PROMPT;

    // Call OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0]?.message?.content?.trim() || "";

    let comment = "";

    try {
      const parsed = extractJson(content);
      comment = parsed.comment;
    } catch {
      comment = content;
    }

    if (comment && !comment.endsWith(".")) {
      comment += ".";
    }

    const usage = data.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const costUsd = (inputTokens * 0.005) / 1000 + (outputTokens * 0.015) / 1000;

    return NextResponse.json({
      success: true,
      comment,
      tokens: { input: inputTokens, output: outputTokens },
      costUsd: parseFloat(costUsd.toFixed(6)),
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during analysis",
      },
      { status: 500 },
    );
  }
}
