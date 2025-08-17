/**
 * ai sdk docs:
 * https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-text
 * https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-text
 * https://sdk.vercel.ai/providers/ai-sdk-providers
 * 
 * vercel runtime:
 * https://vercel.com/docs/functions/runtimes/edge
 * https://vercel.com/docs/functions/runtimes/node-js
 * 
 * vercel maxDuration: 
 * https://vercel.com/docs/functions/configuring-functions/duration
 */

export const runtime = "edge"; // if deploy to vercel/netlify/cloudflare, use edge runtime

import { apiResponse } from "@/lib/api-response";
import { anthropic } from "@ai-sdk/anthropic";
import { deepseek } from "@ai-sdk/deepseek";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  JSONValue,
  LanguageModel,
  Message,
  streamText
} from "ai";
import { z } from 'zod';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

const inputSchema = z.object({
  messages: z.array(messageSchema).min(1, "Messages cannot be empty"),
  modelId: z.string().min(1, "Model ID cannot be empty"),
  provider: z.string().min(1, "Provider cannot be empty"),
});

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return apiResponse.badRequest("This page is only for administrators to test locally. Please purchase nexty.dev to test it yourself.");
  }

  try {
    const rawBody = await req.json();

    const validationResult = inputSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return apiResponse.badRequest(`Invalid input: ${validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    const { messages, modelId, provider } = validationResult.data;

    let textModel: LanguageModel;
    let providerOptions: Record<string, Record<string, JSONValue>> = {};

    switch (provider) {
      case "openai":
        if (!process.env.OPENAI_API_KEY) {
          return apiResponse.serverError("Server configuration error: Missing OpenAI API Key.");
        }
        textModel = openai(modelId);
        // providerOptions = {
        //   openai: {
        //     reasoningEffort: 'low',
        //   },
        // };
        break;

      case "anthropic":
        if (!process.env.ANTHROPIC_API_KEY) {
          return apiResponse.serverError("Server configuration error: Missing Anthropic API Key.");
        }
        textModel = anthropic(modelId);
        // providerOptions = {
        //   anthropic: {
        //     thinking: { type: 'enabled', budgetTokens: 12000 },
        //   } satisfies AnthropicProviderOptions,
        // };
        break;

      case "google":
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          return apiResponse.serverError("Server configuration error: Missing Google API Key.");
        }
        textModel = google(modelId);
        break;

      case "deepseek":
        if (!process.env.DEEPSEEK_API_KEY) {
          return apiResponse.serverError("Server configuration error: Missing DeepSeek API Key.");
        }
        textModel = deepseek(modelId);
        break;

      case "xai":
        if (!process.env.XAI_API_KEY) {
          return apiResponse.serverError("Server configuration error: Missing XAI API Key.");
        }
        textModel = xai(modelId);
        break;

      case "openrouter":
        if (!process.env.OPENROUTER_API_KEY) {
          return apiResponse.serverError("Server configuration error: Missing OpenRouter API Key.");
        }
        const openrouterProvider = createOpenRouter({
          apiKey: process.env.OPENROUTER_API_KEY,
        });
        textModel = openrouterProvider.chat(modelId);
        break;

      default:
        return apiResponse.badRequest("Invalid provider");
    }

    const result = await streamText({
      model: textModel,
      messages: messages as Message[],
      providerOptions: providerOptions,
      // debug
      // onChunk: async (chunk) => {
      //   console.log("Chunk received:", chunk);
      // },
      // onFinish({ text, finishReason, usage, response }) {
      //   // If you want to save the generated result, you can write it to the database here
      //   // 如果你想保存生成结果，可以在这里写入数据库
      //   // 生成結果を保存したい場合は、ここにデータベースに書き込むことができます
      //   const messages = response.messages;
      //   console.log("Generation completed", messages);
      // },
    });

    return result.toDataStreamResponse({
      sendReasoning: true,
    });

  } catch (error: any) {
    console.error("Chat generation failed:", error);
    const errorMessage = error?.message || "Failed to generate response";
    if (errorMessage.includes("API key")) {
      return apiResponse.serverError(`Server configuration error: ${errorMessage}`);
    }
    return apiResponse.serverError(errorMessage);
  }
}