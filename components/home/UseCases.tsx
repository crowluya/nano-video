import { DynamicIcon } from "@/components/DynamicIcon";
import { colors } from "@/config/colors";
import { useTranslations } from "next-intl";

type UserCaseConfig = {
  title: string;
  description: string;
  tags: string[];
  image: string;
  icon: string;
  color?: keyof typeof colors;
};

type UseCase = UserCaseConfig & {
  iconBg: string;
  bgColor: string;
  tagBg: string;
  tagTextColor: string;
};

export default function UseCases() {
  const t = useTranslations("Landing.UseCases");

  const useCases: UseCase[] = t.raw("cases").map((item: UserCaseConfig) => ({
    title: item.title,
    description: item.description,
    tags: item.tags,
    image: item.image,
    icon: item.icon,
    iconBg: colors[item.color || "default"].iconBg,
    bgColor: colors[item.color || "default"].bg,
    tagBg: colors[item.color || "default"].tagBg,
    tagTextColor: colors[item.color || "default"].text,
  }));

  return (
    <section id="use-cases" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="highlight-text">{chunks}</span>
              ),
            })}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="card rounded-xl p-6 overflow-hidden shadow-sm border hover:shadow-md dark:border-gray-800 dark:hover:border-indigo-900/30"
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-lg text-gray-700 dark:text-gray-200 ${useCase.iconBg} flex items-center justify-center`}
                >
                  <DynamicIcon name={useCase.icon} className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">{useCase.title}</h3>
              </div>

              <p className="text-muted-foreground mb-4">
                {useCase.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {useCase.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`${useCase.tagBg} ${useCase.tagTextColor} text-xs px-2 py-1 rounded`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
