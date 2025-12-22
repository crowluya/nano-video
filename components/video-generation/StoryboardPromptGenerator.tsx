"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { AlertCircle, Crown, Loader2, Sparkles, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface StoryboardPromptGeneratorProps {
  images: string[];
  modelType: "sora2" | "veo3";
  onPromptGenerated: (prompt: string) => void;
}

export function StoryboardPromptGenerator({
  images,
  modelType,
  onPromptGenerated,
}: StoryboardPromptGeneratorProps) {
  const t = useTranslations("NanoBananaVideo.VideoGeneration.storyboardPrompt");
  const { benefits } = useUserBenefits();
  const [loading, setLoading] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [currentMode, setCurrentMode] = useState<"fast" | "master" | null>(null);

  // Check if user has paid subscription
  const isPaidUser = benefits?.subscriptionStatus === "active" || benefits?.subscriptionStatus === "trialing";

  // Validate if we have the right number of images
  const hasValidImages = () => {
    if (modelType === "sora2") {
      return images.length === 1;
    } else if (modelType === "veo3") {
      return images.length === 2;
    }
    return false;
  };

  const handleGenerate = async (mode: "fast" | "master") => {
    if (!hasValidImages()) {
      const requiredImages = modelType === "sora2" ? 1 : 2;
      toast.error(t("noImages"));
      return;
    }

    // Check if user can use master mode
    if (mode === "master" && !isPaidUser) {
      toast.error(t("upgradeRequired"));
      return;
    }

    setLoading(true);
    setCurrentMode(mode);
    setGeneratedPrompt("");

    try {
      const response = await fetch("/api/ai-demo/generate-storyboard-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images,
          mode,
          modelType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate prompt");
      }

      setGeneratedPrompt(data.prompt);
      toast.success(`Storyboard prompt generated successfully (${mode})`);
    } catch (error: any) {
      console.error("Error generating storyboard:", error);
      toast.error(error.message || "Failed to generate storyboard prompt");
    } finally {
      setLoading(false);
      setCurrentMode(null);
    }
  };

  const handleApplyPrompt = () => {
    if (generatedPrompt) {
      onPromptGenerated(generatedPrompt);
      toast.success(t("applyToPrompt"));
    }
  };

  // Show warning if wrong number of images
  const getImageRequirementMessage = () => {
    if (modelType === "sora2") {
      return t("singleImageRequired");
    } else {
      return t("dualImageRequired");
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-purple-600" />
          {t("title")}
        </CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show warning if images not valid */}
        {!hasValidImages() && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {images.length === 0 ? t("noImages") : getImageRequirementMessage()}
            </AlertDescription>
          </Alert>
        )}

        {/* Generation buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => handleGenerate("fast")}
            disabled={loading || !hasValidImages()}
            variant="outline"
            className="flex-1"
          >
            {loading && currentMode === "fast" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {t("generateFast")}
                <Badge variant="secondary" className="ml-2">
                  {t("fast")}
                </Badge>
              </>
            )}
          </Button>

          <Button
            onClick={() => handleGenerate("master")}
            disabled={loading || !hasValidImages() || !isPaidUser}
            variant="default"
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {loading && currentMode === "master" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                {t("generateMaster")}
                <Badge variant="secondary" className="ml-2 bg-yellow-100">
                  {t("master")}
                </Badge>
              </>
            )}
          </Button>
        </div>

        {/* Upgrade message for non-paid users */}
        {!isPaidUser && (
          <p className="text-xs text-muted-foreground text-center">
            {t("upgradeRequired")}
          </p>
        )}

        {/* Generated prompt display */}
        {generatedPrompt && (
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              {t("result")}
            </label>
            <Textarea
              value={generatedPrompt}
              onChange={(e) => setGeneratedPrompt(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
              placeholder={t("result")}
            />
            <Button
              onClick={handleApplyPrompt}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              <Sparkles className="mr-2 h-3 w-3" />
              {t("applyToPrompt")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
