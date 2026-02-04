import { createAIModel } from "@/lib/ai-model-factory";
import { apiResponse } from "@/lib/api-response";
import { getSession } from "@/lib/auth/server";
import { Message, streamText } from "ai";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const inputSchema = z.object({
  messages: z.array(messageSchema).min(1, "Messages cannot be empty"),
  modelId: z.string().min(1, "Model ID cannot be empty"),
  provider: z.string().min(1, "Provider cannot be empty"),
  enableReasoning: z.boolean().optional(),
});

const FREE_ALLOWED = {
  provider: "openrouter",
  modelId: "google/gemini-2.5-flash-lite",
};

const PAID_ALLOWED = [
  { provider: "openrouter", modelId: "deepseek/deepseek-v3.2" },
  { provider: "openrouter", modelId: "tngtech/deepseek-r1t2-chimera" },
];

function isPaidUser(subscriptionStatus: string | null | undefined) {
  return subscriptionStatus === "active" || subscriptionStatus === "trialing";
}

async function getUserPaidStatus(userId: string) {
  const { getUserBenefits } = await import("@/actions/usage/benefits");
  const benefits = await getUserBenefits(userId);
  return isPaidUser(benefits.subscriptionStatus);
}

function isAllowedModel(
  provider: string,
  modelId: string,
  isPaid: boolean
): boolean {
  if (provider === FREE_ALLOWED.provider && modelId === FREE_ALLOWED.modelId) {
    return true;
  }
  if (!isPaid) return false;
  return PAID_ALLOWED.some((m) => m.provider === provider && m.modelId === modelId);
}

export async function POST(req: Request) {
  const session = await getSession();
  const user = session?.user;
  if (!user) return apiResponse.unauthorized();

  try {
    const rawBody = await req.json();
    const validationResult = inputSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return apiResponse.badRequest(
        `Invalid input: ${validationResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }

    const { messages, modelId, provider, enableReasoning } = validationResult.data;

    const paid = await getUserPaidStatus((user as any).id);
    if (!isAllowedModel(provider, modelId, paid)) {
      return apiResponse.forbidden("Model not allowed for current user plan");
    }

    let model;
    try {
      model = createAIModel(provider, modelId);
    } catch (error) {
      console.error("Failed to create AI model:", error);
      const message = error instanceof Error ? error.message : String(error);
      return apiResponse.serverError(message);
    }

    const result = await streamText({
      model,
      messages: messages as Message[],
    });

    return result.toDataStreamResponse({
      sendReasoning: !!enableReasoning,
    });
  } catch (error: any) {
    console.error("Prompt generator chat failed:", error);
    const errorMessage = error?.message || "Failed to generate response";
    if (errorMessage.includes("API key")) {
      return apiResponse.serverError(`Server configuration error: ${errorMessage}`);
    }
    return apiResponse.serverError(errorMessage);
  }
}
