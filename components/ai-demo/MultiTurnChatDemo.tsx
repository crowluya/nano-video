"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_MODELS } from "@/config/models";
import { useChat } from "@ai-sdk/react";
import { Bot, Loader2, SendIcon, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const constructModelValue = (provider: string, modelId: string) =>
  `${provider}/${modelId}`;
const parseModelValue = (value: string) => {
  const parts = value.split("/");
  const provider = parts[0];
  const modelId = parts.slice(1).join("/");
  return { provider, modelId };
};

export default function MultiTurnChatDemo() {
  const initialModel = constructModelValue(
    LANGUAGE_MODELS[0].provider,
    LANGUAGE_MODELS[0].models[0].id
  );
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const { provider, modelId } = parseModelValue(selectedModel);

  const currentModel = LANGUAGE_MODELS.find(
    (g) => g.provider === provider
  )?.models.find((m) => m.id === modelId);

  const supportsReasoning = currentModel?.outputSupport.includes("reasoning");

  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: "/api/ai-demo/multi-chat",
    body: {
      modelId,
      provider,
      enableReasoning: supportsReasoning,
    },
    onError: (error: any) => {
      let errorMessage: string;
      try {
        const parsedError = JSON.parse(error.message);
        errorMessage = parsedError.error || "Failed to generate response";
      } catch {
        errorMessage = error.message || "Failed to generate response";
      }
      toast.error(errorMessage);
    },
  });

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Multi-turn Chat</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Have a continuous conversation with different AI models.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">
              Choose Model
            </label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-full md:w-72">
                <SelectValue>
                  {currentModel?.name || "Select a model"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_MODELS.map((group) => (
                  <SelectGroup key={group.provider}>
                    {group.models.map((model) => (
                      <SelectItem
                        key={model.id}
                        value={constructModelValue(group.provider, model.id)}
                        className="pl-4"
                      >
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="w-full h-[400px] flex flex-col">
          <CardContent className="flex-1 p-4 block flex-col h-[400px] overflow-auto">
            <ScrollArea className="flex-1 pr-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-center p-4">
                  Start a conversation by sending a message below
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-start max-w-[80%] ${
                          message.role === "user"
                            ? "flex-row-reverse"
                            : "flex-row"
                        }`}
                      >
                        <Avatar
                          className={`h-8 w-8 ${
                            message.role === "user" ? "ml-2" : "mr-2"
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
                            className={`rounded-lg p-3 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {message.parts?.map(
                              (part: any, partIndex: number) =>
                                part.type === "reasoning" && (
                                  <div
                                    key={`reasoning-${partIndex}`}
                                    className="rounded-lg p-3 bg-muted/50 text-sm"
                                  >
                                    <div className="font-medium mb-1 text-muted-foreground">
                                      Reasoning Process:
                                    </div>
                                    <div className="space-y-2">
                                      {part.details.map(
                                        (detail: any, i: number) => (
                                          <div
                                            key={i}
                                            className="text-muted-foreground"
                                          >
                                            {detail.text}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )
                            )}

                            {message.parts?.map(
                              (part: any, partIndex: number) =>
                                part.type === "text" && (
                                  <div
                                    key={partIndex}
                                    className="whitespace-pre-wrap text-sm"
                                  >
                                    {part.text}
                                  </div>
                                )
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
                placeholder="Type your message..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                disabled={status === "streaming"}
              />
              <Button
                size="icon"
                onClick={(e) => handleSubmit(e)}
                disabled={status === "streaming" || !input?.trim()}
              >
                <SendIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
