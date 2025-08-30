"use client";

import {
  createPricingPlanAction,
  updatePricingPlanAction,
} from "@/actions/prices/admin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEFAULT_LOCALE, LOCALES, useRouter } from "@/i18n/routing";
import { extractJsonFromText, isValidJsonString } from "@/lib/safeJson";
import { formatCurrency } from "@/lib/utils";
import { PricingPlan } from "@/types/pricing";
import { useCompletion } from "@ai-sdk/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Code,
  Info,
  Loader2,
  PlusCircle,
  RefreshCw,
  Trash2,
  Wand2,
  XCircle,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { PricingCardPreview } from "./PricingCardPreview";

const featureSchema = z.object({
  description: z.string().min(1, "Feature description cannot be empty."),
  included: z.boolean().default(true).optional(),
  bold: z.boolean().default(false).optional(),
  href: z.string().optional().nullable(),
});

const pricingPlanFormSchema = z.object({
  environment: z.enum(["test", "live"], {
    required_error: "Environment is required.",
  }),
  card_title: z.string().min(1, "Card title is required."),
  card_description: z.string().optional().nullable(),
  stripe_price_id: z.string().optional().nullable(),
  stripe_product_id: z.string().optional().nullable(),
  stripe_coupon_id: z.string().optional().nullable(),
  enable_manual_input_coupon: z.boolean().optional().nullable(),
  payment_type: z.string().optional().nullable(),
  recurring_interval: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  display_price: z.string().optional().nullable(),
  original_price: z.string().optional().nullable(),
  price_suffix: z.string().optional().nullable(),
  features: z.array(featureSchema).default([]).optional(),
  is_highlighted: z.boolean().optional().nullable(),
  highlight_text: z.string().optional().nullable(),
  button_text: z.string().optional().nullable(),
  button_link: z.string().optional().nullable(),
  display_order: z.coerce.number().int().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
  lang_jsonb: z
    .string()
    .refine(isValidJsonString, { message: "Must be valid JSON or empty." })
    .transform((val) => (val.trim() ? JSON.parse(val) : null))
    .nullable()
    .optional(),
  benefits_jsonb: z
    .string()
    .refine(isValidJsonString, { message: "Must be valid JSON or empty." })
    .transform((val) => (val.trim() ? JSON.parse(val) : null))
    .nullable()
    .optional(),
});

type PricingPlanFormValues = z.infer<typeof pricingPlanFormSchema>;

interface PricePlanFormProps {
  initialData?: PricingPlan | null;
  planId?: string;
}

export function PricePlanForm({ initialData, planId }: PricePlanFormProps) {
  const t = useTranslations("Prices.PricePlanForm");

  const router = useRouter();
  const locale = useLocale();

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingStripe, setIsVerifyingStripe] = useState(false);
  const [isFetchingCoupons, setIsFetchingCoupons] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setIsEditMode(!!planId);
  }, [planId]);

  const form = useForm<PricingPlanFormValues>({
    resolver: zodResolver(pricingPlanFormSchema),
    defaultValues: {
      environment: initialData?.environment ?? "test",
      card_title: initialData?.card_title ?? "",
      card_description: initialData?.card_description ?? "",
      stripe_price_id: initialData?.stripe_price_id ?? "",
      stripe_product_id: initialData?.stripe_product_id ?? "",
      stripe_coupon_id: initialData?.stripe_coupon_id ?? "",
      enable_manual_input_coupon:
        initialData?.enable_manual_input_coupon ?? false,
      payment_type: initialData?.payment_type ?? "",
      recurring_interval: initialData?.recurring_interval ?? "",
      price: initialData?.price ?? undefined,
      currency: initialData?.currency ?? "",
      display_price: initialData?.display_price ?? "",
      original_price: initialData?.original_price ?? "",
      price_suffix: initialData?.price_suffix ?? "",
      features:
        initialData?.features && Array.isArray(initialData.features)
          ? initialData.features.map((f: any) => ({
              description: f?.description ?? "",
              included: typeof f?.included === "boolean" ? f.included : true,
              bold: typeof f?.bold === "boolean" ? f.bold : false,
              href: f?.href ?? "",
            }))
          : [],
      is_highlighted: initialData?.is_highlighted ?? false,
      highlight_text: initialData?.highlight_text ?? "",
      button_text: initialData?.button_text ?? "",
      button_link: initialData?.button_link ?? "",
      display_order: initialData?.display_order ?? 0,
      is_active: initialData?.is_active ?? true,
      lang_jsonb: initialData?.lang_jsonb
        ? JSON.stringify(initialData.lang_jsonb, null, 2)
        : "",
      benefits_jsonb: initialData?.benefits_jsonb
        ? JSON.stringify(initialData.benefits_jsonb, null, 2)
        : "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features",
  });

  const watchedValues = useWatch({ control: form.control });
  const watchStripePriceId = form.watch("stripe_price_id");
  const watchEnvironment = form.watch("environment");
  const watchIsHighlighted = form.watch("is_highlighted");
  const watchStripeCouponId = form.watch("stripe_coupon_id");

  useEffect(() => {
    if (watchStripePriceId !== initialData?.stripe_price_id) {
      form.setValue("stripe_product_id", "", { shouldValidate: true });
      form.setValue("payment_type", "", { shouldValidate: true });
      form.setValue("recurring_interval", "", { shouldValidate: true });
      form.setValue("price", undefined, { shouldValidate: true });
      form.setValue("currency", "", { shouldValidate: true });
    }
  }, [watchStripePriceId, initialData?.stripe_price_id]);

  useEffect(() => {
    const calculateDisplayPrice = async () => {
      const numericPrice = form.getValues("price");
      const currency = form.getValues("currency");
      const originalPrice = form.getValues("original_price");

      if (
        numericPrice === null ||
        numericPrice === undefined ||
        !currency ||
        !originalPrice
      ) {
        return;
      }

      if (!watchStripeCouponId) {
        form.setValue("display_price", originalPrice);
        form.setValue("enable_manual_input_coupon", false);
        return;
      }

      const coupon = coupons.find((c) => c.id === watchStripeCouponId);
      if (!coupon) {
        form.setValue("display_price", originalPrice);
        return;
      }

      let discountedPrice: number;

      if (coupon.percent_off) {
        discountedPrice = numericPrice * (1 - coupon.percent_off / 100);
      } else if (coupon.amount_off) {
        discountedPrice = numericPrice - coupon.amount_off / 100;
      } else {
        form.setValue("display_price", originalPrice);
        return;
      }

      discountedPrice = Math.max(0, discountedPrice);

      const formattedDiscountedPrice = await formatCurrency(
        discountedPrice,
        currency
      );
      form.setValue("display_price", formattedDiscountedPrice, {
        shouldValidate: true,
      });
    };

    calculateDisplayPrice();
  }, [watchStripeCouponId, coupons]);

  const handleFetchCoupons = async () => {
    setIsFetchingCoupons(true);
    try {
      const response = await fetch(`/api/admin/stripe/coupons`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch coupons.");
      }
      const fetchedCoupons = result.data.coupons || [];
      setCoupons(fetchedCoupons);
    } catch (error: any) {
      console.error("Failed to fetch Stripe coupons:", error);
      toast.error("Failed to fetch Stripe coupons", {
        description: error.message,
      });
      setCoupons([]);
    } finally {
      setIsFetchingCoupons(false);
    }
  };

  useEffect(() => {
    handleFetchCoupons();
  }, [watchEnvironment]);

  const handleStripeVerify = async () => {
    const priceId = form.getValues("stripe_price_id");
    const environment = form.getValues("environment");
    if (!priceId) {
      toast.error(t("stripePriceIdRequired"));
      return;
    }
    setIsVerifyingStripe(true);
    try {
      const response = await fetch("/api/admin/stripe/verify-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": (locale || DEFAULT_LOCALE) as string,
        },
        body: JSON.stringify({ priceId, environment }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("verifyStripeError"));
      }

      if (!result.success) {
        throw new Error(result.error || t("verifyStripeError2"));
      }

      form.setValue("stripe_product_id", result.data.productId, {
        shouldValidate: true,
      });
      form.setValue("payment_type", result.data.paymentType, {
        shouldValidate: true,
      });
      form.setValue(
        "recurring_interval",
        result.data.recurring?.interval || "-",
        {
          shouldValidate: true,
        }
      );

      // Price from Stripe is usually in cents, adjust if your DB expects dollars
      // Assuming DB stores numeric/decimal directly (e.g., 99.99)
      const priceInCorrectUnit =
        result.data.price !== null && result.data.price !== undefined
          ? result.data.price / 100
          : undefined;
      const currency = result.data.currency;
      form.setValue("price", priceInCorrectUnit, { shouldValidate: true });
      form.setValue("currency", currency, { shouldValidate: true });

      const formattedPrice = await formatCurrency(priceInCorrectUnit, currency);
      form.setValue("original_price", formattedPrice, {
        shouldValidate: true,
      });
      if (!form.getValues("display_price")) {
        form.setValue("display_price", formattedPrice, {
          shouldValidate: true,
        });
      }
      if (!form.getValues("price_suffix")) {
        form.setValue("price_suffix", result.data.recurring?.interval, {
          shouldValidate: true,
        });
      }
      form.setValue("button_link", "", { shouldValidate: true });

      toast.success(t("stripePriceIdVerified"));
    } catch (error: any) {
      console.error("Stripe verification failed:", error);
      toast.error(t("verifyStripeError"), {
        description: error.message || error.props,
      });
      // Optional
      // form.setValue("stripe_product_id", "");
      // form.setValue("payment_type", "");
      // form.setValue("recurring_interval", "");
      // form.setValue("price", undefined);
      // form.setValue("currency", "");
    } finally {
      setIsVerifyingStripe(false);
    }
  };

  const getLangTemplate = () => {
    const currentValues = form.getValues();
    const locales = LOCALES;
    const currentLocale = (locale || DEFAULT_LOCALE) as string;

    const jsonTemplate = {
      card_title: currentValues.card_title || "",
      card_description: currentValues.card_description || "",
      display_price: currentValues.display_price || "",
      original_price: currentValues.original_price || "",
      currency:
        currentValues.currency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY,
      price_suffix: currentValues.price_suffix || "",
      features:
        currentValues.features && currentValues.features.length > 0
          ? currentValues.features.map((f) => ({
              description: f?.description ?? "",
              included: typeof f?.included === "boolean" ? f.included : true,
              bold: typeof f?.bold === "boolean" ? f.bold : false,
              href: f?.href ?? "",
            }))
          : [],
      highlight_text: currentValues.highlight_text || "",
      button_text: currentValues.button_text || "",
    };

    const emptyTemplate = {
      card_title: "",
      card_description: "",
      display_price: "",
      original_price: "",
      currency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY,
      price_suffix: "",
      features: [],
      highlight_text: "",
      button_text: "",
    };

    const otherLocales = locales.filter((l) => l !== currentLocale);

    const entries = [
      [currentLocale, jsonTemplate] as [string, typeof jsonTemplate],
    ];

    otherLocales.forEach((l) => {
      entries.push([l, emptyTemplate]);
    });

    const template = Object.fromEntries(entries);
    return template;
  };

  const generateLangTemplate = async () => {
    const template = await getLangTemplate();

    form.setValue("lang_jsonb", JSON.stringify(template, null, 2), {
      shouldValidate: true,
    });
    toast.info(t("multiLanguageTemplateGenerated"));
  };

  const translateLangTemplate = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    const template = await getLangTemplate();
    form.setValue("lang_jsonb", "", { shouldValidate: true });

    const prompt = `This is the multilingual configuration for a SaaS product's pricing card. The copy for the default language (${DEFAULT_LOCALE}) is provided below. Acting as a translation expert, please complete the copy for the other languages within the JSON structure, prices and currency units must remain untouched. Ensure all translations are natural and idiomatic, suitable for native speakers. Here is the template: ${JSON.stringify(
      template,
      null,
      2
    )}. Important: Return ONLY the completed JSON, without any explanations or surrounding text. Don't provide JSON markers, only the curly braces and their contents.`;

    await complete(prompt);
  };

  const {
    completion,
    isLoading: isTranslating,
    complete,
  } = useCompletion({
    api: "/api/admin/translate",
    experimental_throttle: 300,
    body: {
      // you can change the model and provider here
      modelId: process.env.NEXT_PUBLIC_AI_MODEL_ID || "",
      provider: process.env.NEXT_PUBLIC_AI_PROVIDER || "",
    },
    onResponse: (response) => {
      // form.setValue("lang_jsonb", completion, { shouldValidate: true });
    },
    onFinish: (prompt: string, completion: string) => {
      const extractedJson = extractJsonFromText(completion);
      if (extractedJson) {
        form.setValue("lang_jsonb", extractedJson, { shouldValidate: true });
      } else {
        console.warn("AI response does not contain valid JSON:", completion);
        toast.error(
          "Translation completed but the response is not valid JSON. Please check and correct manually."
        );
        form.setValue("lang_jsonb", completion, { shouldValidate: false });
      }
    },
    onError: (error: any) => {
      let errorMessage: string;
      try {
        const parsedError = JSON.parse(error.message);
        errorMessage = parsedError.error || t("translateError");
      } catch {
        errorMessage = error.message || t("translateError");
      }
      toast.error(errorMessage);
    },
  });

  useEffect(() => {
    if (completion) {
      const extractedJson = extractJsonFromText(completion);
      if (extractedJson) {
        form.setValue("lang_jsonb", extractedJson, {
          shouldValidate: true,
          shouldDirty: true,
        });
      } else {
        form.setValue("lang_jsonb", completion, {
          shouldValidate: false,
          shouldDirty: true,
        });
      }
    }
  }, [completion]);

  const handleFormatJson = (fieldName: "lang_jsonb" | "benefits_jsonb") => {
    const currentValue = form.getValues(fieldName);
    if (
      !currentValue ||
      typeof currentValue !== "string" ||
      !currentValue.trim()
    ) {
      return;
    }

    const extractedJson = extractJsonFromText(currentValue);
    if (extractedJson) {
      try {
        const parsedJson = JSON.parse(extractedJson);
        const formattedJson = JSON.stringify(parsedJson, null, 2);
        form.setValue(fieldName, formattedJson, { shouldValidate: true });
      } catch (error) {
        console.error(
          `Failed to format extracted JSON in ${fieldName}:`,
          error
        );
        toast.error(`Failed to format extracted JSON in ${fieldName}`);
        form.trigger(fieldName);
      }
    } else {
      console.error(`No valid JSON found in ${fieldName}:`, currentValue);
      toast.error(`No valid JSON found in ${fieldName}`);
      form.trigger(fieldName);
    }
  };

  const onSubmit = async (values: PricingPlanFormValues) => {
    const langJsonError = form.getFieldState("lang_jsonb").error;
    const benefitsJsonError = form.getFieldState("benefits_jsonb").error;

    if (langJsonError || benefitsJsonError) {
      toast.error("Please fix JSON format errors before submitting.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...values,
      };

      let result;
      if (isEditMode && planId) {
        result = await updatePricingPlanAction({
          id: planId,
          planData: payload as Partial<PricingPlan>,
          locale: locale || DEFAULT_LOCALE,
        });
      } else {
        result = await createPricingPlanAction({
          planData: payload as Partial<PricingPlan>,
          locale: locale || DEFAULT_LOCALE,
        });
      }

      if (!result.success) {
        throw new Error(result.error || t("createUpdateError2"));
      }

      toast.success(
        t("createUpdateSuccess", { mode: isEditMode ? "update" : "create" })
      );
      router.push("/dashboard/prices");
    } catch (error: any) {
      console.error(
        `Failed to ${isEditMode ? "update" : "create"} plan:`,
        error
      );
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Core Info & Stripe */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("coreInformation")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Environment *</FormLabel>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                        className="flex flex-row gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="test"></RadioGroupItem>
                          </FormControl>
                          <FormLabel htmlFor="r1">Test</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="live">Live</RadioGroupItem>
                          </FormControl>
                          <FormLabel htmlFor="r1">Live</FormLabel>
                        </FormItem>
                      </RadioGroup>
                      <FormDescription>
                        {t("environmentDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="card_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cardTitle")} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Pro Plan"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="card_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cardDescription")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("cardDescriptionPlaceholder")}
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("stripeIntegration")}</CardTitle>
                <FormDescription>
                  {t("stripeIntegrationDescription")}
                </FormDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="stripe_price_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stripe Price ID</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            placeholder="price_..."
                            {...field}
                            value={field.value ?? ""}
                            disabled={isLoading || isVerifyingStripe}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleStripeVerify}
                          disabled={
                            !watchStripePriceId ||
                            isVerifyingStripe ||
                            isLoading
                          }
                        >
                          {isVerifyingStripe ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {t("verifyAndFetch")}
                        </Button>
                      </div>
                      <FormDescription>
                        {t("stripePriceIdDescription", {
                          environment: watchEnvironment,
                        })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stripe_product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stripe Product ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          readOnly={true}
                          disabled={true}
                          placeholder="Fetched from Stripe"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="payment_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Type</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            readOnly={true}
                            disabled={true}
                            placeholder="Fetched from Stripe"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recurring_interval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurring Interval</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            readOnly={true}
                            disabled={true}
                            placeholder="Fetched from Stripe"
                          />
                        </FormControl>
                        <FormDescription>
                          Required if payment type is &apos;recurring&apos;.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (Numeric)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value)
                              )
                            }
                            readOnly={true}
                            disabled={true}
                            placeholder="Fetched from Stripe"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            readOnly={true}
                            disabled={true}
                            placeholder="Fetched from Stripe"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="stripe_coupon_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stripe Coupon</FormLabel>
                      <div className="flex items-center gap-2">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                          disabled={
                            isLoading ||
                            isFetchingCoupons ||
                            coupons.length === 0
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a coupon (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* <SelectItem value="">No Coupon</SelectItem> */}
                            {coupons.map((coupon) => (
                              <SelectItem key={coupon.id} value={coupon.id}>
                                {coupon.name || coupon.id} (
                                {coupon.percent_off
                                  ? `${coupon.percent_off}% off`
                                  : `${
                                      (coupon.amount_off ?? 0) / 100
                                    } ${coupon.currency?.toUpperCase()} off`}
                                )
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleFetchCoupons}
                          disabled={isFetchingCoupons || isLoading}
                        >
                          {isFetchingCoupons ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground"
                                onClick={() =>
                                  form.setValue("stripe_coupon_id", "", {
                                    shouldValidate: true,
                                  })
                                }
                                disabled={!field.value || isLoading}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Clear selection</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {watchStripeCouponId && (
                  <FormField
                    control={form.control}
                    name="enable_manual_input_coupon"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Allow manual coupon input
                          </FormLabel>
                          <FormDescription>
                            If enabled, users can opt-out of the applied coupon
                            and enter one manually at checkout.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("displayAndContent")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="display_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("displayPrice")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("displayPricePlaceholder")}
                            {...field}
                            value={field.value ?? ""}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("displayPriceDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="original_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("displayOriginalPrice")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("originalPricePlaceholder")}
                            {...field}
                            value={field.value ?? ""}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("displayOriginalPriceDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price_suffix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("displayPriceSuffix")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("priceSuffixPlaceholder")}
                            {...field}
                            value={field.value ?? ""}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("priceSuffixDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Features List */}
                <div>
                  <FormLabel>{t("featuresList")}</FormLabel>
                  <FormDescription className="mb-2">
                    {t("featuresListDescription")}
                  </FormDescription>
                  <div className="space-y-3">
                    {fields.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 p-2 border rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`features.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    placeholder="Feature description"
                                    {...field}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <FormField
                            control={form.control}
                            name={`features.${index}.href`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    placeholder="Feature href"
                                    {...field}
                                    value={field.value ?? ""}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`features.${index}.included`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value ?? false}
                                    onCheckedChange={field.onChange}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal whitespace-nowrap mt-0">
                                  {t("included")}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`features.${index}.bold`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value ?? false}
                                    onCheckedChange={field.onChange}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal whitespace-nowrap mt-0">
                                  {t("bold")}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          description: "",
                          included: true,
                          bold: false,
                          href: "",
                        })
                      }
                      disabled={isLoading}
                      className="mt-2"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> {t("addFeature")}
                    </Button>
                  </div>
                </div>

                {/* Highlight Section */}
                <FormField
                  control={form.control}
                  name="is_highlighted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t("highlightThisPlan")}
                        </FormLabel>
                        <FormDescription>
                          {t("highlightThisPlanDescription")}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {watchIsHighlighted && (
                  <FormField
                    control={form.control}
                    name="highlight_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("highlightText")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Best Value"
                            {...field}
                            value={field.value ?? ""}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("highlightTextDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Button Configuration */}
                <FormField
                  control={form.control}
                  name="button_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("buttonText")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Get Started, Buy Now"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("buttonTextDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="button_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("buttonLink")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("buttonLinkPlaceholder")}
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoading || !!watchStripePriceId}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("buttonLinkDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("multiLanguageTranslations")}</CardTitle>
                <FormDescription>
                  {t("multiLanguageTranslationsDescription")}
                </FormDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-row gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateLangTemplate}
                    disabled={isLoading || isTranslating}
                  >
                    <Zap className="h-4 w-4" /> {t("generateTemplate")}
                  </Button>
                  <div className="flex flex-row items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={translateLangTemplate}
                      disabled={
                        isLoading ||
                        isTranslating ||
                        !process.env.NEXT_PUBLIC_AI_MODEL_ID ||
                        !process.env.NEXT_PUBLIC_AI_PROVIDER
                      }
                    >
                      <Wand2 className="h-4 w-4" /> {t("translateByAI")}
                    </Button>
                    {!process.env.NEXT_PUBLIC_AI_MODEL_ID ||
                    !process.env.NEXT_PUBLIC_AI_PROVIDER ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("translateByAIDescription")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="lang_jsonb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("languageJSON")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            isTranslating
                              ? "Translating..."
                              : `{ "zh": { "card_title": "Nexty.dev 高级启动模板", ... }, "jp": { "card_title": "Nexty.dev 高級起動テンプレート", ... } }`
                          }
                          {...field}
                          value={field.value ?? ""}
                          rows={10}
                          disabled={isLoading || isTranslating}
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        {t("languageJSONDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t("planBenefits")}</CardTitle>
                <FormDescription>
                  {t("planBenefitsDescription")}
                </FormDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="benefits_jsonb"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-1">
                        <FormLabel>{t("benefitsJSON")}</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleFormatJson("benefits_jsonb")}
                          disabled={isLoading}
                          className="gap-1"
                        >
                          <Code className="h-3 w-3" />
                          {t("formatJson")}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder={`{\n  "monthly_credits": 500,\n  "one_time_credits": 0,\n  "other_feature": true\n}`}
                          {...field}
                          value={field.value ?? ""}
                          rows={8}
                          disabled={isLoading}
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        {t("benefitsJSONDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Settings & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="display_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("displayOrder")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          disabled={isLoading}
                          value={field.value ?? 0}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("displayOrderDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t("activeStatus")}
                        </FormLabel>
                        <FormDescription>
                          {t("activeStatusDescription")}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Alert
              variant="default"
              className="border-amber-500 bg-amber-50 dark:bg-amber-950/20"
            >
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-600 dark:text-amber-400">
                Note
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                {t("pleaseEnterLanguageData")}
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isLoading || isVerifyingStripe}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isEditMode ? t("saveChanges") : t("createPlan")}
              </Button>
            </div>

            {/* Pricing Card Preview */}
            <PricingCardPreview
              watchedValues={
                isTranslating
                  ? { ...watchedValues, lang_jsonb: "" }
                  : watchedValues
              }
            />
          </div>
        </div>
      </form>
    </Form>
  );
}
