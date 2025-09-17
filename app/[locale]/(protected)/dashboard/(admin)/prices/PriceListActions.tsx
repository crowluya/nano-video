"use client";

import { deletePricingPlanAction } from "@/actions/prices/admin";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_LOCALE, Link as I18nLink, useRouter } from "@/i18n/routing";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { DeletePlanDialog } from "./DeletePlanDialog";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;
interface PriceListActionsProps {
  plan: PricingPlan;
}

export function PriceListActions({ plan }: PriceListActionsProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Prices.PricesDataTable");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PricingPlan | null>(null);

  const handleDuplicate = () => {
    router.push(`/dashboard/prices/new?duplicatePlanId=${plan.id}`);
  };

  const handleOpenDeleteDialog = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropdownOpen(false);
    setPlanToDelete(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (planId: string) => {
    if (!planId) {
      toast.error("Plan ID is required");
      return;
    }
    try {
      const result = await deletePricingPlanAction({
        id: planId,
        locale: locale || DEFAULT_LOCALE,
      });

      if (!result.success) {
        throw new Error(result.error || t("deleteError2"));
      }

      toast.success(
        t("deleteSuccess", { title: planToDelete?.cardTitle || planId })
      );
      setIsDeleteDialogOpen(false);
      setPlanToDelete(null);
      router.refresh();
    } catch (error: any) {
      console.error("Deletion failed:", error);
      toast.error(`Deletion failed: ${error.message}`);
    }
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <I18nLink
              href={`/dashboard/prices/${plan.id}/edit`}
              title="Edit Plan"
              prefetch={false}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </I18nLink>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-700 focus:bg-red-100"
            onClick={handleOpenDeleteDialog}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeletePlanDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        planId={planToDelete?.id ?? null}
        planTitle={planToDelete?.cardTitle ?? null}
        onConfirmDelete={handleConfirmDelete}
      />
    </>
  );
}
