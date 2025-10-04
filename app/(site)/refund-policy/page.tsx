import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { constructMetadata } from "@/lib/metadata";
import { HomeIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Refund Policy",
    description: `Refund policy and guidelines for ${siteConfig.name} services.`,
    path: `/refund-policy`,
  });
}

export default function RefundPolicyPage() {
  return (
    <div className="bg-secondary/20 py-8 sm:py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-background rounded-xl border p-6 shadow-sm sm:p-8 dark:border-zinc-800">
          <h1 className="mb-6 text-2xl font-bold sm:text-3xl">
            Refund Policy(Template)
          </h1>

          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-xl font-semibold">Introduction</h2>
              <p className="mb-3">
                At {siteConfig.name}, we strive to provide high-quality services
                and ensure customer satisfaction. This Refund Policy outlines
                the terms and conditions for refunds of payments made for our
                services. By purchasing our services, you agree to the terms set
                forth in this policy.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">Refund Eligibility</h2>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">
                  1. Subscription Services
                </h3>
                <p className="mb-3">
                  For our subscription-based services, refunds may be available
                  under the following circumstances:
                </p>
                <ul className="mb-3 list-disc space-y-1 pl-6">
                  <li>
                    <strong>Service Downtime</strong>: If our service is down
                    for more than 24 continuous hours due to technical issues on
                    our end
                  </li>
                  <li>
                    <strong>Billing Errors</strong>: If you were charged
                    incorrectly due to a system error or payment processing
                    mistake
                  </li>
                  <li>
                    <strong>Unauthorized Charges</strong>: If charges were made
                    without your authorization (subject to verification)
                  </li>
                  <li>
                    <strong>Service Not as Described</strong>: If the service
                    fundamentally differs from what was advertised (determined
                    on a case-by-case basis)
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">
                  2. Credit-Based Services
                </h3>
                <p className="mb-3">
                  For services that use a credit or usage-based billing model:
                </p>
                <ul className="mb-3 list-disc space-y-1 pl-6">
                  <li>
                    <strong>Unused Credits</strong>: Credits that have not been
                    used may be eligible for refund within 30 days of purchase
                  </li>
                  <li>
                    <strong>Technical Failures</strong>: If credits were
                    consumed due to technical errors on our platform, we will
                    restore the credits or provide a refund
                  </li>
                  <li>
                    <strong>Service Quality Issues</strong>: If the service
                    output does not meet basic quality standards due to system
                    issues
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">
                  3. One-Time Purchases
                </h3>
                <p className="mb-3">
                  For one-time purchases or single transactions:
                </p>
                <ul className="mb-3 list-disc space-y-1 pl-6">
                  <li>
                    Refunds are available within 14 days of purchase if the
                    service was not delivered as promised
                  </li>
                  <li>
                    Digital products or services that have been successfully
                    delivered and used are generally not eligible for refunds
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">
                Non-Refundable Items
              </h2>
              <p className="mb-3">
                The following items are generally not eligible for refunds:
              </p>
              <ul className="mb-3 list-disc space-y-1 pl-6">
                <li>
                  <strong>Consumed Services</strong>: Services that have been
                  fully used or consumed (e.g., API calls, processing credits)
                </li>
                <li>
                  <strong>Change of Mind</strong>: Refunds due to change of mind
                  or no longer needing the service
                </li>
                <li>
                  <strong>User Error</strong>: Issues arising from user error,
                  misuse, or failure to follow service guidelines
                </li>
                <li>
                  <strong>Third-Party Issues</strong>: Problems caused by
                  third-party services, internet connectivity, or user's
                  equipment
                </li>
                <li>
                  <strong>Expired Services</strong>: Services or credits that
                  have expired according to their terms
                </li>
                <li>
                  <strong>Promotional Offers</strong>: Services purchased at
                  discounted rates or through promotional offers (unless
                  required by law)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">Refund Process</h2>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">
                  1. How to Request a Refund
                </h3>
                <p className="mb-3">
                  To request a refund, please contact us with the following
                  information:
                </p>
                <ul className="mb-3 list-disc space-y-1 pl-6">
                  <li>Your account email address</li>
                  <li>Transaction ID or payment reference</li>
                  <li>Date of purchase</li>
                  <li>Detailed reason for the refund request</li>
                  <li>
                    Any supporting documentation (screenshots, error messages,
                    etc.)
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">
                  2. Refund Review Process
                </h3>
                <p className="mb-3">Our refund review process includes:</p>
                <ul className="mb-3 list-disc space-y-1 pl-6">
                  <li>
                    <strong>Initial Review</strong>: We will acknowledge your
                    request within 2 business days
                  </li>
                  <li>
                    <strong>Investigation</strong>: Our team will investigate
                    your case within 5-7 business days
                  </li>
                  <li>
                    <strong>Decision</strong>: You will receive a decision
                    within 10 business days of your initial request
                  </li>
                  <li>
                    <strong>Processing</strong>: If approved, refunds are
                    processed within 3-5 business days
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">3. Refund Methods</h3>
                <p className="mb-3">
                  Refunds will be processed using the following methods:
                </p>
                <ul className="mb-3 list-disc space-y-1 pl-6">
                  <li>
                    <strong>Original Payment Method</strong>: Refunds are
                    typically processed back to the original payment method used
                    for the purchase
                  </li>
                  <li>
                    <strong>Account Credit</strong>: In some cases, we may offer
                    account credit instead of a cash refund
                  </li>
                  <li>
                    <strong>Alternative Methods</strong>: For certain
                    situations, alternative refund methods may be discussed on a
                    case-by-case basis
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">
                Special Circumstances
              </h2>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">
                  1. Emergency Situations
                </h3>
                <p className="mb-3">
                  In case of emergency situations such as natural disasters,
                  health emergencies, or other unforeseen circumstances, we may
                  offer special refund considerations. Please contact us to
                  discuss your specific situation.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">
                  2. Legal Requirements
                </h3>
                <p className="mb-3">
                  In jurisdictions where local laws provide additional consumer
                  protection or mandatory refund rights, those laws will take
                  precedence over this policy. We comply with all applicable
                  consumer protection laws.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">
                  3. Subscription Cancellations
                </h3>
                <p className="mb-3">
                  You may cancel your subscription at any time. Cancellations
                  will take effect at the end of the current billing cycle.
                  Unless eligible under this refund policy, no refund will be
                  provided for the remaining portion of the billing period.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">Dispute Resolution</h2>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">
                  1. Internal Resolution
                </h3>
                <p className="mb-3">
                  If you disagree with our refund decision, you may request a
                  review by a senior team member. Please provide additional
                  information or documentation that supports your case.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">2. Chargebacks</h3>
                <p className="mb-3">
                  We encourage you to contact us directly before initiating a
                  chargeback with your payment provider. Chargebacks may result
                  in the suspension of your account and additional fees.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">
                Changes to This Policy
              </h2>
              <p className="mb-3">
                We may update this Refund Policy from time to time to reflect
                changes in our services, legal requirements, or business
                practices. When we make significant changes, we will notify
                users via email or through our website. The updated policy will
                be effective immediately upon posting.
              </p>
              <p className="mb-3">
                We encourage you to review this policy periodically to stay
                informed about our refund terms and conditions.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">Contact Us</h2>
              <p className="mb-3">
                If you have any questions about this Refund Policy or need to
                request a refund, please contact us through:
              </p>
              <ul className="mb-3 list-disc space-y-1 pl-6">
                {siteConfig.socialLinks?.discord && (
                  <li>
                    <strong>Discord</strong>:{" "}
                    <a
                      href={siteConfig.socialLinks.discord}
                      className="text-primary hover:underline"
                    >
                      Join our Discord server
                    </a>
                  </li>
                )}
                {siteConfig.socialLinks?.email && (
                  <li>
                    <strong>Email</strong>:{" "}
                    <a
                      href={`mailto:${siteConfig.socialLinks.email}`}
                      className="hover:underline text-blue-500"
                    >
                      {siteConfig.socialLinks.email}
                    </a>
                  </li>
                )}
              </ul>
              <p className="mb-3">
                We are committed to providing fair and transparent refund
                services. Please allow us the opportunity to resolve any issues
                before seeking alternative remedies.
              </p>
            </section>
          </div>

          <Separator />

          <div className="mt-8">
            <Link
              href="/"
              className="text-primary hover:underline flex items-center gap-2"
              title="Return to Home"
            >
              <HomeIcon className="size-4" /> Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
