"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import { useChat } from "@ai-sdk/react";
import { Bot, Loader2, SendIcon, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ModelOption = {
  provider: "openrouter";
  modelId: string;
  name: string;
  paidOnly?: boolean;
  reasoning?: boolean;
};

const STORAGE_KEY = "prompt-generator-chat-v1";

const MODELS: ModelOption[] = [
  {
    provider: "openrouter",
    modelId: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    paidOnly: false,
  },
  {
    provider: "openrouter",
    modelId: "deepseek/deepseek-v3.2",
    name: "DeepSeek V3",
    paidOnly: true,
  },
  {
    provider: "openrouter",
    modelId: "tngtech/deepseek-r1t2-chimera",
    name: "DeepSeek R1",
    paidOnly: true,
    reasoning: true,
  },
];

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function PromptGeneratorChat() {
  const router = useRouter();
  const t = useTranslations("NanoBananaVideo.PromptGenerator");
  const { data: session } = authClient.useSession();
  const { benefits } = useUserBenefits();
  const isPaid =
    benefits?.subscriptionStatus === "active" ||
    benefits?.subscriptionStatus === "trialing";
  const isLoggedIn = !!session?.user;

  const availableModels = useMemo(() => {
    return MODELS.filter((m) => (m.paidOnly ? isPaid : true));
  }, [isPaid]);

  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    if (typeof window === "undefined") return MODELS[0].modelId;
    const saved = safeParseJson<{ modelId?: string }>(
      window.localStorage.getItem(STORAGE_KEY)
    );
    return saved?.modelId || MODELS[0].modelId;
  });

  const [initialMessages] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = safeParseJson<{ messages?: any[] }>(
      window.localStorage.getItem(STORAGE_KEY)
    );
    return Array.isArray(saved?.messages) ? saved!.messages! : [];
  });

  const selectedModel = useMemo(() => {
    const m = MODELS.find((x) => x.modelId === selectedModelId);
    return m || MODELS[0];
  }, [selectedModelId]);

  useEffect(() => {
    if (!isPaid) {
      const current = MODELS.find((m) => m.modelId === selectedModelId);
      if (current?.paidOnly) {
        setSelectedModelId(MODELS[0].modelId);
      }
    }
  }, [isPaid, selectedModelId]);

  const enableReasoning = !!selectedModel.reasoning;

  const { messages, input, handleInputChange, handleSubmit, status, setMessages } =
    useChat({
      api: "/api/generation/prompt-chat",
      initialMessages,
      body: {
        provider: selectedModel.provider,
        modelId: selectedModel.modelId,
        enableReasoning,
      },
      onError: (error: any) => {
        let errorMessage: string;
        try {
          const parsedError = JSON.parse(error.message);
          errorMessage = parsedError.error || t("defaultError");
        } catch {
          errorMessage = error.message || t("defaultError");
        }
        toast.error(errorMessage);
      },
    });

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ modelId: selectedModelId, messages })
    );
  }, [messages, selectedModelId]);

  const handleClear = () => {
    setMessages([]);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ modelId: selectedModelId, messages: [] })
    );
  };

  const requireLogin = () => {
    toast.error(t("loginRequired"));
    router.push("/login");
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("description")}
          </p>
        </div>

        <Button variant="outline" onClick={handleClear}>
          {t("clear")}
        </Button>
      </div>

      <div className="mb-4">
        <Label className="text-xs text-muted-foreground mb-2 block">
          {t("modelLabel")}
        </Label>
        <Select value={selectedModelId} onValueChange={setSelectedModelId}>
          <SelectTrigger className="w-full sm:w-[360px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {availableModels.map((m) => (
                <SelectItem key={m.modelId} value={m.modelId}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {!isPaid && (
          <p className="text-xs text-muted-foreground mt-2">
            {t("freeUserHint")}
          </p>
        )}

        {!isLoggedIn && (
          <p className="text-xs text-muted-foreground mt-2">
            {t("previewHint")}
          </p>
        )}
      </div>

      <Card className="w-full h-[560px] flex flex-col">
        <CardContent className="flex-1 p-4 block flex-col h-[560px] overflow-auto">
          <ScrollArea className="flex-1 pr-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-center p-4">
                {t("emptyState")}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`flex items-start max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"
                        }`}
                    >
                      <Avatar
                        className={`h-8 w-8 ${message.role === "user" ? "ml-2" : "mr-2"
                          }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </Avatar>

                      <div className="space-y-2">
                        <div
                          className={`rounded-lg p-3 ${message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                            }`}
                        >
                          {message.parts?.map((part: any, partIndex: number) =>
                            part.type === "reasoning" ? (
                              <div
                                key={`reasoning-${partIndex}`}
                                className="rounded-lg p-3 bg-muted/50 text-sm"
                              >
                                <div className="font-medium mb-1 text-muted-foreground">
                                  {t("reasoningTitle")}
                                </div>
                                <div className="space-y-2">
                                  {part.details.map((detail: any, i: number) => (
                                    <div key={i} className="text-muted-foreground">
                                      {detail.text}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null
                          )}

                          {message.parts?.map((part: any, partIndex: number) =>
                            part.type === "text" ? (
                              <div
                                key={partIndex}
                                className="whitespace-pre-wrap text-sm"
                              >
                                {part.text}
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {status === "streaming" && (
                  <div className="flex justify-start">
                    <div className="flex items-start">
                      <Avatar className="h-8 w-8 mr-2">
                        <Bot className="h-4 w-4" />
                      </Avatar>
                      <div className="rounded-lg p-3 bg-muted">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="flex items-center gap-2 mt-4">
            <Input
              placeholder={t("inputPlaceholder")}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoggedIn) {
                    requireLogin();
                    return;
                  }
                  handleSubmit(e);
                }
              }}
              disabled={status === "streaming"}
            />
            <Button
              size="icon"
              onClick={(e) => {
                if (!isLoggedIn) {
                  requireLogin();
                  return;
                }
                handleSubmit(e);
              }}
              disabled={status === "streaming" || !input?.trim() || !isLoggedIn}
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
