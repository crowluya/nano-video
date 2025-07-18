import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Hero() {
  const t = useTranslations("Landing.Hero");

  return (
    <section className="py-20 bg-gradient-to-b from-white to-indigo-50 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          {/* Left Content */}
          <div className="mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {t.rich("title", {
                highlight: (chunks) => (
                  <span className="highlight-text">{chunks}</span>
                ),
              })}
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              {t("description")}
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <I18nLink
                href={process.env.NEXT_PUBLIC_PRICING_PATH!}
                title={t("getStarted")}
                prefetch={false}
                className="highlight-bg text-white px-8 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-lg"
              >
                {t("getStarted")}
              </I18nLink>
              <Link
                href="https://docs.nexty.dev/docs"
                target="_blank"
                title={t("viewDocs")}
                className="border border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 px-8 py-3 rounded-lg font-medium text-center hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
              >
                {t("viewDocs")}
              </Link>
            </div>
          </div>

          {/* Right Content - Code Window */}
          <div className="w-full relative">
            <div className="code-window animate-float shadow-2xl max-w-lg mx-auto">
              <div className="code-header">
                <div className="window-btn btn-red"></div>
                <div className="window-btn btn-yellow"></div>
                <div className="window-btn btn-green"></div>
                <div className="ml-2 text-muted-foreground text-sm">
                  app/[locale]/page.tsx
                </div>
              </div>
              <div className="p-6">
                <pre className="text-green-400 font-mono text-sm">
                  <span className="text-pink-400">import</span>{" "}
                  <span className="text-blue-400">{"{ useState }"}</span>{" "}
                  <span className="text-pink-400">from</span>{" "}
                  <span className="">&apos;react&apos;</span>;{"\n"}
                  <span className="text-pink-400">import</span>{" "}
                  <span className="text-blue-400">{"{ useTranslations }"}</span>{" "}
                  <span className="text-pink-400">from</span>{" "}
                  <span className="">&apos;next-intl&apos;</span>;{"\n"}
                  <span className="text-pink-400">import</span>{" "}
                  <span className="text-blue-400">{"{ useAuth }"}</span>{" "}
                  <span className="text-pink-400">from</span>{" "}
                  <span className="">&apos;@/providers/AuthProvider&apos;</span>
                  ;{"\n"}
                  <span className="text-pink-400">import</span>{" "}
                  <span className="text-blue-400">
                    {"{ AIImageGenerator }"}
                  </span>{" "}
                  <span className="text-pink-400">from</span>{" "}
                  <span className="">&apos;@/components&apos;</span>;{"\n\n"}
                  <span className="text-purple-400">
                    export default function
                  </span>{" "}
                  <span className="text-yellow-300">HomePage</span>() {"{"}
                  {"\n  "}
                  <span className="text-pink-400">const</span> {"{ t }"} ={" "}
                  <span className="text-yellow-300">useTranslations</span>();
                  {"\n  "}
                  <span className="text-pink-400">const</span> {"{ user }"} ={" "}
                  <span className="text-yellow-300">useAuth</span>();
                  {"\n  \n  "}
                  <span className="text-pink-400">return</span> ({"\n    "}
                  <span className="text-blue-300">
                    &lt;div className=&quot;container&quot;&gt;
                  </span>
                  {"\n      "}
                  <span className="text-blue-300">&lt;h1&gt;</span>
                  {"{ t('welcome', { name: user?.name }) }"}
                  <span className="text-blue-300">&lt;/h1&gt;</span>
                  {"\n      "}
                  <span className="text-blue-300">
                    &lt;AIImageGenerator /&gt;
                  </span>
                  {"\n    "}
                  <span className="text-blue-300">&lt;/div&gt;</span>
                  {"\n  "});
                  {"\n}"}
                </pre>
              </div>
            </div>

            <div className="absolute top-1/4 -right-2 md:-right-8 w-16 h-16 bg-yellow-400 rounded-full opacity-70"></div>
            <div className="absolute bottom-1/4 -left-8 w-24 h-24 bg-purple-500 rounded-full opacity-70"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
