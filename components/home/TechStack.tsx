import { DynamicIcon } from "@/components/DynamicIcon";
import { colors } from "@/config/colors";
import { Link as I18nLink } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

type Technology = {
  name: string;
  description: string;
  logo: string;
};

type TechGroupConfig = {
  title: string;
  icon: string;
  description: string;
  color?: keyof typeof colors;
  items: Technology[];
};

type TechGroup = TechGroupConfig & {
  colorClass: string;
  borderClass: string;
  iconClass: string;
};

export default function TechStack() {
  const t = useTranslations("Landing.TechStack");

  const techGroups: TechGroup[] = t
    .raw("groups")
    .map((group: TechGroupConfig) => ({
      title: group.title,
      icon: group.icon,
      description: group.description,
      colorClass: colors[group.color || "default"].bg,
      borderClass: colors[group.color || "default"].border,
      iconClass: colors[group.color || "default"].text,
      items: group.items.map((item: any) => ({
        name: item.name,
        description: item.description,
        logo: item.logo,
      })),
    }));

  const technologies: Technology[] = techGroups.flatMap((group) => group.items);

  return (
    <section id="tech-stack" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block py-1 px-3 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 mb-4">
            {t("badge")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="gradient-text">{chunks}</span>
              ),
            })}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-16">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className="flex flex-col items-center p-4 bg-gray-100/20 dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 group"
            >
              <div className="relative mb-3 p-2 rounded-lg dark:bg-gray-200">
                <img
                  src={tech.logo}
                  alt={tech.name}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h3 className="font-medium text-center">{tech.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                {tech.description}
              </p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {techGroups.map((group) => (
            <div
              key={group.title}
              className={`rounded-xl ${group.colorClass} border ${group.borderClass} p-6 flex flex-col h-full hover:shadow-lg transition-all`}
            >
              <div
                className={`p-3 rounded-lg w-fit ${group.iconClass} flex items-center gap-2`}
              >
                <DynamicIcon name={group.icon} className="w-6 h-6" />
                <h3 className="text-xl font-semibold">{group.title}</h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {group.description}
              </p>

              <div className="mt-auto flex flex-wrap gap-2">
                {group.items.map((tech) => (
                  <span
                    key={tech.name}
                    className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700"
                  >
                    <img
                      src={tech.logo}
                      alt={tech.name}
                      className="w-3 h-3 mr-1"
                    />
                    {tech.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50/30 dark:from-blue-950/30 dark:to-indigo-950/10 p-8 shadow-sm hover:shadow-md transition-all border border-blue-100 dark:border-blue-900/30">
          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-blue-100/50 dark:bg-blue-800/10 blur-3xl"></div>
          <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-indigo-100/50 dark:bg-indigo-800/10 blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-3">{t("footer.title")}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t("footer.description")}
              </p>
            </div>

            <I18nLink
              href={process.env.NEXT_PUBLIC_PRICING_PATH!}
              title="Pricing"
              prefetch={false}
              className="flex-shrink-0 w-16 h-16 rounded-full bg-white dark:bg-gray-200 shadow-md hover:shadow-lg flex items-center justify-center group transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <ArrowRight className="w-6 h-6 text-indigo-600  group-hover:translate-x-1 transition-transform" />
            </I18nLink>
          </div>
        </div>
      </div>
    </section>
  );
}
