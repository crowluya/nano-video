import CurrentUserBenefitsDisplay from "@/components/layout/CurrentUserBenefitsDisplay";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import {
  createStripePortalSession,
  getUserBenefits,
} from "@/lib/stripe/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const benefits = await getUserBenefits(user.id);

  const isMember =
    benefits.subscriptionStatus === "active" ||
    benefits.subscriptionStatus === "trialing";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription plan and billing details.
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        {isMember ? (
          <>
            <CurrentUserBenefitsDisplay />
            <form action={createStripePortalSession}>
              <Button type="submit" variant="outline">
                Manage Subscription & Billing
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              You will be redirected to Stripe to manage your subscription
              details.
            </p>
          </>
        ) : (
          <>
            <p>You are currently not subscribed to any plan.</p>
            <Button asChild className="h-11 px-6 font-medium highlight-button">
              <I18nLink
                href={process.env.NEXT_PUBLIC_PRICING_PATH!}
                title="Upgrade Plan"
              >
                Upgrade Plan
              </I18nLink>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
