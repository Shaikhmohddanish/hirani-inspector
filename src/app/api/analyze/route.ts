import { NextRequest, NextResponse } from "next/server";

// Shared in-memory storage
const imageStore = new Map<string, Buffer>();

// Export for use in image route
export { imageStore };

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const base64 = formData.get("imageBase64") as string;

    if (!base64) {
      return NextResponse.json({ error: "Image base64 data required" }, { status: 400 });
    }

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
                text: "As a civil engineer, I have some photos and would like to classify them into different categories before starting a project. Find if it contains any visible cracks, peeling paint, possible water damage, visual discoloration, honeycombing, spalling or any other possible damage. If nothing, then just mention a statement about the image. Sound it technical and to the point.",
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
    let comment = data.choices[0]?.message?.content?.trim() || "";
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
