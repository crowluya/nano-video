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
  const currentLocale = await getLocale();

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
    <div className=" py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden backdrop-blur-sm">
          <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 p-6 text-center">
            <h1 className="text-2xl font-bold text-white">
              {t("unsubscribe.title")}
            </h1>
          </div>

          <div className="p-6">
            {tokenValidation.isValid ? (
              <UnsubscribeForm
                token={token}
                email={tokenValidation.email}
                locale={currentLocale}
                adminEmail={process.env.ADMIN_EMAIL || ""}
              />
            ) : (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                  <p className="text-red-800 dark:text-red-300 font-medium">
                    {tokenValidation.error}
                  </p>
                </div>

                <p className="text-muted-foreground">
                  {t("unsubscribe.errorMessage")}
                </p>

                <div className="pt-4 mt-6 border-t border-border">
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
          </div>
        </div>
      </div>
    </div>
  );
}
