import { DynamicIcon } from "@/components/DynamicIcon";
import { useTranslations } from "next-intl";

type Feature = {
  icon: string;
  title: string;
  description: string;
};

const FeatureCard = ({ feature }: { feature: Feature }) => {
  return (
    <div
      key={feature.title}
      className="card rounded-xl p-6 shadow-sm hover:shadow-md dark:shadow-indigo-900/10"
    >
      <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-4 highlight-bg text-white">
        {feature.icon && (
          <DynamicIcon name={feature.icon} className="size-6 shrink-0" />
        )}
      </div>
      <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
    </div>
  );
};

export default function Features() {
  const t = useTranslations("Landing.Features");

  const features: Feature[] = t.raw("items").map((item: any) => ({
    icon: item.icon,
    title: item.title,
    description: item.description,
  }));

  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="highlight-text">{chunks}</span>
              ),
            })}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
