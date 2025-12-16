/**
 * ai sdk docs
 * https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-completion
 * https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { LANGUAGE_MODELS } from "@/config/models";
import { useCompletion } from "@ai-sdk/react";
import { Loader2 } from "lucide-react";
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

export default function SingleTurnChatDemo() {
  const initialModel = constructModelValue(
    LANGUAGE_MODELS[0].provider,
    LANGUAGE_MODELS[0].models[0].id
  );
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const { provider, modelId } = parseModelValue(selectedModel);

  const {
    completion,
    input,
    isLoading,
    handleInputChange,
    complete,
    handleSubmit,
    setCompletion,
    setInput,
    stop,
  } = useCompletion({
    api: "/api/ai-demo/single-chat",
    body: {
      modelId,
      provider,
    },
    // debug
    // onResponse: (response) => {
    //   console.log("Raw Response:", response);
    // },
    // onFinish: (message) => {
    //   console.log("Finished Message:", message);
    // },
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const currentModel = LANGUAGE_MODELS.find(
    (g) => g.provider === provider
  )?.models.find((m) => m.id === modelId);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-4">Single-turn Chat</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Test simple question-answering capabilities with different large
            language models.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Choose Model
            </label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
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

          <div>
            <label className="text-sm font-medium mb-2 block">
              Your Question
            </label>
            <Textarea
              placeholder="Ask something..."
              className="min-h-32 resize-none"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift + Enter for new line
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={(e) => handleSubmit(e)}
              disabled={isLoading || !input?.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Response"
              )}
            </Button>

            {isLoading && (
              <Button variant="outline" onClick={stop} className="px-3">
                Stop
              </Button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Response</h3>
        <Card className="h-[calc(100%-28px)]">
          <CardContent className="p-4 h-full">
            {isLoading && !completion ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4 h-full overflow-auto">
                {completion ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {completion}
                  </div>
                ) : (
                  <div className="text-muted-foreground flex items-center justify-center h-full text-center">
                    Your response will appear here
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
