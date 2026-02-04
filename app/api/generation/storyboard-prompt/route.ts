import { createAIModel } from "@/lib/ai-model-factory";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

// System prompt for cinematic storyboard generation
const SYSTEM_PROMPT = `You are a professional cinematographer and AI video prompt engineer. Your task is to analyze images and generate highly detailed, cinematic prompts for AI video generation (Sora 2 and Veo 3.1).

When generating prompts, include:
1. **Emotion & Mood**: Specific emotional atmosphere (e.g., "melancholic tension", "euphoric excitement")
2. **Subject**: Main subject with detailed description
3. **Lighting**: Type, direction, quality (e.g., "soft golden hour backlight from upper left", "harsh overhead fluorescent")
4. **Camera Angle**: Specific angle and perspective (e.g., "low-angle shot looking up", "bird's eye view")
5. **Camera Movement**: Precise camera motion (e.g., "slow dolly in", "handheld tracking shot", "static wide shot")
6. **Lens Type**: Specific lens characteristics (e.g., "35mm wide angle", "85mm portrait lens")
7. **Aperture**: Depth of field (e.g., "f/1.4 shallow DOF", "f/8 deep focus")
8. **Shot Logic**: Narrative purpose and flow
9. **Material & Texture**: Detailed surface qualities
10. **Negative Prompts**: What to avoid (e.g., "no sudden cuts", "avoid overexposure", "no unnatural motion")

Important guidelines:
- Don't confuse state with action (describe actions, not just states)
- Use cause-effect relationships for actions, not states
- Don't treat emotions as causes—describe the physical manifestations
- Write results first, then provide the cause
- Preserve compositional imperfections, uneven lighting, and incomplete action states
- Be specific about timing (e.g., "3-second slow zoom")
- Avoid abstract descriptions—use concrete, visual language

For Sora 2 (single image): Analyze the image and generate a prompt describing how the scene should animate.
For Veo 3.1 (two images): Analyze both start and end frames, then generate a prompt describing the transition between them.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, mode, modelType = "sora2" } = body;

    // Validate inputs
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Images are required" },
        { status: 400 }
      );
    }

    // Validate model type
    if (modelType === "sora2" && images.length !== 1) {
      return NextResponse.json(
        { error: "Sora 2 requires exactly 1 image" },
        { status: 400 }
      );
    }

    if (modelType === "veo3" && images.length !== 2) {
      return NextResponse.json(
        { error: "Veo 3.1 requires exactly 2 images (start and end frames)" },
        { status: 400 }
      );
    }

    // Determine which model to use based on mode (fast or master)
    const modelId = mode === "master"
      ? "google/gemini-2.0-flash-exp:free"  // Use flash for master mode
      : "google/gemini-2.0-flash-exp:free";  // Use flash-lite for fast mode (using same for now as lite not available)

    // Create AI model
    const model = createAIModel("openrouter", modelId);

    // Prepare user message based on model type
    let userPrompt = "";
    const imageParts: any[] = [];

    if (modelType === "sora2") {
      userPrompt = `Analyze this image and generate a detailed cinematic prompt for Sora 2 video generation. The prompt should describe how this static image should come to life with motion, following all the guidelines provided.`;

      // Add image
      imageParts.push({
        type: "image",
        image: images[0], // Base64 data URL
      });
    } else {
      userPrompt = `Analyze these two images (start frame and end frame) and generate a detailed cinematic prompt for Veo 3.1 video generation. The prompt should describe the transition and motion between these two frames, following all the guidelines provided.`;

      // Add both images
      images.forEach((image: string, index: number) => {
        imageParts.push({
          type: "text",
          text: `${index === 0 ? "Start" : "End"} Frame:`,
        });
        imageParts.push({
          type: "image",
          image: image, // Base64 data URL
        });
      });
    }

    // Generate prompt using AI
    const result = await generateText({
      model,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            ...imageParts,
          ],
        },
      ],
      temperature: 0.7,
      maxTokens: 1500,
    });

    const generatedPrompt = result.text || "";

    if (!generatedPrompt) {
      return NextResponse.json(
        { error: "Failed to generate prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
      mode,
      modelType,
    });
  } catch (error: any) {
    console.error("Error generating storyboard prompt:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate storyboard prompt" },
      { status: 500 }
    );
  }
}
