"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

interface DeletePlanDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string | null;
  planTitle: string | null;
  onConfirmDelete: (planId: string) => Promise<void>;
}

export function DeletePlanDialog({
  isOpen,
  onOpenChange,
  planId,
  planTitle,
  onConfirmDelete,
}: DeletePlanDialogProps) {
  const t = useTranslations("Prices.DeletePlanDialog");

  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    if (!planId) return;
    setIsDeleting(true);
    try {
      await onConfirmDelete(planId);
    } catch (error) {
      console.error("Deletion failed from dialog:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  React.useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false);
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {t("description", { title: planTitle || `ID: ${planId}` })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t("cancelButton")}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            {isDeleting ? t("deleting") : t("deleteButton")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
