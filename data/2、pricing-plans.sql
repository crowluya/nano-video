CREATE TABLE public.pricing_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    environment character varying(10) NOT NULL CHECK (environment IN ('test', 'live')),
    card_title text NOT NULL,
    card_description text NULL,
    stripe_price_id character varying(255) NULL,
    stripe_product_id character varying(255) NULL,
    payment_type character varying(50) NULL,
    recurring_interval character varying(50) NULL,
    trial_period_days integer NULL,
    price numeric NULL,
    currency character varying(10) NULL,
    display_price character varying(50) NULL,
    original_price character varying(50) NULL,
    price_suffix character varying(100) NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_highlighted boolean DEFAULT false NOT NULL,
    highlight_text text NULL,
    button_text text NULL,
    button_link text NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    lang_jsonb jsonb DEFAULT '{}'::jsonb NOT NULL,
    benefits_jsonb jsonb DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.pricing_plans IS 'Stores configuration for pricing plans displayed as cards on the frontend.';
COMMENT ON COLUMN public.pricing_plans.environment IS 'Specifies if the plan is for the ''test'' or ''live'' Stripe environment.';
COMMENT ON COLUMN public.pricing_plans.lang_jsonb IS 'Stores translations for text fields in JSON format, keyed by language code.';
COMMENT ON COLUMN public.pricing_plans.features IS 'JSON array of features, e.g., [{"description": "Feature One", "included": true}]';
COMMENT ON COLUMN public.pricing_plans.benefits_jsonb IS 'JSON object defining plan benefits. E.g., {"monthly_credits": 500} for recurring credits, {"one_time_credits": 1000} for one-off credits.';

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_pricing_plans_updated
BEFORE UPDATE ON public.pricing_plans
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active plans"
ON public.pricing_plans
FOR SELECT
TO PUBLIC
USING (is_active = true);
