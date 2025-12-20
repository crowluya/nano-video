"use client";

import { useState } from "react";
import VideoGenerationPage from "@/components/video-generation/VideoGenerationPage";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, LogIn, Coins, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useUserBenefits } from "@/hooks/useUserBenefits";

export default function VideoGenerationDemo() {
  const t = useTranslations("NanoBananaVideo.VideoDemo");
  const { data: session } = authClient.useSession();
  const { benefits, isLoading: isLoadingBenefits } = useUserBenefits();
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);

  const isLoggedIn = !!session?.user;

  return (
    <section id="video-demo" className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-center z-10 text-lg md:text-5xl font-sans font-semibold mb-4">
            <span className="title-gradient">{t("title")}</span>
          </h2>
        </div>

        {/* Login Prompt for Non-Logged In Users */}
        {!isLoggedIn && showLoginPrompt && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {t("loginPrompt")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  size="sm"
                  className="shrink-0"
                >
                  <Link href="/sign-in" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    {t("loginButton")}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLoginPrompt(false)}
                  className="shrink-0"
                >
                  ✕
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credits Display for Logged In Users */}
        {isLoggedIn && (
          <Card className="mb-6 border-border">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Coins className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    {isLoadingBenefits ? (
                      "Loading credits..."
                    ) : benefits ? (
                      `Available Credits: ${benefits.totalAvailableCredits}`
                    ) : (
                      "Credits: --"
                    )}
                  </p>
                  {benefits && benefits.totalAvailableCredits === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      You need credits to generate videos. <Link href="/pricing" className="text-primary underline">Get credits</Link>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Video Generation Component */}
        <div className="rounded-2xl border-2 border-border overflow-hidden shadow-2xl">
          <VideoGenerationPage />
        </div>

        {/* Additional Info for Logged In Users */}
        {isLoggedIn && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ✨ Your videos will be automatically saved to your account
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

