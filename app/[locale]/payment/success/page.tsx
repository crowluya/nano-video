"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEFAULT_LOCALE, Link as I18nLink, useRouter } from "@/i18n/routing";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  CreditCard,
  Home,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SuccessContent() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [paymentData, setPaymentData] = useState<{
    message: string;
    orderId?: string;
    subscriptionId?: string;
    planName?: string;
  }>({
    message: "Verifying your payment...",
  });

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setPaymentData({
        message: "Checkout session ID missing. Payment cannot be verified.",
      });
      return;
    }

    const verifySession = async () => {
      try {
        const response = await fetch(
          `/api/payment/verify-success?session_id=${sessionId}`,
          {
            headers: {
              "Accept-Language": (locale || DEFAULT_LOCALE) as string,
            },
          }
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Verification failed.");
        }

        if (!result.success) {
          throw new Error(result.error || "Verification failed.");
        }

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.7 },
        });
        setStatus("success");
        setPaymentData({
          message:
            result.data.message ||
            "Payment successful! Your plan have been updated.",
          orderId: result.data.orderId,
          subscriptionId: result.data.subscriptionId,
          planName: result.data.planName,
        });
      } catch (error) {
        setStatus("error");
        setPaymentData({
          message:
            error instanceof Error
              ? error.message
              : "An error occurred during verification.",
        });
      }
    };

    verifySession();
  }, [sessionId]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const renderVerifying = () => (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 mb-6 text-primary animate-spin" />
      <h1 className="text-2xl font-semibold mb-2">Verifying Your Payment</h1>
      <p className="text-muted-foreground text-center max-w-md">
        {paymentData.message}
      </p>
    </div>
  );

  const renderSuccess = () => (
    <motion.div
      className="flex flex-col items-center w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeIn} className="mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-green-100 rounded-full scale-150 opacity-20 animate-pulse"></div>
          <CheckCircle className="w-20 h-20 text-green-500 relative z-10" />
        </div>
      </motion.div>

      <motion.h1 variants={fadeIn} className="text-3xl font-bold mb-2">
        Payment Successful!
      </motion.h1>
      <motion.p
        variants={fadeIn}
        className="text-muted-foreground text-center mb-8 max-w-md"
      >
        {paymentData.message}
      </motion.p>

      <motion.div variants={fadeIn} className="w-full max-w-md mb-8">
        <Card className="p-6 bg-muted/50">
          <h3 className="font-medium mb-4">Payment Details</h3>
          <div className="space-y-3 text-sm">
            {paymentData.orderId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-medium">
                  {paymentData.orderId || "-"}
                </span>
              </div>
            )}
            {paymentData.subscriptionId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscription ID:</span>
                <span className="font-medium">
                  {paymentData.subscriptionId || "-"}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan:</span>
              <span className="font-medium">{paymentData.planName || "-"}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        variants={fadeIn}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
      >
        <Button
          variant="outline"
          className="flex-1 gap-2 highlight-button"
          asChild
          size="lg"
        >
          <I18nLink href="/" title="Back to Home" prefetch={true}>
            <Home className="w-4 h-4" />
            Back to Home <ArrowRight className="w-4 h-4" />
          </I18nLink>
        </Button>
        <Button className="flex-1 gap-2" asChild size="lg">
          <I18nLink href="/dashboard" title="Go to Dashboard" prefetch={true}>
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </I18nLink>
        </Button>
      </motion.div>
    </motion.div>
  );

  const renderError = () => (
    <motion.div
      className="flex flex-col items-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeIn} className="mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-red-100 rounded-full scale-150 opacity-20"></div>
          <XCircle className="w-20 h-20 text-red-500 relative z-10" />
        </div>
      </motion.div>

      <motion.h1 variants={fadeIn} className="text-3xl font-bold mb-2">
        Payment Verification Failed
      </motion.h1>
      <motion.p
        variants={fadeIn}
        className="text-muted-foreground text-center mb-8 max-w-md"
      >
        {paymentData.message}
      </motion.p>

      <motion.div
        variants={fadeIn}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
      >
        <Button className="flex-1 gap-2" asChild>
          <I18nLink
            href={process.env.NEXT_PUBLIC_PRICING_PATH!}
            title="Back to Home"
            prefetch={true}
          >
            <CreditCard className="w-4 h-4" /> Back to Home
          </I18nLink>
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => router.refresh()}
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </Button>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 sm:p-8">
      {status === "verifying" && renderVerifying()}
      {status === "success" && renderSuccess()}
      {status === "error" && renderError()}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="container max-w-screen-xl mx-auto">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
            <Loader2 className="w-12 h-12 mb-4 text-primary animate-spin" />
            <h1 className="text-2xl font-semibold mb-2">
              Loading Payment Status
            </h1>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </main>
  );
}
