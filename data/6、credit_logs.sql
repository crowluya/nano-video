-- Create the table to store credit transaction logs
CREATE TABLE public.credit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    amount INT NOT NULL, -- The amount of credits changed. Positive for addition, negative for deduction.
    one_time_balance_after INT NOT NULL, -- The user's one-time credit balance after this transaction.
    subscription_balance_after INT NOT NULL, -- The user's subscription credit balance after this transaction.
    type TEXT NOT NULL, -- The type of transaction, e.g., 'feature_usage', 'one_time_purchase', 'subscription_grant', 'refund_revoke'.
    notes TEXT, -- Additional details about the transaction, e.g., "Used AI summary feature".
    related_order_id uuid REFERENCES public.orders(id), -- Optional foreign key to the orders table.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.credit_logs.amount IS 'The amount of credits changed. Positive for additions, negative for deductions.';
COMMENT ON COLUMN public.credit_logs.one_time_balance_after IS 'The user''s one-time credit balance after this transaction.';
COMMENT ON COLUMN public.credit_logs.subscription_balance_after IS 'The user''s subscription credit balance after this transaction.';
COMMENT ON COLUMN public.credit_logs.type IS 'Type of transaction (e.g., ''feature_usage'', ''one_time_purchase'').';
COMMENT ON COLUMN public.credit_logs.notes IS 'Additional details or notes about the transaction.';
COMMENT ON COLUMN public.credit_logs.related_order_id IS 'Optional foreign key to the `orders` table, linking the log to a purchase or refund.';

CREATE INDEX idx_credit_logs_user_id ON public.credit_logs(user_id);

ALTER TABLE public.credit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow user to read their own credit logs"
ON public.credit_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Disallow user to modify credit logs"
ON public.credit_logs
FOR ALL USING (false) WITH CHECK (false);


--------------------------------------------------------------------------------
-- create RPCs
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_credits_and_log(
    p_user_id uuid,
    p_deduct_amount integer,
    p_notes text
)
RETURNS boolean AS $$
DECLARE
    v_current_one_time_credits integer;
    v_current_subscription_credits integer;
    v_total_credits integer;
    v_deducted_from_subscription integer;
    v_deducted_from_one_time integer;
    v_new_one_time_balance integer;
    v_new_subscription_balance integer;
BEGIN
    SELECT one_time_credits_balance, subscription_credits_balance
    INTO v_current_one_time_credits, v_current_subscription_credits
    FROM public.usage
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    v_total_credits := v_current_one_time_credits + v_current_subscription_credits;

    IF v_total_credits < p_deduct_amount THEN
        RETURN false;
    END IF;

    v_deducted_from_subscription := LEAST(v_current_subscription_credits, p_deduct_amount);
    v_deducted_from_one_time := p_deduct_amount - v_deducted_from_subscription;

    v_new_subscription_balance := v_current_subscription_credits - v_deducted_from_subscription;
    v_new_one_time_balance := v_current_one_time_credits - v_deducted_from_one_time;

    UPDATE public.usage
    SET
        subscription_credits_balance = v_new_subscription_balance,
        one_time_credits_balance = v_new_one_time_balance
    WHERE user_id = p_user_id;

    INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes)
    VALUES (p_user_id, -p_deduct_amount, v_new_one_time_balance, v_new_subscription_balance, 'feature_usage', p_notes);

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.grant_one_time_credits_and_log(
    p_user_id uuid,
    p_credits_to_add integer,
    p_related_order_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_new_one_time_balance integer;
    v_new_subscription_balance integer;
BEGIN
    INSERT INTO public.usage (user_id, one_time_credits_balance, subscription_credits_balance)
    VALUES (p_user_id, p_credits_to_add, 0)
    ON CONFLICT (user_id)
    DO UPDATE SET one_time_credits_balance = usage.one_time_credits_balance + p_credits_to_add
    RETURNING one_time_credits_balance, subscription_credits_balance INTO v_new_one_time_balance, v_new_subscription_balance;

    INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes, related_order_id)
    VALUES (p_user_id, p_credits_to_add, v_new_one_time_balance, v_new_subscription_balance, 'one_time_purchase', 'One-time credit purchase', p_related_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--- [v2.x UPDATE] grant_subscription_credits_and_log
DROP FUNCTION IF EXISTS public.grant_subscription_credits_and_log(uuid, integer, uuid);
CREATE OR REPLACE FUNCTION public.grant_subscription_credits_and_log(
    p_user_id uuid,
    p_credits_to_set integer,
    p_related_order_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_new_one_time_balance integer;
    v_new_subscription_balance integer;
    v_monthly_details jsonb;
BEGIN
    v_monthly_details := jsonb_build_object(
        'monthly_allocation_details', jsonb_build_object(
            'monthly_credits', p_credits_to_set
        )
    );
    INSERT INTO public.usage (user_id, one_time_credits_balance, subscription_credits_balance, balance_jsonb)
    VALUES (p_user_id, 0, p_credits_to_set, v_monthly_details)
    ON CONFLICT (user_id)
    DO UPDATE SET
        subscription_credits_balance = p_credits_to_set,
        balance_jsonb = COALESCE(public.usage.balance_jsonb, '{}'::jsonb) - 'monthly_allocation_details' || v_monthly_details
    RETURNING one_time_credits_balance, subscription_credits_balance INTO v_new_one_time_balance, v_new_subscription_balance;

    INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes, related_order_id)
    VALUES (p_user_id, p_credits_to_set, v_new_one_time_balance, v_new_subscription_balance, 'subscription_grant', 'Subscription credits granted/reset', p_related_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--- [v2.x ADD] initialize_or_reset_yearly_allocation
DROP FUNCTION IF EXISTS public.initialize_or_reset_yearly_allocation(uuid, integer, integer, timestamptz, uuid);
CREATE OR REPLACE FUNCTION initialize_or_reset_yearly_allocation(
    p_user_id uuid,
    p_total_months integer,
    p_monthly_credits integer,
    p_subscription_start_date timestamptz,
    p_related_order_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_yearly_details jsonb;
    v_new_one_time_balance integer;
    v_new_subscription_balance integer;
BEGIN
    v_yearly_details := jsonb_build_object(
        'yearly_allocation_details', jsonb_build_object(
            'remaining_months', p_total_months - 1,
            'next_credit_date', p_subscription_start_date + INTERVAL '1 month',
            'monthly_credits', p_monthly_credits,
            'last_allocated_month', to_char(p_subscription_start_date, 'YYYY-MM')
        )
    );

    INSERT INTO public.usage (user_id, subscription_credits_balance, balance_jsonb)
    VALUES (p_user_id, p_monthly_credits, v_yearly_details)
    ON CONFLICT (user_id)
    DO UPDATE SET
        subscription_credits_balance = p_monthly_credits,
        balance_jsonb = COALESCE(public.usage.balance_jsonb, '{}'::jsonb) - 'yearly_allocation_details' || v_yearly_details
    RETURNING one_time_credits_balance, subscription_credits_balance INTO v_new_one_time_balance, v_new_subscription_balance;

    INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes, related_order_id)
    VALUES (p_user_id, p_monthly_credits, v_new_one_time_balance, v_new_subscription_balance, 'subscription_grant', 'Yearly plan initial credits granted', p_related_order_id);
END;
$$;


--- [v2.x ADD] allocate_specific_monthly_credit_for_year_plan
DROP FUNCTION IF EXISTS public.allocate_specific_monthly_credit_for_year_plan(uuid, integer, text);
CREATE OR REPLACE FUNCTION allocate_specific_monthly_credit_for_year_plan(
    p_user_id uuid,
    p_monthly_credits integer,
    p_current_yyyy_mm text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usage_record RECORD;
    v_yearly_details jsonb;
    v_new_yearly_details jsonb;
BEGIN
    SELECT * INTO v_usage_record FROM public.usage WHERE user_id = p_user_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE WARNING 'User usage record not found for user_id: %', p_user_id;
        RETURN;
    END IF;

    v_yearly_details := v_usage_record.balance_jsonb->'yearly_allocation_details';

    IF v_yearly_details IS NULL THEN
        RAISE WARNING 'Yearly allocation details not found for user_id: %', p_user_id;
        RETURN;
    END IF;

    IF (v_yearly_details->>'remaining_months')::integer > 0 AND
        NOW() >= (v_yearly_details->>'next_credit_date')::timestamptz AND
        v_yearly_details->>'last_allocated_month' <> p_current_yyyy_mm THEN

        v_new_yearly_details := jsonb_set(
            jsonb_set(
                jsonb_set(
                    v_yearly_details,
                    '{remaining_months}',
                    to_jsonb((v_yearly_details->>'remaining_months')::integer - 1)
                ),
                '{next_credit_date}',
                to_jsonb((v_yearly_details->>'next_credit_date')::timestamptz + INTERVAL '1 month')
            ),
            '{last_allocated_month}',
            to_jsonb(p_current_yyyy_mm)
        );

        UPDATE public.usage
        SET
            subscription_credits_balance = p_monthly_credits,
            balance_jsonb = jsonb_set(usage.balance_jsonb, '{yearly_allocation_details}', v_new_yearly_details)
        WHERE user_id = p_user_id;

    ELSE
      RAISE LOG 'Skipping credit allocation for user % for month % (remaining: %, next_date: %, last_allocated: %)', 
                  p_user_id, p_current_yyyy_mm, v_yearly_details->>'remaining_months', v_yearly_details->>'next_credit_date', v_yearly_details->>'last_allocated_month';
    END IF;
END;
$$;

--- [v2.x UPDATE] revoke_credits_and_log
DROP FUNCTION IF EXISTS public.revoke_credits_and_log(uuid, integer, integer, text, text, uuid);
CREATE OR REPLACE FUNCTION public.revoke_credits_and_log(
    p_user_id uuid,
    p_revoke_one_time integer,
    p_revoke_subscription integer,
    p_log_type text,
    p_notes text,
    p_related_order_id uuid DEFAULT NULL,
    p_clear_yearly_details boolean DEFAULT false,
    p_clear_monthly_details boolean DEFAULT false
)
RETURNS void AS $$
DECLARE
    v_current_one_time_bal integer;
    v_current_sub_bal integer;
    v_new_one_time_bal integer;
    v_new_sub_bal integer;
    v_current_balance_jsonb jsonb;
    v_new_balance_jsonb jsonb;
    v_amount_revoked integer;
BEGIN
    IF p_revoke_one_time < 0 OR p_revoke_subscription < 0 THEN
        RAISE WARNING 'Revoke amounts cannot be negative. User: %, One-Time: %, Subscription: %', p_user_id, p_revoke_one_time, p_revoke_subscription;
        RETURN;
    END IF;

    SELECT
        one_time_credits_balance,
        subscription_credits_balance,
        balance_jsonb
    INTO
        v_current_one_time_bal,
        v_current_sub_bal,
        v_current_balance_jsonb
    FROM public.usage
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    v_new_one_time_bal := GREATEST(0, v_current_one_time_bal - p_revoke_one_time);
    v_new_sub_bal := GREATEST(0, v_current_sub_bal - p_revoke_subscription);

    v_new_balance_jsonb := COALESCE(v_current_balance_jsonb, '{}'::jsonb);
    
    IF p_clear_yearly_details THEN
        v_new_balance_jsonb := v_new_balance_jsonb - 'yearly_allocation_details';
    END IF;
    
    IF p_clear_monthly_details THEN
        v_new_balance_jsonb := v_new_balance_jsonb - 'monthly_allocation_details';
    END IF;

    IF v_new_one_time_bal <> v_current_one_time_bal OR 
        v_new_sub_bal <> v_current_sub_bal OR 
        v_new_balance_jsonb <> v_current_balance_jsonb THEN
        
        UPDATE public.usage
        SET
            one_time_credits_balance = v_new_one_time_bal,
            subscription_credits_balance = v_new_sub_bal,
            balance_jsonb = v_new_balance_jsonb
        WHERE user_id = p_user_id;

        v_amount_revoked := (v_current_one_time_bal - v_new_one_time_bal) + (v_current_sub_bal - v_new_sub_bal);

        IF v_amount_revoked > 0 THEN
            INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes, related_order_id)
            VALUES (p_user_id, -v_amount_revoked, v_new_one_time_bal, v_new_sub_bal, p_log_type, p_notes, p_related_order_id);
        END IF;
    END IF;

EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error in revoke_credits_and_log for user %: %', p_user_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

