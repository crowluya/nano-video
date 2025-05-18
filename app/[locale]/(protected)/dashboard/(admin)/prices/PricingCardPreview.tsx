import { PricingCardDisplay } from "@/components/home/PricingCardDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormDescription } from "@/components/ui/form";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/routing";
import { useMemo, useState } from "react";

interface PricingCardPreviewProps {
  watchedValues: any;
}

export function PricingCardPreview({ watchedValues }: PricingCardPreviewProps) {
  const [displayLocale, setDisplayLocale] = useState(DEFAULT_LOCALE);

  const previewPlanData = useMemo(() => {
    const currentValues = watchedValues;

    const planForPreview = {
      id: "preview-id",
      ...currentValues,
    };

    return {
      plan: planForPreview,
      localizedPlan:
        (planForPreview.lang_jsonb &&
          JSON.parse(planForPreview.lang_jsonb)[displayLocale]) ||
        {},
    };
  }, [watchedValues, displayLocale]);

  return (
    <div className="mt-8 md:col-span-1 space-y-6 sticky top-20">
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
          {previewPlanData.plan && previewPlanData.localizedPlan && (
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
