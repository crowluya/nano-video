"use client";

import { Locale, LOCALE_NAMES, LOCALES } from "@/i18n/routing";
import { PostType } from "@/lib/db/schema";
import { useCompletion } from "@ai-sdk/react";
import { Editor } from "@tiptap/react";
import { Info, LanguagesIcon } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface TranslationButtonProps {
  editor: Editor;
  disabled?: boolean;
  postType?: PostType;
}

export function TranslationButton({
  editor,
  disabled = false,
  postType = "blog",
}: TranslationButtonProps) {
  // save the original content before translating
  const originalContentRef = useRef<string | null>(null);

  const {
    completion,
    isLoading: isTranslating,
    complete,
  } = useCompletion({
    api: "/api/admin/translate",
    experimental_throttle: 300,
    body: {
      modelId: process.env.NEXT_PUBLIC_AI_MODEL_ID || "",
      provider: process.env.NEXT_PUBLIC_AI_PROVIDER || "",
    },
    onError: (error: any) => {
      // if translation fails, restore the original content
      if (originalContentRef.current && editor) {
        editor.commands.setContent(originalContentRef.current);
        originalContentRef.current = null;
      }

      let errorMessage: string;
      try {
        const parsedError = JSON.parse(error.message);
        errorMessage = parsedError.error || "Translation failed";
      } catch {
        errorMessage = error.message || "Translation failed";
      }
      toast.error(errorMessage);
    },
  });

  useEffect(() => {
    if (completion && editor) {
      editor.commands.setContent(completion);
      // clear the original content
      originalContentRef.current = null;
    }
  }, [completion, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled && !isTranslating);
    }
  }, [disabled, isTranslating, editor]);

  const handleTranslate = useCallback(
    async (targetLang: Locale) => {
      if (!editor) return;

      // Get current markdown content
      // @ts-ignore - Markdown extension storage
      const currentContent = editor.storage.markdown.getMarkdown();

      if (!currentContent || currentContent.trim() === "") {
        toast.info(
          "Content is empty. Please add some content before translating."
        );
        return;
      }

      // save the original content before translating
      originalContentRef.current = currentContent;

      // Clear editor content
      editor.commands.setContent("");

      const targetLangName = LOCALE_NAMES[targetLang] || targetLang;
      const prompt = `Translate the following ${postType} post content to ${targetLangName}. Ensure the translation is natural, maintains the original meaning and tone, SEO friendly, and is suitable for a ${postType} post. Only return the translated text itself, without any additional commentary or explanations before or after the translated content. Preserve markdown formatting if present.\n\nOriginal content:\n${currentContent}`;

      try {
        await complete(prompt);
      } catch (error) {
        // if complete throws an error, restore the original content
        if (originalContentRef.current && editor) {
          editor.commands.setContent(originalContentRef.current);
          originalContentRef.current = null;
        }
      }
    },
    [editor, postType, complete]
  );

  const isAIConfigured =
    process.env.NEXT_PUBLIC_AI_MODEL_ID && process.env.NEXT_PUBLIC_AI_PROVIDER;

  if (!isAIConfigured) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>AI translation requires AI model configuration</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || isTranslating}
            title="Translate"
          >
            <LanguagesIcon className="h-4 w-4" />
            {isTranslating && (
              <span className="ml-1 text-xs">Translating...</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {LOCALES.length > 0 ? (
            LOCALES.map((locale) => (
              <DropdownMenuItem
                key={locale}
                disabled={isTranslating}
                onSelect={() => handleTranslate(locale)}
              >
                Translate to {LOCALE_NAMES[locale] || locale}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No translation options</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
