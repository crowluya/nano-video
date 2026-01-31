"use client";

import { PricingCardDisplay } from "@/components/home/PricingCardDisplay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormDescription } from "@/components/ui/form";
import type { Locale } from "@/i18n/routing";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/routing";
import { safeJsonParse } from "@/lib/safeJson";
import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";

interface PricingCardPreviewProps {
  watchedValues: any;
}

export function PricingCardPreview({ watchedValues }: PricingCardPreviewProps) {
  const [displayLocale, setDisplayLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [parseError, setParseError] = useState<string | null>(null);

  const previewPlanData = useMemo(() => {
    const currentValues = watchedValues;
    let langJsonData = {};
    let hasParseError = false;

    if (currentValues.langJsonb) {
      const parsedData = safeJsonParse(currentValues.langJsonb);
      if (
        Object.keys(parsedData).length === 0 &&
        currentValues.langJsonb.trim()
      ) {
        hasParseError = true;
        setParseError(
          "Unable to parse language JSON. Please check the format."
        );
      } else {
        langJsonData = parsedData;
        setParseError(null);
      }
    } else {
      setParseError(null);
    }

    const planForPreview = {
      id: "preview-id",
      ...currentValues,
    };

    let localizedPlan = {};
    if (langJsonData && typeof langJsonData === "object") {
      localizedPlan = (langJsonData as any)[displayLocale] || {};
    }

    return {
      plan: planForPreview,
      localizedPlan,
      hasParseError,
    };
  }, [watchedValues, displayLocale]);

  return (
    <div className="mt-8 md:col-span-1 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <span>Preview</span>
              <div className="flex items-center space-x-1">
                {LOCALES.map((l) => (
                  <Button
                    key={l}
                    onClick={(e) => {
                      e.preventDefault();
                      setDisplayLocale(l);
                    }}
                    variant={displayLocale === l ? "secondary" : "outline"}
                    size="sm"
                    className="min-w-8 px-2"
                  >
                    {l.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </CardTitle>
          <FormDescription>
            This is a preview of the pricing card.
          </FormDescription>
        </CardHeader>
        <CardContent className="m-2">
          {parseError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {previewPlanData.plan && (
            <PricingCardDisplay
              plan={previewPlanData.plan}
              localizedPlan={previewPlanData.localizedPlan}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
