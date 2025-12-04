"use client";

import {
  createPricingPlanAction,
  updatePricingPlanAction,
} from "@/actions/prices/admin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChoiceboxGroup } from "@/components/ui/choicebox-1";
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
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { extractJsonFromText, isValidJsonString } from "@/lib/safeJson";
import { formatCurrency } from "@/lib/utils";
import { useCompletion } from "@ai-sdk/react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Code,
  GripVertical,
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
import React, { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { PricingCardPreview } from "./PricingCardPreview";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

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
  cardTitle: z.string().min(1, "Card title is required."),
  cardDescription: z.string().optional().nullable(),
  provider: z.enum(["none", "stripe", "creem"]),
  stripePriceId: z.string().optional().nullable(),
  stripeProductId: z.string().optional().nullable(),
  stripeCouponId: z.string().optional().nullable(),
  enableManualInputCoupon: z.boolean().optional().nullable(),
  creemProductId: z.string().optional().nullable(),
  creemDiscountCode: z.string().optional().nullable(),
  paymentType: z.string().optional().nullable(),
  recurringInterval: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  displayPrice: z.string().optional().nullable(),
  originalPrice: z.string().optional().nullable(),
  priceSuffix: z.string().optional().nullable(),
  features: z.array(featureSchema).default([]).optional(),
  isHighlighted: z.boolean().optional().nullable(),
  highlightText: z.string().optional().nullable(),
  buttonText: z.string().optional().nullable(),
  buttonLink: z.string().optional().nullable(),
  displayOrder: z.coerce.number().int().optional().nullable(),
  isActive: z.boolean().optional().nullable(),
  langJsonb: z
    .string()
    .refine(isValidJsonString, { message: "Must be valid JSON or empty." })
    .transform((val) => (val.trim() ? JSON.parse(val) : null))
    .nullable()
    .optional(),
  benefitsJsonb: z
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
  const [isVerifyingCreem, setIsVerifyingCreem] = useState(false);
  const [isVerifyingCreemDiscount, setIsVerifyingCreemDiscount] =
    useState(false);
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
      cardTitle: initialData?.cardTitle ?? "",
      cardDescription: initialData?.cardDescription ?? "",
      provider: initialData?.provider ?? "stripe",
      stripePriceId: initialData?.stripePriceId ?? "",
      stripeProductId: initialData?.stripeProductId ?? "",
      stripeCouponId: initialData?.stripeCouponId ?? "",
      enableManualInputCoupon: initialData?.enableManualInputCoupon ?? false,
      creemProductId: initialData?.creemProductId ?? "",
      creemDiscountCode: initialData?.creemDiscountCode ?? "",
      paymentType: initialData?.paymentType ?? "",
      recurringInterval: initialData?.recurringInterval ?? "",
      price: Number(initialData?.price) ?? undefined,
      currency: initialData?.currency ?? "",
      displayPrice: initialData?.displayPrice ?? "",
      originalPrice: initialData?.originalPrice ?? "",
      priceSuffix: initialData?.priceSuffix ?? "",
      features:
        initialData?.features && Array.isArray(initialData.features)
          ? initialData.features.map((f: any) => ({
              description: f?.description ?? "",
              included: typeof f?.included === "boolean" ? f.included : true,
              bold: typeof f?.bold === "boolean" ? f.bold : false,
              href: f?.href ?? "",
            }))
          : [],
      isHighlighted: initialData?.isHighlighted ?? false,
      highlightText: initialData?.highlightText ?? "",
      buttonText: initialData?.buttonText ?? "",
      buttonLink: initialData?.buttonLink ?? "",
      displayOrder: initialData?.displayOrder ?? 0,
      isActive: initialData?.isActive ?? true,
      langJsonb: initialData?.langJsonb
        ? JSON.stringify(initialData.langJsonb, null, 2)
        : "",
      benefitsJsonb: initialData?.benefitsJsonb
        ? JSON.stringify(initialData.benefitsJsonb, null, 2)
        : "",
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "features",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFields = arrayMove(fields, oldIndex, newIndex);
        form.setValue("features", newFields, { shouldValidate: true });
      }
    }
  };

  const watchedValues = useWatch({ control: form.control });
  const watchProvider = form.watch("provider");
  const watchStripePriceId = form.watch("stripePriceId");
  const watchCreemProductId = form.watch("creemProductId");
  const watchCreemDiscountCode = form.watch("creemDiscountCode");
  const watchEnvironment = form.watch("environment");
  const watchIsHighlighted = form.watch("isHighlighted");
  const watchStripeCouponId = form.watch("stripeCouponId");

  // useEffect(() => {
  //   if (watchStripePriceId !== initialData?.stripePriceId) {
  //     form.setValue("stripeProductId", "", { shouldValidate: true });
  //     form.setValue("paymentType", null, { shouldValidate: true });
  //     form.setValue("recurringInterval", null, { shouldValidate: true });
  //     form.setValue("price", undefined, { shouldValidate: true });
  //     form.setValue("currency", "", { shouldValidate: true });
  //   }
  // }, [watchStripePriceId, initialData?.stripePriceId]);

  // useEffect(() => {
  //   if (watchCreemProductId !== initialData?.creemProductId) {
  //     form.setValue("paymentType", null, { shouldValidate: true });
  //     form.setValue("recurringInterval", null, { shouldValidate: true });
  //     form.setValue("price", undefined, { shouldValidate: true });
  //     form.setValue("currency", "", { shouldValidate: true });
  //   }
  // }, [watchCreemProductId, initialData?.creemProductId]);

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
    if (watchProvider === "stripe") {
      handleFetchCoupons();
    }
  }, [watchEnvironment, watchProvider]);

  const handleStripeVerify = async () => {
    const priceId = form.getValues("stripePriceId");
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

      form.setValue("stripeProductId", result.data.productId, {
        shouldValidate: true,
      });
      form.setValue("paymentType", result.data.paymentType, {
        shouldValidate: true,
      });
      form.setValue(
        "recurringInterval",
        result.data.recurring?.interval || null,
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

      if (!form.getValues("priceSuffix")) {
        form.setValue("priceSuffix", result.data.recurring?.interval, {
          shouldValidate: true,
        });
      }
      form.setValue("buttonLink", "", { shouldValidate: true });

      toast.success(t("stripePriceIdVerified"));
    } catch (error: any) {
      console.error("Stripe verification failed:", error);
      toast.error(t("verifyStripeError"), {
        description: error.message || error.props,
      });
      // Optional
      // form.setValue("stripeProductId", "");
      // form.setValue("paymentType", null);
      // form.setValue("recurringInterval", null);
      // form.setValue("price", undefined);
      // form.setValue("currency", "");
    } finally {
      setIsVerifyingStripe(false);
    }
  };

  const handleCreemVerify = async () => {
    const productId = form.getValues("creemProductId");
    const environment = form.getValues("environment");
    if (!productId) {
      toast.error("Creem Product ID is required");
      return;
    }
    setIsVerifyingCreem(true);
    try {
      const response = await fetch("/api/admin/creem/verify-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": (locale || DEFAULT_LOCALE) as string,
        },
        body: JSON.stringify({ productId, environment }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify Creem product");
      }

      if (!result.success) {
        throw new Error(result.error || "Creem product verification failed");
      }

      const paymentType = result.data.billingType;
      const recurringInterval = result.data.billingPeriod;

      form.setValue("paymentType", paymentType, {
        shouldValidate: true,
      });
      form.setValue("recurringInterval", recurringInterval || null, {
        shouldValidate: true,
      });

      // Price from Creem is in cents, convert to dollars
      const priceInCorrectUnit =
        result.data.price !== null && result.data.price !== undefined
          ? result.data.price / 100
          : undefined;
      const currency = result.data.currency;
      form.setValue("price", priceInCorrectUnit, { shouldValidate: true });
      form.setValue("currency", currency, { shouldValidate: true });

      const formattedPrice = await formatCurrency(priceInCorrectUnit, currency);
      form.setValue("originalPrice", formattedPrice, {
        shouldValidate: true,
      });
      if (!form.getValues("displayPrice")) {
        form.setValue("displayPrice", formattedPrice, {
          shouldValidate: true,
        });
      }
      if (!form.getValues("priceSuffix") && recurringInterval) {
        form.setValue("priceSuffix", recurringInterval, {
          shouldValidate: true,
        });
      }
      form.setValue("buttonLink", "", { shouldValidate: true });

      toast.success("Creem product verified successfully");
    } catch (error: any) {
      console.error("Creem verification failed:", error);
      toast.error("Failed to verify Creem product", {
        description: error.message || error.props,
      });
    } finally {
      setIsVerifyingCreem(false);
    }
  };

  const handleCreemDiscountVerify = async () => {
    const discountCode = form.getValues("creemDiscountCode");
    const environment = form.getValues("environment");
    if (!discountCode) {
      toast.error("Creem Discount Code is required");
      return;
    }
    setIsVerifyingCreemDiscount(true);
    try {
      const response = await fetch("/api/admin/creem/verify-discount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": (locale || DEFAULT_LOCALE) as string,
        },
        body: JSON.stringify({ discountCode, environment }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify Creem discount code");
      }

      if (!result.success) {
        throw new Error(
          result.error || "Creem discount code verification failed"
        );
      }

      toast.success("Creem discount code verified successfully", {
        description: `Code: ${result.data.code} - ${result.data.type === "percentage" ? `${result.data.percentage}% off` : `${result.data.amount / 100} ${result.data.currency?.toUpperCase()} off`}`,
      });
    } catch (error: any) {
      console.error("Creem discount verification failed:", error);
      toast.error("Failed to verify Creem discount code", {
        description: error.message || error.props,
      });
    } finally {
      setIsVerifyingCreemDiscount(false);
    }
  };

  const getLangTemplate = () => {
    const currentValues = form.getValues();
    const locales = LOCALES;
    const currentLocale = (locale || DEFAULT_LOCALE) as string;

    const jsonTemplate = {
      cardTitle: currentValues.cardTitle || "",
      cardDescription: currentValues.cardDescription || "",
      displayPrice: currentValues.displayPrice || "",
      originalPrice: currentValues.originalPrice || "",
      currency:
        currentValues.currency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY,
      priceSuffix: currentValues.priceSuffix || "",
      features:
        currentValues.features && currentValues.features.length > 0
          ? currentValues.features.map((f) => ({
              description: f?.description ?? "",
              included: typeof f?.included === "boolean" ? f.included : true,
              bold: typeof f?.bold === "boolean" ? f.bold : false,
              href: f?.href ?? "",
            }))
          : [],
      highlightText: currentValues.highlightText || "",
      buttonText: currentValues.buttonText || "",
    };

    const emptyTemplate = {
      cardTitle: "",
      cardDescription: "",
      displayPrice: "",
      originalPrice: "",
      currency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY,
      priceSuffix: "",
      features: [],
      highlightText: "",
      buttonText: "",
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

    form.setValue("langJsonb", JSON.stringify(template, null, 2), {
      shouldValidate: true,
    });
  };

  const translateLangTemplate = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    const template = await getLangTemplate();
    form.setValue("langJsonb", "", { shouldValidate: true });

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
      // form.setValue("langJsonb", completion, { shouldValidate: true });
    },
    onFinish: (prompt: string, completion: string) => {
      const extractedJson = extractJsonFromText(completion);
      if (extractedJson) {
        form.setValue("langJsonb", extractedJson, { shouldValidate: true });
      } else {
        console.warn("AI response does not contain valid JSON:", completion);
        toast.error(
          "Translation completed but the response is not valid JSON. Please check and correct manually."
        );
        form.setValue("langJsonb", completion, { shouldValidate: false });
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
        form.setValue("langJsonb", extractedJson, {
          shouldValidate: true,
          shouldDirty: true,
        });
      } else {
        form.setValue("langJsonb", completion, {
          shouldValidate: false,
          shouldDirty: true,
        });
      }
    }
  }, [completion]);

  const handleFormatJson = (fieldName: "langJsonb" | "benefitsJsonb") => {
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
    const langJsonError = form.getFieldState("langJsonb").error;
    const benefitsJsonError = form.getFieldState("benefitsJsonb").error;

    if (langJsonError || benefitsJsonError) {
      toast.error("Please fix JSON format errors before submitting.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...values,
      };

      // Clean up fields based on provider
      if (payload.provider === "stripe") {
        // Remove Creem fields when provider is Stripe
        payload.creemProductId = null;
        payload.creemDiscountCode = null;
      } else if (payload.provider === "creem") {
        // Remove Stripe fields when provider is Creem
        payload.stripePriceId = null;
        payload.stripeProductId = null;
        payload.stripeCouponId = null;
        payload.enableManualInputCoupon = false;
      } else if (payload.provider === "none") {
        // Remove all fields when provider is none
        payload.stripePriceId = null;
        payload.stripeProductId = null;
        payload.stripeCouponId = null;
        payload.creemProductId = null;
        payload.creemDiscountCode = null;
        payload.enableManualInputCoupon = false;
      }

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Core Info & Stripe */}
          <div className="lg:col-span-2 space-y-6">
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
                        <FormItem className="flex items-center">
                          <FormControl>
                            <RadioGroupItem value="test"></RadioGroupItem>
                          </FormControl>
                          <FormLabel htmlFor="r1">Test</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center">
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
                  name="cardTitle"
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
                  name="cardDescription"
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
                <CardTitle>Payment</CardTitle>
                <FormDescription>
                  Configure payment provider settings for this pricing plan
                </FormDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => {
                    const handleChange = (value: string | string[]) => {
                      field.onChange(
                        typeof value === "string" ? value : value[0]
                      );
                    };
                    return (
                      <FormItem>
                        <FormControl>
                          <ChoiceboxGroup
                            direction="row"
                            type="radio"
                            value={field.value || "stripe"}
                            onChange={
                              handleChange as React.Dispatch<
                                React.SetStateAction<string>
                              >
                            }
                            disabled={isLoading}
                          >
                            <ChoiceboxGroup.Item
                              value="none"
                              title="No Payment"
                            />
                            <ChoiceboxGroup.Item
                              value="stripe"
                              title="Stripe"
                            />
                            <ChoiceboxGroup.Item value="creem" title="Creem" />
                          </ChoiceboxGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {watchProvider !== "none" && (
                  <>
                    {watchProvider === "stripe" && (
                      <>
                        <FormField
                          control={form.control}
                          name="stripePriceId"
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
                          name="stripeProductId"
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
                      </>
                    )}
                    {watchProvider === "creem" && (
                      <FormField
                        control={form.control}
                        name="creemProductId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Creem Product ID</FormLabel>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input
                                  placeholder="prod_..."
                                  {...field}
                                  value={field.value ?? ""}
                                  disabled={isLoading || isVerifyingCreem}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleCreemVerify}
                                disabled={
                                  !watchCreemProductId ||
                                  isVerifyingCreem ||
                                  isLoading
                                }
                              >
                                {isVerifyingCreem ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Verify & Fetch
                              </Button>
                            </div>
                            <FormDescription>
                              Enter the Creem product ID for {watchEnvironment}{" "}
                              environment
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="paymentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Type</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                readOnly={true}
                                disabled={true}
                                placeholder="Fetched from provider"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="recurringInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recurring Interval</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                readOnly={true}
                                disabled={true}
                                placeholder="Fetched from provider"
                              />
                            </FormControl>
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
                                value={
                                  Number.isNaN(field.value)
                                    ? 0
                                    : (field.value ?? 0)
                                }
                                onChange={(event) =>
                                  field.onChange(
                                    event.target.value === ""
                                      ? null
                                      : Number(event.target.value)
                                  )
                                }
                                readOnly={true}
                                disabled={true}
                                placeholder="Fetched from provider"
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
                                placeholder="Fetched from provider"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {watchProvider === "stripe" && (
                      <>
                        <FormField
                          control={form.control}
                          name="stripeCouponId"
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
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select a coupon (optional)" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {/* <SelectItem value="">No Coupon</SelectItem> */}
                                    {coupons.map((coupon) => (
                                      <SelectItem
                                        key={coupon.id}
                                        value={coupon.id}
                                      >
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
                                          form.setValue("stripeCouponId", "", {
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
                            name="enableManualInputCoupon"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Allow manual coupon input
                                  </FormLabel>
                                  <FormDescription>
                                    If enabled, users can opt-out of the applied
                                    coupon and enter one manually at checkout.
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
                      </>
                    )}
                    {watchProvider === "creem" && (
                      <>
                        <FormField
                          control={form.control}
                          name="creemDiscountCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Creem Discount Code</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input
                                    placeholder="Enter discount code (optional)"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                      // Auto-convert to uppercase
                                      field.onChange(
                                        e.target.value.toUpperCase()
                                      );
                                    }}
                                    disabled={
                                      isLoading || isVerifyingCreemDiscount
                                    }
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleCreemDiscountVerify}
                                  disabled={
                                    !watchCreemDiscountCode ||
                                    isVerifyingCreemDiscount ||
                                    isLoading
                                  }
                                >
                                  {isVerifyingCreemDiscount ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  Verify
                                </Button>
                              </div>
                              <FormDescription>
                                Optional discount code for this Creem product
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </>
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
                    name="displayPrice"
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
                    name="originalPrice"
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
                    name="priceSuffix"
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={fields.map((field) => field.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {fields.map((item, index) => (
                          <SortableFeatureItem
                            key={item.id}
                            id={item.id}
                            index={index}
                            form={form}
                            remove={remove}
                            isLoading={isLoading}
                            t={t}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
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

                {/* Highlight Section */}
                <FormField
                  control={form.control}
                  name="isHighlighted"
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
                    name="highlightText"
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
                  name="buttonText"
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
                  name="buttonLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("buttonLink")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("buttonLinkPlaceholder")}
                          {...field}
                          value={field.value ?? ""}
                          disabled={
                            isLoading ||
                            !!watchStripePriceId ||
                            !!watchCreemProductId
                          }
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
                  name="langJsonb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("languageJSON")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            isTranslating
                              ? "Translating..."
                              : `{ "zh": { "cardTitle": "NEXTY.DEV 高级启动模板", ... }, "jp": { "cardTitle": "NEXTY.DEV 高級起動テンプレート", ... } }`
                          }
                          {...field}
                          value={field.value ?? ""}
                          rows={10}
                          disabled={isLoading || isTranslating}
                          className="font-mono text-sm min-h-[200px] max-h-[500px] overflow-y-auto"
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
                  name="benefitsJsonb"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-1">
                        <BenefitsTemplateButtons
                          onSelectTemplate={(template) => {
                            form.setValue("benefitsJsonb", template, {
                              shouldValidate: true,
                            });
                          }}
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleFormatJson("benefitsJsonb")}
                          disabled={isLoading}
                          className="gap-1"
                        >
                          <Code className="h-3 w-3" />
                          {t("formatJson")}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder={`{\n  "monthlyCredits": 1000,\n  "oneTimeCredits": 1000,\n  "totalMonths": 12\n}`}
                          {...field}
                          value={field.value ?? ""}
                          rows={8}
                          disabled={isLoading}
                          className="font-mono text-sm min-h-[200px] max-h-[500px] overflow-y-auto"
                        />
                      </FormControl>
                      <FormDescription>
                        {t("benefitsJSONDescription")} Use the quick insert
                        buttons above for common credit patterns.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings")}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border p-4">
                      <FormLabel>{t("displayOrder")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          disabled={isLoading}
                          value={
                            Number.isNaN(field.value) ? 0 : (field.value ?? 0)
                          }
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
                  name="isActive"
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

            {/* Action Buttons - Below form on mobile, below left column on desktop */}
            <div className="flex justify-end gap-3 pt-6 pb-12 border-t">
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
          </div>

          {/* Column 2: Preview - Sticky on desktop, below buttons on mobile */}
          <div className="lg:sticky lg:top-16 lg:self-start space-y-4">
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

            {/* Pricing Card Preview */}
            <PricingCardPreview
              watchedValues={
                isTranslating
                  ? { ...watchedValues, langJsonb: "" }
                  : watchedValues
              }
            />
          </div>
        </div>
      </form>
    </Form>
  );
}

/**
 * Sortable Feature Item Component
 * Wraps each feature item with drag-and-drop functionality
 */
interface SortableFeatureItemProps {
  id: string;
  index: number;
  form: any;
  remove: (index: number) => void;
  isLoading: boolean;
  t: any;
}

function SortableFeatureItem({
  id,
  index,
  form,
  remove,
  isLoading,
  t,
}: SortableFeatureItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
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
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing touch-none p-2 hover:bg-accent rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

/**
 * Benefits Template Buttons Component
 * Provides quick template buttons for common benefits configurations
 */
interface BenefitsTemplateButtonsProps {
  onSelectTemplate: (template: string) => void;
  disabled?: boolean;
}

function BenefitsTemplateButtons({
  onSelectTemplate,
  disabled = false,
}: BenefitsTemplateButtonsProps) {
  const templates = [
    {
      label: "One-time Credits",
      title: "One-time Credits Template",
      data: { oneTimeCredits: 1000 },
    },
    {
      label: "Monthly Credits",
      title: "Monthly Credits Template",
      data: { monthlyCredits: 1000 },
    },
    {
      label: "Yearly Credits",
      title: "Yearly Credits Template",
      data: { totalMonths: 12, monthlyCredits: 1000 },
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((template) => (
        <Button
          key={template.label}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const jsonString = JSON.stringify(template.data, null, 2);
            onSelectTemplate(jsonString);
          }}
          disabled={disabled}
          title={template.title}
        >
          <Zap className="h-3 w-3 mr-1" />
          {template.label}
        </Button>
      ))}
    </div>
  );
}
