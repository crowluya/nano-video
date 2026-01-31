import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Locale } from "@/i18n/routing";
import { Mail } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import UnsubscribeForm from "./UnsubscribeForm";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function validateToken(token: string, locale: string) {
  try {
    const email = Buffer.from(token, "base64").toString();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, email: "", error: "Invalid token format" };
    }

    return { isValid: true, email, error: "" };
  } catch (error) {
    return { isValid: false, email: "", error: "Invalid token" };
  }
}

export default async function Page(props: { searchParams: SearchParams }) {
  const t = await getTranslations("Footer.Newsletter");
  const currentLocale = (await getLocale()) as Locale;

  const searchParams = await props.searchParams;
  const token = searchParams.token as string;

  let tokenValidation = { isValid: false, email: "", error: "" };
  if (!token) {
    tokenValidation.error = t("unsubscribe.errorNoToken");
  } else {
    tokenValidation = await validateToken(token, currentLocale);
    if (!tokenValidation.isValid) {
      tokenValidation.error = t("unsubscribe.errorInvalidToken");
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              {t("unsubscribe.title")}
            </CardTitle>
            <CardDescription className="text-base">
              {tokenValidation.isValid
                ? t("unsubscribe.confirmMessage")
                : t("unsubscribe.errorGeneric")}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {tokenValidation.isValid ? (
            <UnsubscribeForm
              token={token}
              email={tokenValidation.email}
              locale={currentLocale}
              adminEmail={process.env.ADMIN_EMAIL || ""}
            />
          ) : (
            <div className="space-y-6">
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-center">
                <p className="text-destructive font-medium">
                  {tokenValidation.error}
                </p>
              </div>

              <div className="pt-4 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                  {t("unsubscribe.contactPrefix")}
                  <a
                    href={`mailto:${process.env.ADMIN_EMAIL}`}
                    title={process.env.ADMIN_EMAIL}
                    className="text-primary hover:text-primary/80 ml-1 hover:underline transition-colors"
                    target="_blank"
                  >
                    {process.env.ADMIN_EMAIL}
                  </a>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
